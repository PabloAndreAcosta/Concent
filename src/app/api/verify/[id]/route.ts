import { NextResponse } from "next/server";
import { z } from "zod";
import { serviceClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";

/**
 * Public verify-endpoint. Returnerar audit-kedjan för en consent + per-event
 * integritetsflaggor (hash_intact, link_intact). Behöver INGEN auth — det är
 * tanken: vem som helst (även en domstol) ska kunna verifiera kedjan utan
 * att ha åtkomst till databasen.
 *
 * I test-läge returnerar vi 503 — verify-funktionen behöver Supabase.
 *
 * Säkerhet: vi exponerar inte payload-fält som innehåller känslig data.
 * actor_pno_hash är hashat (HMAC-SHA-256) och därmed icke-läsbart.
 *
 * Rate limiting: TODO innan publicering — risk för enumeration-attacker mot
 * consent-IDs. Mitigering: UUID v4 har 122 bitar entropy → praktiskt
 * obrute-force:bar.
 */

interface VerifyRow {
  event_id: number;
  action: string;
  actor_role: string | null;
  payload: Record<string, unknown>;
  previous_hash: string | null;
  current_hash: string;
  created_at: string;
  hash_intact: boolean;
  link_intact: boolean;
}

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  if (config.mode !== "live") {
    return NextResponse.json(
      { error: "verify endpoint requires APP_MODE=live (Supabase)" },
      { status: 503 }
    );
  }

  let rows: VerifyRow[];
  try {
    const sb = serviceClient();
    const { data, error } = await sb.rpc("verify_audit_chain", {
      p_consent_id: parsed.data.id
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[verify] rpc failed:", error);
      return NextResponse.json({ error: "verify_failed" }, { status: 500 });
    }
    rows = (data ?? []) as VerifyRow[];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[verify] unexpected:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const chainIntact = rows.every((r) => r.hash_intact && r.link_intact);

  return NextResponse.json({
    consent_id: parsed.data.id,
    chain_intact: chainIntact,
    event_count: rows.length,
    events: rows.map((r) => ({
      id: r.event_id,
      action: r.action,
      actor_role: r.actor_role,
      created_at: r.created_at,
      previous_hash: r.previous_hash,
      current_hash: r.current_hash,
      hash_intact: r.hash_intact,
      link_intact: r.link_intact,
      // Inkludera payload för transparens (innehåller inga klartext-personnummer)
      payload: r.payload
    })),
    verification_method: {
      hash_algorithm: "SHA-256",
      canonical_format: "Postgres jsonb_build_object(...)::text",
      personal_number_protection: "HMAC-SHA-256 (rainbow-table-skyddad)",
      append_only: "trigger-enforced UPDATE/DELETE blockering"
    }
  });
}
