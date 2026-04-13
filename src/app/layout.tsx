import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concent",
  description: "Digitalt samtycke med eftertanke. 3 dagar mellan signering och aktivering."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <header className="topbar">
          <a href="/" className="logo">Concent</a>
          <nav>
            <a href="/consents">Mina samtycken</a>
            <a href="/about">Om</a>
          </nav>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          <small>
            Test-miljö. Endast för demo. Inget rättsligt bindande.{" "}
            <a href="https://github.com/PabloAndreAcosta/Concent">Källkod</a>
          </small>
        </footer>
      </body>
    </html>
  );
}
