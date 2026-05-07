/**
 * Supabase-implementation av DAL.
 *
 * Skriver via service-role-klient (bypassar RLS). Audit-events skrivs ALLTID
 * via RPC `append_audit_event` så hash-chain beräknas server-side i Postgres.
 *
 * Schema är applicerat via supabase/migrations/20260507_concent_initial_schema.sql.
 *
 * Mapping DB → Consent-typen:
 *   - DB lagrar flata kolumner (initiator_pno_hash, etc.)
 *   - Consent-typen har nested Party-objekt
 *   - rowToConsent() gör översättningen
 *   - Party.id är härledd från consent_id + role (DB har ingen separat party-tabell)
 */
import type { Consent, ConsentStatus } from "@/lib/types";
import { computeActivatesAt } from "@/lib/consent/delay";
import { serviceClient } from "@/lib/supabase/client";
import type { CreateConsentInput, Dal, SignConsentInput } from "./types";

interface ConsentRow {
  id: string;
  initiator_pno_hash: string;
  initiator_display_name: string;
  initiator_signed_at: string;
  counterparty_pno_hash: string | null;
  counterparty_display_name: string | null;
  counterparty_signed_at: string | null;
  created_at: string;
  both_signed_at: string | null;
  activates_at: string | null;
  revoked_at: string | null;
  revoked_by: "initiator" | "counterparty" | null;
  status: ConsentStatus;
  scope: string;
  message: string | null;
  payment_intent_id: string | null;
  paid_at: string | null;
  redacted: boolean;
  redacted_at: string | null;
}

function rowToConsent(row: ConsentRow): Consent {
  return {
    id: row.id,
    initiator: {
      id: `${row.id}-initiator`,
      pnoHash: row.initiator_pno_hash,
      displayName: row.initiator_display_name,
      signedAt: row.initiator_signed_at
    },
    counterparty: {
      id: `${row.id}-counterparty`,
      pnoHash: row.counterparty_pno_hash ?? "",
      displayName: row.counterparty_display_name ?? "",
      signedAt: row.counterparty_signed_at
    },
    createdAt: row.created_at,
    bothSignedAt: row.both_signed_at,
    activatesAt: row.activates_at,
    revokedAt: row.revoked_at,
    revokedBy: row.revoked_by,
    status: row.status,
    scope: row.scope,
    message: row.message
  };
}

/** Beräknar status lat vid läsning (matchar inMemoryDal-mönstret). */
function recomputeStatus(c: Consent, now: Date): Consent {
  if (c.revokedAt) return { ...c, status: "revoked" };
  if (c.activatesAt && now.getTime() >= new Date(c.activatesAt).getTime()) {
    return { ...c, status: "active" };
  }
  return c;
}

/**
 * Append audit-event via RPC. Misslyckas TYST i loggen — vi vill inte att
 * audit-fel kraschar consent-flöde, men vi måste larma. TODO: hooka till
 * monitoring (Sentry/Logtail) när deployed.
 */
async function appendAudit(params: {
  consentId: string;
  action:
    | "consent_created"
    | "initiator_signed"
    | "counterparty_signed"
    | "consent_activated"
    | "consent_revoked"
    | "consent_expired"
    | "payment_completed"
    | "redacted";
  actorPnoHash?: string | null;
  actorRole?: "initiator" | "counterparty" | "system" | null;
  payload: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const sb = serviceClient();
  const { error } = await sb.rpc("append_audit_event", {
    p_consent_id: params.consentId,
    p_action: params.action,
    p_actor_pno_hash: params.actorPnoHash ?? null,
    p_actor_role: params.actorRole ?? null,
    p_payload: params.payload,
    p_ip: params.ip ?? null,
    p_user_agent: params.userAgent ?? null
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error("[audit_log] append failed:", error);
    // TODO: send to monitoring
  }
}

export const supabaseDal: Dal = {
  async createConsent(input: CreateConsentInput): Promise<Consent> {
    const sb = serviceClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await sb
      .from("consents")
      .insert({
        initiator_pno_hash: input.initiatorPnoHash,
        initiator_display_name: input.initiatorDisplayName,
        initiator_signed_at: nowIso,
        scope: input.scope,
        message: input.message ?? null,
        status: "pending"
      })
      .select("*")
      .single<ConsentRow>();

    if (error || !data) {
      throw new Error(`createConsent failed: ${error?.message ?? "no row"}`);
    }

    await appendAudit({
      consentId: data.id,
      action: "consent_created",
      actorPnoHash: input.initiatorPnoHash,
      actorRole: "initiator",
      payload: { scope: input.scope, has_message: input.message != null }
    });

    return rowToConsent(data);
  },

  async getConsent(id: string): Promise<Consent | null> {
    const sb = serviceClient();
    const { data, error } = await sb
      .from("consents")
      .select("*")
      .eq("id", id)
      .maybeSingle<ConsentRow>();

    if (error) throw new Error(`getConsent failed: ${error.message}`);
    if (!data) return null;
    return recomputeStatus(rowToConsent(data), new Date());
  },

  async listConsentsByPno(pnoHash: string): Promise<Consent[]> {
    const sb = serviceClient();
    const { data, error } = await sb
      .from("consents")
      .select("*")
      .or(`initiator_pno_hash.eq.${pnoHash},counterparty_pno_hash.eq.${pnoHash}`)
      .eq("redacted", false)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`listConsentsByPno failed: ${error.message}`);
    const now = new Date();
    return (data ?? []).map((row) => recomputeStatus(rowToConsent(row as ConsentRow), now));
  },

  async signConsent(input: SignConsentInput): Promise<Consent> {
    const sb = serviceClient();

    // Hämta nuvarande tillstånd för att avgöra activates_at
    const current = await this.getConsent(input.consentId);
    if (!current) throw new Error("consent not found");
    if (current.revokedAt) throw new Error("consent revoked");

    const nowDate = new Date();
    const nowIso = nowDate.toISOString();

    let bothSignedAt: string | null = current.bothSignedAt;
    let activatesAt: string | null = current.activatesAt;

    // Om denna signering är den som gör båda klara, beräkna fönstret
    const otherSigned =
      input.role === "initiator"
        ? current.counterparty.signedAt
        : current.initiator.signedAt;
    if (otherSigned && !bothSignedAt) {
      bothSignedAt = nowIso;
      activatesAt = computeActivatesAt(nowDate).toISOString();
    }

    const updates: Record<string, unknown> = {
      both_signed_at: bothSignedAt,
      activates_at: activatesAt
    };
    if (input.role === "initiator") {
      updates.initiator_pno_hash = input.pnoHash;
      updates.initiator_display_name = input.displayName;
      updates.initiator_signed_at = nowIso;
    } else {
      updates.counterparty_pno_hash = input.pnoHash;
      updates.counterparty_display_name = input.displayName;
      updates.counterparty_signed_at = nowIso;
    }

    const { data, error } = await sb
      .from("consents")
      .update(updates)
      .eq("id", input.consentId)
      .select("*")
      .single<ConsentRow>();

    if (error || !data) {
      throw new Error(`signConsent failed: ${error?.message ?? "no row"}`);
    }

    await appendAudit({
      consentId: data.id,
      action: input.role === "initiator" ? "initiator_signed" : "counterparty_signed",
      actorPnoHash: input.pnoHash,
      actorRole: input.role,
      payload: {
        signed_at: nowIso,
        both_signed: bothSignedAt != null,
        activates_at: activatesAt
      }
    });

    return recomputeStatus(rowToConsent(data), nowDate);
  },

  async revokeConsent(id: string, by: "initiator" | "counterparty"): Promise<Consent> {
    const sb = serviceClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await sb
      .from("consents")
      .update({
        revoked_at: nowIso,
        revoked_by: by,
        status: "revoked"
      })
      .eq("id", id)
      .select("*")
      .single<ConsentRow>();

    if (error || !data) {
      throw new Error(`revokeConsent failed: ${error?.message ?? "no row"}`);
    }

    await appendAudit({
      consentId: data.id,
      action: "consent_revoked",
      actorRole: by,
      payload: { revoked_at: nowIso }
    });

    return rowToConsent(data);
  },

  async reconcileStatuses(now: Date): Promise<{ updated: number }> {
    const sb = serviceClient();
    const { data, error } = await sb
      .rpc("reconcile_consent_statuses", { p_now: now.toISOString() })
      .single<{ updated_count: number }>();

    if (error) {
      throw new Error(`reconcileStatuses failed: ${error.message}`);
    }
    return { updated: Number(data?.updated_count ?? 0) };
  }
};
