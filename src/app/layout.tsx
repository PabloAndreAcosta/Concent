import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://concent.usha.se"),
  title: "Concent — Samtycke med eftertanke",
  description:
    "Digitalt samtycke med BankID. 3 dagar mellan signering och aktivering. En produkt från Usha.",
  applicationName: "Concent",
  appleWebApp: {
    capable: true,
    title: "Concent",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    url: "/",
    siteName: "Concent",
    title: "Concent — Samtycke med eftertanke",
    description: "Digitalt samtycke med BankID. 3 dagar mellan signering och aktivering."
  },
  twitter: {
    card: "summary",
    title: "Concent",
    description: "Digitalt samtycke med BankID."
  },
  // Manifest hanteras automatiskt av app/manifest.ts (Next.js 14 file-based)
  // Icons hanteras automatiskt av app/icon.tsx + app/apple-icon.tsx
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
  // Förhindra iOS-zoom när användaren tappar input-fält men tillåt manuell zoom
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover" // utnyttja iPhone-notch-area i installerad PWA
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
            <a href="/terms">Villkor</a>
            <span style={{ margin: "0 8px" }}>·</span>
            <a href="/privacy">Integritet</a>
            <span style={{ margin: "0 8px" }}>·</span>
            <a href="https://github.com/PabloAndreAcosta/Concent">Källkod</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
