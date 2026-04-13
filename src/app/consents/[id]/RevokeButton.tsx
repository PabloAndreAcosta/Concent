"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RevokeButton({ consentId }: { consentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function revoke() {
    if (!confirm("Återkalla samtycket? Detta går inte att ångra.")) return;
    setBusy(true);
    await fetch("/api/consent/revoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ consentId, by: "initiator" })
    });
    router.refresh();
  }

  return (
    <button className="btn danger" onClick={revoke} disabled={busy} style={{ marginTop: 16 }}>
      {busy ? "Återkallar..." : "Återkalla samtycke"}
    </button>
  );
}
