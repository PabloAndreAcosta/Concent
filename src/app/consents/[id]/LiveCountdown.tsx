"use client";
import { useEffect, useState } from "react";

/**
 * Live countdown till consent-aktivering.
 * Tickar var sekund, refreshar sidan när 0 nås (status flyttas pending→active
 * server-side via lat reconcile vid getConsent()).
 */
export default function LiveCountdown({ activatesAt }: { activatesAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const target = new Date(activatesAt).getTime();
    const tick = () => {
      setNow(Date.now());
      // När targettid passeras, refresh hela sidan så server-side reconcile kör
      if (Date.now() >= target) {
        window.location.reload();
      }
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activatesAt]);

  const target = new Date(activatesAt).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return <span style={{ color: "var(--ok)" }}>Aktiveras nu...</span>;
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
      {days > 0 && `${days}d `}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  );
}
