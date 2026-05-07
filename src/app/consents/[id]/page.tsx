import { dal } from "@/lib/dal";
import { notFound } from "next/navigation";
import RevokeButton from "./RevokeButton";
import ShareSection from "./ShareSection";
import LiveCountdown from "./LiveCountdown";

export const dynamic = "force-dynamic";

export default async function ConsentDetail({ params }: { params: { id: string } }) {
  const consent = await dal().getConsent(params.id);
  if (!consent) notFound();

  const counterpartySigned = !!consent.counterparty.signedAt;
  const initiatorSigned = !!consent.initiator.signedAt;

  return (
    <div>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 style={{ margin: 0 }}>Samtycke</h1>
          <span className={`status ${consent.status}`}>{consent.status}</span>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          {consent.scope}
        </p>

        {consent.message && (
          <>
            <h3>Meddelande</h3>
            <p
              style={{
                whiteSpace: "pre-wrap",
                borderLeft: "3px solid var(--usha-gold)",
                paddingLeft: 14
              }}
            >
              {consent.message}
            </p>
          </>
        )}

        <h3>Initiator</h3>
        <p>
          {consent.initiator.displayName || "(väntar)"}{" "}
          {initiatorSigned ? "✓ signerad" : "(ej signerad)"}
        </p>

        <h3>Motpart</h3>
        {counterpartySigned ? (
          <p>{consent.counterparty.displayName} ✓ signerad</p>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: 0 }}>
              Väntar på motpartens signatur.
            </p>
            <ShareSection consentId={consent.id} scope={consent.scope} />
          </>
        )}

        {consent.status === "pending" && consent.bothSignedAt && consent.activatesAt && (
          <p style={{ marginTop: 16 }}>
            Aktiveras om <LiveCountdown activatesAt={consent.activatesAt} />.
          </p>
        )}
        {consent.status === "active" && (
          <p style={{ marginTop: 16, color: "var(--ok)" }}>
            Samtycket är aktivt. Det kan återkallas när som helst.
          </p>
        )}
        {consent.status === "revoked" && consent.revokedAt && (
          <p style={{ marginTop: 16, color: "var(--err)" }}>
            Återkallat {new Date(consent.revokedAt).toLocaleString("sv-SE")} av{" "}
            {consent.revokedBy}.
          </p>
        )}

        {consent.status !== "revoked" && <RevokeButton consentId={consent.id} />}

        <p className="muted" style={{ fontSize: 13, marginTop: 24 }}>
          <a href={`/verify/${consent.id}`} style={{ color: "var(--usha-gold)" }}>
            Visa audit-kedja & verifiera integritet →
          </a>
        </p>
      </div>
    </div>
  );
}
