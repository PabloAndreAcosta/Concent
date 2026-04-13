import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concent — Samtycke med eftertanke",
  description: "Digitalt samtycke med BankID. 3 dagar mellan signering och aktivering. En produkt från Usha."
};

export const viewport: Viewport = {
  themeColor: "#d4af37"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <header className="topbar">
          <a href="/" className="brand">
            <span className="brand-mark">C</span>
            <span>Concent</span>
          </a>
          <nav>
            <a href="/consents">Mina samtycken</a>
            <a href="/about">Om</a>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          <div>Test-miljö. Endast för demo. Inget rättsligt bindande.</div>
          <div style={{ marginTop: 6 }} className="powered">
            <span className="dot" /> En produkt från{" "}
            <a href="https://usha.se" style={{ marginLeft: 4 }}>Usha</a>
            <span style={{ margin: "0 8px" }}>·</span>
            <a href="https://github.com/PabloAndreAcosta/Concent">Källkod</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
