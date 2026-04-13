"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewConsent() {
  const router = useRouter();
  const [scope, setScope] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/consent/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope, message })
      });
      if (!res.ok) throw new Error(await res.text());
      const { consentId } = await res.json();
      router.push(`/consents/${consentId}/sign?role=initiator`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={start}>
      <h1>Nytt samtycke</h1>
      <p className="muted">
        Beskriv vad samtycket gäller. Var konkret men undvik personlig
        information utöver det nödvändiga.
      </p>
      <label htmlFor="scope">Omfattning</label>
      <textarea
        id="scope"
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        placeholder="t.ex. samlag den 15 april kväll"
        rows={3}
        required
        minLength={5}
      />

      <label htmlFor="message">Meddelande till motparten <span className="muted">(valfritt)</span></label>
      <textarea
        id="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ett personligt meddelande som visas när motparten öppnar länken."
        rows={3}
        maxLength={1000}
      />

      {error && <p style={{ color: "var(--usha-err)" }}>{error}</p>}
      <div style={{ marginTop: 20 }}>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Skapar..." : "Fortsätt till BankID →"}
        </button>
      </div>
    </form>
  );
}
