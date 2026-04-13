export default function Home() {
  return (
    <div>
      <section className="hero">
        <span className="eyebrow">BankID · 72-timmarsfönster</span>
        <h1>Samtycke med <span className="accent">eftertanke</span>.</h1>
        <p>
          Concent är en app för att registrera ditt intima liv. Ett sätt att
          hålla koll på vem du väljer att dela fysisk intimitet med — och att
          göra det med ansvar, närvaro och ett tydligt samtycke på papper.
        </p>
        <a href="/consents/new" className="btn">Starta ett samtycke →</a>
      </section>

      <section className="card">
        <h2>Varför Concent</h2>
        <p className="muted" style={{ marginTop: 0, lineHeight: 1.6 }}>
          Intimitet förtjänar samma eftertanke som andra viktiga beslut i livet.
          Concent ger dig ett tydligt register över vilka du har ingått samtycke
          med, när det skedde och på vilka villkor. Det gör det lättare att vara
          ansvarsfull mot dig själv och dem du delar din kropp med.
        </p>
      </section>

      <section className="card">
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
