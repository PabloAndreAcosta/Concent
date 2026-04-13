import { dal } from "@/lib/dal";
import { hoursUntil } from "@/lib/consent/delay";
import { notFound } from "next/navigation";
import RevokeButton from "./RevokeButton";

export const dynamic = "force-dynamic";

export default async function ConsentDetail({ params }: { params: { id: string } }) {
  const consent = await dal().getConsent(params.id);
  if (!consent) notFound();

  const now = new Date();
  const activatesIn = consent.activatesAt
    ? hoursUntil(now, new Date(consent.activatesAt))
    : null;

  const counterpartySigned = !!consent.counterparty.signedAt;
  const shareUrl = `/consents/${consent.id}/sign?role=counterparty`;

  return (
    <div>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1 style={{ margin: 0 }}>Samtycke</h1>
          <span className={`status ${consent.status}`}>{consent.status}</span>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>{consent.scope}</p>

        <h3>Initiator</h3>
        <p>
          {consent.initiator.displayName || "(väntar)"}{" "}
          {consent.initiator.signedAt ? "✓ signerad" : "(ej signerad)"}
        </p>

        <h3>Motpart</h3>
        {counterpartySigned ? (
          <p>{consent.counterparty.displayName} ✓ signerad</p>
        ) : (
          <>
            <p className="muted">Väntar på motpartens signatur.</p>
            <p>Dela denna länk med motparten:</p>
            <code style={{ display: "block", padding: 12, background: "#0b0d12", borderRadius: 8 }}>
              {shareUrl}
            </code>
          </>
        )}

        {consent.status === "pending" && consent.bothSignedAt && activatesIn !== null && (
          <p style={{ marginTop: 16 }}>
            Aktiveras om <strong>{activatesIn.toFixed(1)} timmar</strong>.
          </p>
        )}
        {consent.status === "active" && (
          <p style={{ marginTop: 16, color: "var(--ok)" }}>
            Samtycket är aktivt. Det kan återkallas när som helst.
          </p>
        )}
        {consent.status === "revoked" && (
          <p style={{ marginTop: 16, color: "var(--err)" }}>
            Återkallat {consent.revokedAt} av {consent.revokedBy}.
          </p>
        )}

        {consent.status !== "revoked" && <RevokeButton consentId={consent.id} />}
      </div>
    </div>
  );
}
