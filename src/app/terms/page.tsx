export const metadata = {
  title: "Användarvillkor — Concent",
  description: "Villkor för användning av Concent."
};

export default function TermsPage() {
  return (
    <div className="card" style={{ maxWidth: 720, lineHeight: 1.6 }}>
      <span className="eyebrow">Juridik</span>
      <h1>Användarvillkor</h1>
      <p className="muted">
        Senast uppdaterade: 2026-05-07. Version 1.0.
      </p>

      <h2>1. Vad Concent är</h2>
      <p>
        Concent är ett digitalt samtyckesregister som drivs av Usha AB (org.nr
        559401-8326). Tjänsten låter två parter signera ett ömsesidigt samtycke
        med BankID och en obligatorisk 3-dagarsfördröjning innan samtycket
        aktiveras. Återkallelse är alltid tillåten — även efter aktivering.
      </p>

      <h2>2. Vem som kan använda tjänsten</h2>
      <p>
        Du måste vara minst 18 år och ha svenskt BankID. Genom att signera
        intygar du att du gör det av fri vilja, är vid medvetande, och inte är
        påverkad av alkohol eller andra substanser i en grad som inverkar på
        ditt omdöme.
      </p>

      <h2>3. Vad ett samtycke i Concent betyder — och inte</h2>
      <p>
        Ett samtycke i Concent är en avsiktsförklaring mellan parterna. Det
        ersätter inte löpande kommunikation. Samtycket kan inte ersätta ett
        nej, en blick, en gest eller någon annan form av återtagande som sker
        i stunden. Den som läser av en motparts kroppsspråk har alltid det
        ansvaret oavsett vad som signerats.
      </p>
      <p>
        Concent är inte ett juridiskt avtal i klassisk mening. Det är ett
        bevisspår — vad som signerats, av vem, när. Det är upp till en eventuell
        domstol att bedöma vilken vikt det har i ett enskilt fall.
      </p>

      <h2>4. 3-dagarsfönstret</h2>
      <p>
        Mellan signering och aktivering ligger ett fönster på minst 72 timmar.
        Det är medvetet och kan inte stängas av. Syftet är att ge båda parter
        tid till eftertanke — samtycket är inte ett impulsbeslut.
      </p>

      <h2>5. Återkallelse</h2>
      <p>
        Vem som helst av parterna kan när som helst återkalla samtycket — i
        fönstret, efter aktivering, ja, även efter en tilltänkt situation. Det
        finns ingen tidsgräns och ingen &quot;för sent&quot;. Återkallelse loggas men
        kräver ingen motivering.
      </p>

      <h2>6. Avgift</h2>
      <p>
        Avgiften är 50 kr per skapat samtycke. Den som skapar samtycket betalar
        avgiften. Vi återbetalar inte avgiften om motparten väljer att inte
        signera, eller om någon part senare återkallar. Avgiften täcker våra
        BankID-kostnader och drift.
      </p>

      <h2>7. Vad vi inte gör</h2>
      <ul>
        <li>
          Vi skickar inga påminnelser till motparten. Delning är manuell, av
          dig.
        </li>
        <li>
          Vi har ingen SOS-funktion. Vid akut fara, ring 112. Vid våld,
          kontakta polis (114 14) eller Kvinnofridslinjen (020-50 50 50).
        </li>
        <li>
          Vi gör inga matchningar mellan användare. Vi är inte en datingapp.
        </li>
        <li>
          Vi öppnar inte API:t för andra plattformar.
        </li>
      </ul>

      <h2>8. Tekniska intyg</h2>
      <p>
        Varje händelse i ett samtycke (skapande, signering, aktivering,
        återkallelse) loggas i en hash-länkad audit-kedja som inte kan ändras
        i efterhand. Du kan när som helst verifiera kedjans integritet på{" "}
        <code>/verify/[id]</code> — den är publikt tillgänglig och behöver
        ingen inloggning.
      </p>

      <h2>9. Personuppgifter</h2>
      <p>
        Se vår <a href="/privacy">integritetspolicy</a> för fullständiga detaljer.
        Sammanfattat: vi sparar aldrig ditt personnummer i klartext, bara en
        HMAC-hash. Vi delar inte data med tredje part utöver det som krävs för
        BankID-verifiering (Signicat) och betalningshantering (Stripe).
      </p>

      <h2>10. Ansvarsbegränsning</h2>
      <p>
        Concent tillhandahålls i befintligt skick. Usha AB ansvarar inte för
        skada eller förlust som uppkommit till följd av användning av tjänsten,
        utöver vad som följer av tvingande lag. I förhållanden mellan parterna
        är samtycket en handling som dokumenteras — det är inte en garanti om
        något annat.
      </p>

      <h2>11. Ändringar</h2>
      <p>
        Vi kan uppdatera dessa villkor. Vid större förändringar publicerar vi
        en notis på startsidan i minst 30 dagar.
      </p>

      <h2>12. Kontakt</h2>
      <p>
        Frågor: <a href="mailto:hej@usha.se">hej@usha.se</a>.
        Klagomål: kontakta oss först — om vi inte når en lösning kan du vända
        dig till Allmänna reklamationsnämnden (arn.se).
      </p>

      <p className="muted" style={{ marginTop: 32 }}>
        Tillämplig lag: svensk rätt. Tvister avgörs av allmän domstol med
        Stockholms tingsrätt som första instans.
      </p>
    </div>
  );
}
