export const dynamic = "force-dynamic";

export default function ConsentsList() {
  return (
    <div className="card">
      <h1>Mina samtycken</h1>
      <p className="muted">
        Listvy kräver inloggning. I test-läge finns ingen sessionshantering än —
        gå direkt till en samtyckes-URL för att se det.
      </p>
      <p>
        <a href="/consents/new" className="btn">Skapa nytt</a>
      </p>
    </div>
  );
}
