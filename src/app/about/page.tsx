export default function About() {
  return (
    <div className="card">
      <h1>Om Concent</h1>
      <p>
        Concent är ett experiment i hur digitalt samtycke kan se ut när det
        designas för eftertanke snarare än hastighet.
      </p>
      <h3>3-dagarsfönstret</h3>
      <p>
        Att signera ett samtycke är inte detsamma som att samtycket gäller.
        Mellan signering och aktivering ligger 72 timmar. Under den tiden kan
        vem som helst av parterna återkalla utan motivering. Syftet är att göra
        samtycket till ett övervägt beslut.
      </p>
      <h3>Återkallelse</h3>
      <p>
        Återkallelse är alltid tillåten — innan, under och efter aktivering.
        Det är samtyckets viktigaste egenskap.
      </p>
      <h3>Vad vi inte sparar</h3>
      <p>
        Personnummer lagras aldrig i klartext, endast som SHA-256-hash. Det
        räcker för att matcha parter utan att exponera identiteter i en eventuell
        läcka.
      </p>
    </div>
  );
}
