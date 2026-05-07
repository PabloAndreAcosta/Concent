"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

/**
 * ShareSection — visas på consent-detail-sidan när motparten ännu inte signerat.
 *
 * Tre delningsvägar (i prioritetsordning för intimt/in-person scenario):
 *   1. QR-kod  → motpartens telefon scannar visuellt (ingen avsändare-lista,
 *      ingen meddelande-trail, perfekt för two-phones-i-samma-rum)
 *   2. Web Share API → native sharesheet (iOS/Android), användaren väljer kanal
 *   3. Copy-link → fallback för desktop/äldre browsers
 *
 * Designval (per AGENTS.md): inga reminder-notiser, ingen "påminn motparten"-
 * funktion. Delning är manuell, av användaren.
 */
export default function ShareSection({
  consentId,
  scope
}: {
  consentId: string;
  scope: string;
}) {
  const [absoluteUrl, setAbsoluteUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    const path = `/consents/${consentId}/sign?role=counterparty`;
    setAbsoluteUrl(`${window.location.origin}${path}`);
    setShareSupported(typeof navigator !== "undefined" && "share" in navigator);
  }, [consentId]);

  async function nativeShare() {
    try {
      await navigator.share({
        title: "Samtyckesförfrågan via Concent",
        text: `Jag har skapat ett samtycke för: ${scope}. Öppna länken för att läsa och eventuellt godkänna.`,
        url: absoluteUrl
      });
    } catch {
      // Användaren avbröt eller fel — tyst, vi har redan QR/copy som fallback
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Vissa miljöer (t.ex. iOS utan https) tillåter inte clipboard
    }
  }

  if (!absoluteUrl) {
    // SSR-safe: render nothing innan useEffect kör
    return null;
  }

  return (
    <div className="share-section" style={{ marginTop: 16 }}>
      <p className="muted" style={{ marginBottom: 12 }}>
        Dela med motparten — telefonerna i samma rum?
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 16,
          background: "#0f0f0f",
          borderRadius: 12,
          border: "1px solid #2a2a2a"
        }}
      >
        <div
          style={{
            background: "white",
            padding: 12,
            borderRadius: 8,
            display: "inline-flex"
          }}
        >
          <QRCodeSVG value={absoluteUrl} size={180} level="M" includeMargin={false} />
        </div>
        <p
          className="muted"
          style={{ fontSize: 12, marginTop: 10, textAlign: "center" }}
        >
          Motparten scannar med kamera-appen
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          flexWrap: "wrap"
        }}
      >
        {shareSupported && (
          <button className="btn" onClick={nativeShare} type="button">
            Dela länk →
          </button>
        )}
        <button
          className="btn secondary"
          onClick={copyLink}
          type="button"
          style={{ flex: shareSupported ? 0 : 1 }}
        >
          {copied ? "Kopierat ✓" : "Kopiera länk"}
        </button>
      </div>
    </div>
  );
}
