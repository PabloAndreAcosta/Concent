# Concent

Digitalt samtyckesregister med BankID. Mellan signering och aktivering ligger ett **3-dagarsfönster** — för att samtycke ska vara en handling, inte ett impulsbeslut.

> **Status:** scaffold. Hela flödet fungerar i test-läge med mock-BankID och in-memory store. Live-läge (riktig BankID + Supabase) är förberett men inte aktiverat — se [roadmap](#roadmap).

---

## Innehåll

- [Snabbstart](#snabbstart)
- [Flöde](#flöde)
- [Arkitektur](#arkitektur)
- [Kodkarta](#kodkarta)
- [Miljövariabler](#miljövariabler)
- [Test-läge vs live-läge](#test-läge-vs-live-läge)
- [Tester](#tester)
- [Roadmap](#roadmap)
- [Designbeslut som inte är buggar](#designbeslut-som-inte-är-buggar)

---

## Snabbstart

```bash
git clone https://github.com/PabloAndreAcosta/Concent.git
cd Concent
npm install
cp .env.example .env.local       # default APP_MODE=test, inget mer behöver fyllas i
npm run dev
```

Öppna http://localhost:3000.

I test-läge:
- BankID autosignerar efter ~1 sekund.
- Inget persisteras — restart tömmer all data.
- Inga externa beroenden (Supabase, BankID-cert) krävs.

---

## Flöde

```
1. Initiator skapar samtycke      → POST /api/consent/create
2. Initiator signerar med BankID  → POST /api/bankid/sign  +  GET /api/bankid/collect
3. Initiator delar länk med motpart
4. Motpart signerar               → samma BankID-flöde, role=counterparty
5. ⏳ 72-timmars fönster (default)
6. Status flyttas pending → active automatiskt vid nästa avläsning
7. Vem som helst kan återkalla → POST /api/consent/revoke (alltid tillåtet)
```

---

## Arkitektur

```
        ┌──────────────────────────────────────────────────┐
        │                Next.js (App Router)              │
        │                                                  │
        │  src/app/...           Sidor + API-routes        │
        └───────────────────┬──────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   ┌────────────────┐              ┌────────────────────┐
   │   bankid()     │              │      dal()         │
   │  (selektor)    │              │   (selektor)       │
   └───┬────────┬───┘              └────┬─────────┬─────┘
       │        │                       │         │
   mock │   live │                  in-mem │   supabase │
       ▼        ▼                       ▼         ▼
  (test-läge) (kräver cert)        (test-läge)  (kräver creds)
```

Två selektor-funktioner — `bankid()` och `dal()` — är de enda platser där test/live-implementationen bestäms. Routes anropar dem och behöver aldrig veta vilken motor som körs.

---

## Kodkarta

```
src/
├── app/
│   ├── layout.tsx                    Topbar, footer, global CSS
│   ├── page.tsx                      Landningssida
│   ├── about/page.tsx                Om-sida (förklarar 3-dagarsregeln)
│   ├── consents/
│   │   ├── new/page.tsx              Steg 1: skapa samtycke
│   │   ├── [id]/sign/page.tsx        Steg 2: BankID-signering (klient-polling)
│   │   ├── [id]/page.tsx             Steg 3: detaljvy + status + share-länk
│   │   ├── [id]/RevokeButton.tsx     Återkalla-knapp
│   │   └── page.tsx                  Listvy (kräver auth — TODO)
│   ├── api/
│   │   ├── consent/create/route.ts   POST: skapa samtycke
│   │   ├── consent/revoke/route.ts   POST: återkalla
│   │   ├── bankid/sign/route.ts      POST: starta BankID-order
│   │   ├── bankid/collect/route.ts   GET:  pollar status, lagrar signatur
│   │   └── health/route.ts           GET:  driftcheck
│   └── globals.css
├── lib/
│   ├── config.ts                     Env → typad config + assertLiveConfig()
│   ├── types.ts                      Domän-typer (Consent, Party, ...)
│   ├── consent/delay.ts              3-dagarslogiken — testtäckt
│   ├── dal/
│   │   ├── types.ts                  DAL-kontrakt
│   │   ├── inMemory.ts               Test-läge (default)
│   │   ├── supabase.ts               Live-stub + schema-kommentar
│   │   └── index.ts                  Selektor: dal()
│   └── bankid/
│       ├── types.ts                  BankID-kontrakt
│       ├── mock.ts                   Test-läge (autosignerar)
│       ├── live.ts                   Live-stub
│       └── index.ts                  Selektor: bankid()
tests/
├── delay.test.ts                     72h-logiken
└── dal.test.ts                       In-memory DAL
```

---

## Miljövariabler

| Variabel | Krävs när | Default | Beskrivning |
|---|---|---|---|
| `APP_MODE` | alltid | `test` | `test` = mock + in-memory. `live` = riktig BankID + Supabase |
| `CONSENT_DELAY_HOURS` | nej | `72` | Timmar mellan signering och aktivering. **Ändra inte utan att läsa AGENTS.md.** |
| `SUPABASE_URL` | live | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | live | — | Service role key (server-only) |
| `SUPABASE_ANON_KEY` | live | — | Anon key (klient-läsningar via RLS) |
| `BANKID_CERT_PATH` | live | `./certs/bankid.p12` | Sökväg till BankID-cert |
| `BANKID_CERT_PASSWORD` | live | — | Lösenord för .p12-filen |
| `BANKID_API_URL` | live | test-API | BankID RP API endpoint |

`config.assertLiveConfig()` failar fast om något saknas i live-läge.

---

## Test-läge vs live-läge

| | Test (`APP_MODE=test`) | Live (`APP_MODE=live`) |
|---|---|---|
| BankID | mock, autosignerar 1s | Riktig BankID v6 + cert |
| Persistens | in-memory (försvinner vid restart) | Supabase Postgres + RLS |
| Personnummer | mockas baserat på orderRef | Hämtas från BankID, hashas (SHA-256) |
| Externa beroenden | inga | BankID test/prod-API + Supabase |
| Användning | utveckling, demo, CI | produktion |

Test-läget är produktens "skelett att leka i". Live-läget är vad som krävs för en RFSU-pitch.

---

## Tester

```bash
npm test           # kör alla tester en gång
npm run test:watch # watch mode
npm run typecheck  # tsc --noEmit
npm run build      # production build (verifierar att inget trasigt commit:as)
```

Tester täcker just nu:
- 3-dagarsfördröjningens beräkningar
- DAL-livscykeln (create → sign → activate → revoke)

Saknas (TODO): integrationstester mot Supabase, e2e mot riktig BankID-test-miljö.

---

## Roadmap

I prioritetsordning — gör steg 1 innan 2 osv.

1. **BankID test-cert** — implementera `src/lib/bankid/live.ts`. Skaffa cert från https://www.bankid.com/utvecklare/test, lägg i `./certs/`.
2. **Supabase-migration** — implementera `src/lib/dal/supabase.ts`. Schemat ligger som kommentar i filen, kör som migration.
3. **Rate limiting** på `/api/bankid/sign` — 5/min/IP. Förslag: `@upstash/ratelimit`.
4. **Sessionshantering** — efter BankID-signering, sätt en signerad cookie så listvyn (`/consents`) kan visa "mina samtycken".
5. **Reconcile-jobb** — cron som anropar `dal().reconcileStatuses(new Date())` var 5:e minut. (I dag sker uppdateringen lat vid läsning.)
6. **Audit-logg** — varje signering/revoke ska loggas till en immutable tabell. Kraven kommer från GDPR/bevisning.
7. **GDPR-export och radering** — användare ska kunna exportera sina samtycken och begära radering (ersätt med tombsten istället för hard delete).

---

## Designbeslut som inte är buggar

Läs `AGENTS.md` innan du "förbättrar" något av följande:

- 72-timmarsfönstret (kondom-analogin)
- Att vi inte har ett överfallslarm
- Att vi bara stödjer BankID
- Att vi hashar personnummer istället för att kryptera dem
- Att initiatorn också går igenom 3-dagarsfönstret (inte bara motparten)

---

## Licens

Inte definierad än. Som tumregel: behandla som proprietary tills `LICENSE` finns.
