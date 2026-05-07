export const metadata = {
  title: "Integritetspolicy — Concent",
  description: "Hur Concent hanterar dina personuppgifter."
};

export default function PrivacyPage() {
  return (
    <div className="card" style={{ maxWidth: 720, lineHeight: 1.6 }}>
      <span className="eyebrow">Juridik</span>
      <h1>Integritetspolicy</h1>
      <p className="muted">Senast uppdaterad: 2026-05-07. Version 1.0.</p>

      <h2>1. Personuppgiftsansvarig</h2>
      <p>
        Usha AB (org.nr 559401-8326) är personuppgiftsansvarig.
        Kontakt: <a href="mailto:hej@usha.se">hej@usha.se</a>.
      </p>

      <h2>2. Vilka uppgifter vi behandlar</h2>
      <ul>
        <li>
          <strong>Personnummer (HMAC-hashat):</strong> När du signerar ett
          samtycke med BankID hämtar vi ditt personnummer från BankID-svaret,
          hashar det med HMAC-SHA-256 och en hemlig nyckel, och sparar
          <strong> bara hashen</strong>. Klartext-personnumret skrivs aldrig till
          databas eller logg.
        </li>
        <li>
          <strong>Namn:</strong> Förnamn + efternamn från BankID-svaret. Visas
          för motparten.
        </li>
        <li>
          <strong>Samtyckets innehåll (scope):</strong> Den fritext du själv
          skriver in när du skapar samtycket.
        </li>
        <li>
          <strong>Tidsstämplar:</strong> Skapande, signering, aktivering,
          återkallelse.
        </li>
        <li>
          <strong>Betalningsdata:</strong> Stripe payment_intent_id (ingen
          kortdata når våra servrar).
        </li>
        <li>
          <strong>Audit-logg:</strong> Hash-länkad händelselogg per samtycke
          (för bevisvärde och tamper-evidence).
        </li>
        <li>
          <strong>IP-adress + user agent:</strong> Sparas i audit-loggen vid
          signerings-händelser. Används för bedrägeriskydd.
        </li>
      </ul>

      <h2>3. Särskild kategori av uppgifter (GDPR Art 9)</h2>
      <p>
        Innehållet i ett Concent-samtycke kan röra uppgifter om sexualliv —
        en särskild kategori enligt GDPR Art 9. Vår rättsliga grund för
        behandlingen är ditt uttryckliga samtycke (Art 9.2.a) som du ger genom
        att skapa eller signera ett samtycke i tjänsten. Du kan när som helst
        återkalla samtycket — se{" "}
        <a href="#section-rights">Dina rättigheter</a>.
      </p>

      <h2>4. Rättslig grund</h2>
      <ul>
        <li>
          <strong>Skapande av samtycke:</strong> Avtal (du och motparten ingår
          en avsiktsförklaring) + uttryckligt samtycke (Art 9.2.a) för
          sexualliv-uppgifter.
        </li>
        <li>
          <strong>Audit-logg:</strong> Berättigat intresse (bevisvärde och
          tamper-evidence) + rättslig förpliktelse vid eventuell tvist.
        </li>
        <li>
          <strong>Betalning:</strong> Avtal + rättslig förpliktelse
          (bokföringslagen).
        </li>
      </ul>

      <h2>5. Hur länge vi sparar</h2>
      <ul>
        <li>
          <strong>Samtycken:</strong> Sparas på obestämd tid, så länge de inte
          uttryckligen redigeras till &quot;redacted&quot;-tillstånd. Detta är medvetet —
          syftet är att samtycket ska kunna refereras tillbaka till om en
          tvist uppkommer åratal senare.
        </li>
        <li>
          <strong>Audit-logg:</strong> Append-only. Raderas inte. Vid
          GDPR-radering ersätts personlig data i loggraden med &quot;redacted&quot;,
          men metadata-stegen (att en händelse skedde) bevaras.
        </li>
        <li>
          <strong>Bokföringsdata:</strong> 7 år enligt bokföringslagen (4 kap §1).
        </li>
      </ul>

      <h2>6. Vem vi delar med</h2>
      <ul>
        <li>
          <strong>Signicat AS:</strong> Norsk leverantör som tillhandahåller
          BankID-integrationen. Behandlar ditt personnummer kortvarigt under
          autentiseringen. Bunden av ett databehandlaravtal.
        </li>
        <li>
          <strong>Stripe Inc.:</strong> Hanterar betalningar. Mottar
          transaktionsbelopp och samtyckets-ID (men aldrig
          personnummer-hash eller scope).
        </li>
        <li>
          <strong>Supabase Inc.:</strong> Databasleverantör (hostat i
          eu-north-1, Stockholm). Bunden av databehandlaravtal.
        </li>
        <li>
          <strong>Vercel Inc.:</strong> Hosting av webbappen. Bunden av
          databehandlaravtal.
        </li>
      </ul>
      <p>
        Inga uppgifter säljs eller används för marknadsföring av tredje part.
        Vi delar inte data med myndigheter förrän vi får ett bindande
        domstolsbeslut.
      </p>

      <h2 id="section-rights">7. Dina rättigheter</h2>
      <p>Enligt GDPR har du rätt att:</p>
      <ul>
        <li>
          <strong>Få information</strong> om vilka uppgifter vi har om dig
          (genom hashen av ditt personnummer kan vi identifiera dina
          samtycken — kontakta oss för utdrag).
        </li>
        <li>
          <strong>Rätta</strong> felaktiga uppgifter (begränsat till displayName
          och scope — personnumret kommer från BankID och är låst).
        </li>
        <li>
          <strong>Bli raderad (&quot;rätten att bli glömd&quot;):</strong>
          Vi sätter dig till &quot;redacted&quot; på alla samtycken där du är part.
          Ditt namn och personnummer-hash byts ut mot platshållare.
          Audit-loggens händelse-stomme bevaras (vi får inte radera bevis,
          men vi tar bort PII).
        </li>
        <li>
          <strong>Begränsa behandlingen</strong> (paus tills tvist är löst).
        </li>
        <li>
          <strong>Dataportabilitet</strong> (utdrag i JSON).
        </li>
        <li>
          <strong>Återkalla samtycke</strong> till behandling av Art 9-uppgifter.
          Detta motsvarar funktionellt &quot;redacted&quot;-tillståndet.
        </li>
        <li>
          <strong>Klaga</strong> hos Integritetsskyddsmyndigheten (IMY).
        </li>
      </ul>
      <p>
        Skicka begäran till <a href="mailto:hej@usha.se">hej@usha.se</a>.
        Inkludera ditt personnummer (vi BankID-verifierar identiteten innan vi
        agerar). Vi svarar inom 30 dagar.
      </p>

      <h2>8. Säkerhet</h2>
      <ul>
        <li>
          Alla anslutningar krypterade (TLS 1.3).
        </li>
        <li>
          Personnummer hashas med HMAC-SHA-256 (rainbow-table-skyddad).
        </li>
        <li>
          Audit-loggen är hash-länkad (SHA-256) och append-only på
          databas-nivå (UPDATE/DELETE blockeras av Postgres-trigger).
        </li>
        <li>
          Service-role-nyckeln finns endast på serversidan, aldrig hos klient.
        </li>
        <li>
          Cookies HMAC-signerade och httpOnly.
        </li>
      </ul>

      <h2>9. Cookies</h2>
      <ul>
        <li>
          <strong>bankid_session</strong> (httpOnly, signerad, max 10 min):
          Sparar BankID-sessionsdata mellan start och callback.
        </li>
        <li>
          <strong>Vi använder INGA</strong> tracking- eller marknadsförings-
          cookies.
        </li>
      </ul>

      <h2>10. Ändringar</h2>
      <p>
        Vi kan uppdatera denna policy. Vid materiella ändringar (t.ex. nya
        underleverantörer eller utökad delning) publicerar vi en notis i appen
        i minst 30 dagar och kräver eventuellt nytt samtycke.
      </p>

      <h2>11. Tillsynsmyndighet</h2>
      <p>
        Integritetsskyddsmyndigheten (IMY)<br />
        Box 8114, 104 20 Stockholm<br />
        <a href="https://www.imy.se">www.imy.se</a>
      </p>
    </div>
  );
}
