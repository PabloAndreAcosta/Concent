"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

type State =
  | { kind: "intro" }
  | { kind: "starting" }
  | { kind: "polling"; orderRef: string }
  | { kind: "done" }
  | { kind: "error"; message: string };

type Consent = {
  id: string;
  scope: string;
  message: string | null;
  initiator: { displayName: string };
};

export default function SignPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const role = (params.get("role") === "counterparty" ? "counterparty" : "initiator") as
    | "initiator"
    | "counterparty";

  const [state, setState] = useState<State>({ kind: "intro" });
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    fetch(`/api/consent/${id}`).then(async (r) => {
      if (r.ok) setConsent(await r.json());
    });
  }, [id]);

  async function startSigning() {
    setState({ kind: "starting" });
    try {
      const res = await fetch("/api/bankid/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consentId: id, role })
      });
      if (!res.ok) throw new Error(await res.text());
      const { orderRef } = await res.json();
      setState({ kind: "polling", orderRef });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "fel" });
    }
  }

  useEffect(() => {
    if (state.kind !== "polling") return;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/bankid/collect?orderRef=${state.orderRef}&consentId=${id}&role=${role}`);
      const data = await res.json();
      if (data.status === "complete") {
        clearInterval(iv);
        setState({ kind: "done" });
        router.push(`/consents/${id}`);
      } else if (data.status === "failed") {
        clearInterval(iv);
        setState({ kind: "error", message: data.reason ?? "BankID-fel" });
      }
    }, 1200);
    return () => clearInterval(iv);
  }, [state, id, role, router]);

  return (
    <div className="card">
      {role === "counterparty" && consent && (
        <>
          <span className="eyebrow">Samtyckesförfrågan</span>
          <h1 style={{ marginTop: 12 }}>
            {consent.initiator.displayName !== "(ej signerad)"
              ? `${consent.initiator.displayName} vill ingå ett samtycke med dig`
              : "Du har fått en samtyckesförfrågan"}
          </h1>
          <h3>Vad det gäller</h3>
          <p>{consent.scope}</p>
          {consent.message && (
            <>
              <h3>Meddelande</h3>
              <p style={{ whiteSpace: "pre-wrap", borderLeft: "3px solid var(--usha-gold)", paddingLeft: 14, color: "var(--usha-white)" }}>
                {consent.message}
              </p>
            </>
          )}
          <h3>Så fungerar det</h3>
          <ul className="steps">
            <li>Du signerar med ditt Mobilt BankID — ingen app behöver installeras.</li>
            <li>Efter 3 dagar aktiveras samtycket.</li>
            <li>Du kan när som helst återkalla det, även efter aktivering.</li>
          </ul>
        </>
      )}

      {role === "initiator" && state.kind === "intro" && (
        <>
          <h1>BankID-signering</h1>
          <p className="muted">Signera för att bekräfta att du startat samtycket.</p>
        </>
      )}

      {state.kind === "intro" && (
        <div style={{ marginTop: 24 }}>
          <button className="btn" onClick={startSigning}>
            Signera med BankID →
          </button>
        </div>
      )}
      {state.kind === "starting" && <p style={{ marginTop: 24 }}>Startar BankID...</p>}
      {state.kind === "polling" && (
        <div style={{ marginTop: 24 }}>
          <p>Öppna BankID-appen och signera.</p>
          <p className="muted" style={{ fontSize: 13 }}>
            (Test-läge: signeras automatiskt efter ~1 sekund.)
          </p>
        </div>
      )}
      {state.kind === "done" && <p>Klart — omdirigerar...</p>}
      {state.kind === "error" && (
        <p style={{ color: "var(--usha-err)", marginTop: 16 }}>{state.message}</p>
      )}
    </div>
  );
}
