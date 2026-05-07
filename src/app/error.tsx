"use client";

import { useEffect } from "react";

/**
 * Global error boundary för Next.js App Router.
 * Renderas när Server Components eller route handlers kastar ett fel.
 *
 * Vi visar minimalt med tekniska detaljer för användaren — felmeddelanden
 * kan läcka känslig info. Stack-trace skickas till console för utvecklare.
 */
export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[error.tsx]", error);
    // TODO när Sentry är på plats: capture exception med digest som fingerprint
  }, [error]);

  return (
    <div className="card" style={{ textAlign: "center", maxWidth: 480 }}>
      <span className="eyebrow">Fel</span>
      <h1 style={{ marginTop: 8 }}>Något gick snett</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        Vi har loggat felet och tittar på det. Du kan försöka igen, eller
        återgå till start.
      </p>
      {error.digest && (
        <p
          className="muted"
          style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: 11,
            marginTop: 12,
            opacity: 0.6
          }}
        >
          Fel-ID: {error.digest}
        </p>
      )}
      <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn" onClick={reset}>
          Försök igen
        </button>
        <a href="/" className="btn secondary">
          Till start
        </a>
      </div>
    </div>
  );
}
