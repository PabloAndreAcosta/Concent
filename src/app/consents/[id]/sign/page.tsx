"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

type State =
  | { kind: "starting" }
  | { kind: "polling"; orderRef: string }
  | { kind: "done" }
  | { kind: "error"; message: string };

export default function SignPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const role = (params.get("role") === "counterparty" ? "counterparty" : "initiator") as
    | "initiator"
    | "counterparty";

  const [state, setState] = useState<State>({ kind: "starting" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bankid/sign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ consentId: id, role })
        });
        if (!res.ok) throw new Error(await res.text());
        const { orderRef } = await res.json();
        if (cancelled) return;
        setState({ kind: "polling", orderRef });
      } catch (err) {
        setState({ kind: "error", message: err instanceof Error ? err.message : "fel" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, role]);

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
      <h1>BankID-signering</h1>
      {state.kind === "starting" && <p>Startar BankID...</p>}
      {state.kind === "polling" && (
        <>
          <p>Öppna BankID-appen och signera. (Test-läge: signeras automatiskt efter ~1 sek.)</p>
          <p className="muted">OrderRef: {state.orderRef}</p>
        </>
      )}
      {state.kind === "done" && <p>Klart — omdirigerar...</p>}
      {state.kind === "error" && <p style={{ color: "var(--err)" }}>{state.message}</p>}
    </div>
  );
}
