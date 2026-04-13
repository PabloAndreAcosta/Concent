export default function Home() {
  return (
    <div>
      <section className="hero">
        <h1>Samtycke med eftertanke.</h1>
        <p>
          Concent är ett digitalt samtyckesregister med BankID. Mellan signering
          och aktivering ligger ett 3-dagarsfönster — för att samtycket ska vara
          en handling, inte ett impulsbeslut.
        </p>
        <a href="/consents/new" className="btn">Starta ett samtycke</a>
      </section>

      <section className="card" style={{ marginTop: 32 }}>
        <h2>Hur det funkar</h2>
        <ul className="steps">
          <li>Du startar ett samtycke och signerar med BankID.</li>
          <li>Motparten signerar med sitt BankID.</li>
          <li>Efter 3 dagar aktiveras samtycket.</li>
          <li>Vem som helst av er kan när som helst återkalla det.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Vad Concent inte är</h2>
        <ul className="steps">
          <li>Inte ett överfallslarm. Använd 112 vid akut fara.</li>
          <li>Inte juridiskt bindande i nuvarande demo-läge.</li>
          <li>Inte en datingapp. Vi spelar inte matchmaker.</li>
        </ul>
      </section>
    </div>
  );
}
