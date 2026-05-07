import { serviceClient } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Publik verify-sida. Visar audit-kedjan för en consent i läsbar form.
 *
 * Designval:
 *   - Tillgänglig utan auth (vem som helst kan verifiera kedjan)
 *   - Server-renderad så att domstols-beställda hash-verifieringar inte beror
 *     på klient-side JS
 *   - Linkbar från consent-detail-sidan (för "visa kedjan")
 *
 * I test-läge visar vi en informativ no-data-page eftersom verify_audit_chain
 * är en Postgres-funktion som inte finns i in-memory.
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

const ACTION_LABELS: Record<string, string> = {
  consent_created: "Samtycke skapat",
  initiator_signed: "Initiator signerade",
  counterparty_signed: "Motpart signerade",
  consent_activated: "Samtycke aktiverat",
  consent_revoked: "Samtycke återkallat",
  consent_expired: "Samtycke utgånget",
  payment_completed: "Betalning genomförd",
  redacted: "Personuppgifter redacted (GDPR)"
};

export default async function VerifyPage({ params }: { params: { id: string } }) {
  if (config.mode !== "live") {
    return (
      <div className="card">
        <h1>Verifiering kräver live-läge</h1>
        <p className="muted">
          Den här sidan verifierar audit-kedjan för ett samtycke server-side mot
          Supabase. I test-läge (APP_MODE=test) finns inte Postgres-funktionen
          som behövs.
        </p>
        <p>
          Sätt APP_MODE=live + SUPABASE_* env och starta om för att aktivera.
        </p>
      </div>
    );
  }

  let rows: VerifyRow[] = [];
  try {
    const sb = serviceClient();
    const { data, error } = await sb.rpc("verify_audit_chain", {
      p_consent_id: params.id
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[verify-page] rpc failed:", error);
      throw new Error("verify_failed");
    }
    rows = (data ?? []) as VerifyRow[];
  } catch {
    notFound();
  }

  if (rows.length === 0) notFound();

  const chainIntact = rows.every((r) => r.hash_intact && r.link_intact);

  return (
    <div className="card">
      <span className="eyebrow">Verifiering</span>
      <h1>Audit-kedja</h1>
      <p className="muted" style={{ wordBreak: "break-all" }}>
        Consent: <code>{params.id}</code>
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          background: chainIntact ? "rgba(46, 160, 67, 0.1)" : "rgba(248, 81, 73, 0.1)",
          border: `1px solid ${chainIntact ? "var(--ok)" : "var(--err)"}`
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600 }}>
          {chainIntact ? "✓ Kedjan är intakt" : "✗ Kedjan är BRUTEN"}
        </div>
        <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
          {rows.length} händelse{rows.length === 1 ? "" : "r"}, alla hashar
          recompute:ade server-side mot Postgres-funktion verify_audit_chain.
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Händelseförlopp</h3>
      <ol style={{ paddingLeft: 0, listStyle: "none" }}>
        {rows.map((r, i) => {
          const ok = r.hash_intact && r.link_intact;
          return (
            <li
              key={r.event_id}
              style={{
                position: "relative",
                marginBottom: 16,
                padding: 14,
                background: "#0f0f0f",
                borderRadius: 10,
                borderLeft: `3px solid ${ok ? "var(--ok)" : "var(--err)"}`
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  gap: 8
                }}
              >
                <strong>
                  #{i + 1} — {ACTION_LABELS[r.action] ?? r.action}
                </strong>
                <span className="muted" style={{ fontSize: 12 }}>
                  {new Date(r.created_at).toLocaleString("sv-SE")}
                </span>
              </div>
              {r.actor_role && (
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  Av: {r.actor_role}
                </div>
              )}
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--usha-gold)" }}>
                  Hash-detaljer
                </summary>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: "ui-monospace, monospace",
                    fontSize: 11,
                    wordBreak: "break-all",
                    color: "#bbb"
                  }}
                >
                  <div>
                    <strong>previous_hash:</strong> {r.previous_hash ?? "(första händelsen, null)"}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <strong>current_hash:</strong> {r.current_hash}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <strong>hash_intact:</strong>{" "}
                    <span style={{ color: r.hash_intact ? "var(--ok)" : "var(--err)" }}>
                      {String(r.hash_intact)}
                    </span>
                  </div>
                  <div>
                    <strong>link_intact:</strong>{" "}
                    <span style={{ color: r.link_intact ? "var(--ok)" : "var(--err)" }}>
                      {String(r.link_intact)}
                    </span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong>payload:</strong>
                    <pre
                      style={{
                        marginTop: 4,
                        padding: 8,
                        background: "#000",
                        borderRadius: 6,
                        overflowX: "auto",
                        fontSize: 11
                      }}
                    >
                      {JSON.stringify(r.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      <h3 style={{ marginTop: 24 }}>Verifieringsmetod</h3>
      <ul className="muted" style={{ fontSize: 13 }}>
        <li>SHA-256 av canonical JSON ({"{"}consent_id, action, actor_*, payload, previous_hash{"}"})</li>
        <li>Personnummer skyddade med HMAC-SHA-256 (rainbow-table-skyddade)</li>
        <li>UPDATE/DELETE på audit_log blockerade av Postgres-trigger</li>
        <li>Service-role bypassar RLS men kan inte skriva utan att hash:en länkas korrekt</li>
      </ul>

      <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
        Maskinläsbar version:{" "}
        <a
          href={`/api/verify/${params.id}`}
          style={{ color: "var(--usha-gold)" }}
        >
          /api/verify/{params.id.slice(0, 8)}…
        </a>
      </p>
    </div>
  );
}
