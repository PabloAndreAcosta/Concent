# AGENTS.md — briefing för nästa utvecklare/agent

Den här filen är till för dig som ska vidareutveckla Concent. Läs den innan du börjar ändra. Den fångar de beslut som inte syns i koden men som är dyrbara att rulla tillbaka.

---

## Vad Concent är (och vad den inte är)

**Är:** Ett digitalt samtyckesregister för intima situationer. BankID-signerat. 3-dagarsfördröjning innan samtycket aktiveras. Återkallelse alltid tillåten.

**Är inte:**
- Ett överfallslarm. (Vi vägrar bygga det. Det skulle förskjuta produktens betydelse.)
- En datingapp. Vi spelar inte matchmaker.
- Juridiskt bindande i nuvarande demo-läge.
- En "consent-as-a-service"-API för andra appar. Vi är en slutanvändarprodukt.

Nischen är smal med flit. Var den för bred drunknar produktens poäng.

---

## Designbeslut som lätt "förbättras" fel

### 1. 72-timmarsfördröjningen är inte en bug
Det går att signera i en stund av impuls. Det går inte att signera, vänta tre dagar, och fortfarande vara på samma impuls. Fördröjningen är hela produkten.

- Ändra inte default `CONSENT_DELAY_HOURS=72` utan att förstå varför den finns.
- Initiatorn går också igenom fönstret — inte bara motparten. Likabehandling.
- Återkallelse är alltid tillåten, även mitt i fönstret, även efter aktivering.

### 2. Kondom-analogin
Concent fungerar som en kondom: ett objekt som man tar fram **innan**, inte **istället för** samtal. Det ersätter inte kommunikation. Det är ett verktyg för dem som redan har bestämt sig.

Det är därför vi inte har:
- Push-notiser som "påminner" motparten att signera.
- "Förslag på samtyckesomfattning" baserat på AI.
- Gamification.

Allt sådant skulle göra produkten till matchmaking, vilket den inte är.

### 3. Inget överfallslarm
Frågan kommer dyka upp: "kan vi inte bygga in en SOS-knapp?". Svar: nej. Skälet är att en SOS-knapp i en samtyckesapp implicerar att samtycke och fara är samma domän — det är de inte. Vi förskjuter inte det fokuset. Hänvisa till 112.

### 4. Endast BankID
Endast personer med svenskt BankID kan använda Concent. Det är en feature, inte en begränsning — det säkerställer verifierad identitet och att vi kan koppla samtycket till en juridisk person. Varianter (e-post-OTP, Mobilt BankID från andra länder) sänker tilliten och är inte värda komplexiteten.

### 5. Vi hashar personnummer, krypterar dem inte
SHA-256 av personnummer räcker för att matcha parter och slå upp egna samtycken. Krypterad form skulle innebära att en nyckel kan låsa upp PII vid läcka — hash kan inte. Vi vill inte ha den nyckeln.

---

## DAL-kontraktet

ALL persistens går via `dal()`. Routes och sidor importerar **aldrig** Supabase-klient direkt.

```ts
import { dal } from "@/lib/dal";
const consent = await dal().getConsent(id);
```

Två implementationer:
- `inMemoryDal` — test-läge, default
- `supabaseDal` — live-läge, stub i dag

Lägger du till en metod i `Dal`-interfacet: implementera i bägge. Annars kraschar live-läge tyst.

---

## BankID-flödets tillitsmodell

1. Klient anropar `/api/bankid/sign` → server startar order via BankID, returnerar `orderRef`.
2. Klient pollar `/api/bankid/collect` med `orderRef`.
3. När `status=complete`: serversidan kallar `dal().signConsent()` med `pnoHash` och `displayName` från BankID-svaret.

Det betyder att klienten **aldrig** skickar in vem som signerade — det kommer alltid från BankID-svaret som verifierades på servern. En motståndare kan inte signera som någon annan genom att manipulera klienten.

I mock-läge produceras `pnoHash` deterministiskt från `orderRef` — det räcker för demo men ger ingen säkerhet. Skicka aldrig mock-läge till produktion.

---

## Supabase / RLS

När `supabaseDal` aktiveras:

- All skrivning sker med service-role-nyckeln på serversidan.
- Anon-läsning är tillåten endast via RLS-policy som matchar `pno_hash` mot ett claim i request-token.
- Klienten får aldrig service-role-nyckeln — den ska bara existera i serverns env.

Schema och RLS-policy finns som kommentar överst i `src/lib/dal/supabase.ts`. Kör som migration.

---

## GDPR-hållning

- Vi sparar **aldrig** personnummer i klartext.
- Vi sparar `displayName` (förnamn + efternamn från BankID) och en SHA-256-hash av personnummer.
- `scope`-fältet är fritext från användaren — instruera tydligt i UI att inte lägga in mer PII än nödvändigt.
- Radering: implementera som tombsten (sätt fält till `[redacted]`, behåll rad-id för revisionsspår). Hard delete bryter signeringsbevisning.
- Audit-logg är ett krav före produktion (se roadmap).

---

## Konkret prioritering för nästa agent

1. **Implementera `liveBankIdClient`** i `src/lib/bankid/live.ts`. Test-cert finns gratis från BankID. Använd `undici.Agent` med klientcert. Mappa svaret enligt `BankIdClient`-kontraktet.
2. **Implementera `supabaseDal`** i `src/lib/dal/supabase.ts`. Schema är dokumenterat i filen. Slå på RLS från start.
3. **Rate limiting** på `/api/bankid/sign`. Att kunna trigga obegränsat antal BankID-orders kostar oss pengar och slö-DDoS:ar BankID.
4. **Sessionscookie** efter BankID-auth (separat från sign — vi behöver också ett "logga in"-flöde, inte bara "signera detta dokument").
5. **Reconcile-jobb** — i dag uppdateras `pending → active` lat vid läsning. Det funkar för demo men i produktion vill vi ha en cron som drar igång var 5:e min så att ev. webhooks/notiser triggas vid rätt tidpunkt.

Hoppa inte över 1 och 2 — utan dem är produkten ett demo, inte en produkt.

---

## Att jobba kontinuerligt i koden

- `npm run dev` har hot reload. In-memory store globaliseras så hot reload inte tappar state.
- `npm run typecheck` innan commit — saknas tsc-fel = okej att pusha.
- `npm test` innan commit på allt som rör `consent/delay` eller `dal/`.
- `npm run build` är slutkollen — kör innan PR.
- Buggar i prod: börja med `/api/health` för att se vilket läge appen är i. Många "varför fungerar inget"-rapporter beror på fel `APP_MODE`.

---

## Frågor du kommer få och korta svar

- *"Kan vi göra fördröjningen 1 timme istället?"* — Nej, det är inte produkten då. Diskussion innan ändring.
- *"Kan vi tillåta att man tar bort samtycken helt?"* — Nej, tombsten. Bevisning.
- *"Kan vi lägga till push-notiser?"* — Bara transaktionella (motpart har signerat, samtycket är aktivt, samtycket återkallat). Inga "påminnelser".
- *"Kan vi öppna API:t för andra appar?"* — Nej. Det är en slutanvändarprodukt.
