import Link from "next/link";

export const metadata = {
  title: "Hittades inte — Concent"
};

export default function NotFound() {
  return (
    <div className="card" style={{ textAlign: "center", maxWidth: 480 }}>
      <span className="eyebrow">404</span>
      <h1 style={{ marginTop: 8 }}>Sidan hittades inte</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        Den länk du följt finns inte längre, eller har aldrig funnits. Det kan
        också vara ett samtycke som har redactats (GDPR).
      </p>
      <p style={{ marginTop: 24 }}>
        <Link href="/" className="btn">
          ← Tillbaka till start
        </Link>
      </p>
    </div>
  );
}
