# Prompt att klistra in i claude.ai (web/desktop) — "cowork"

> **Bakgrund:** Gmail/Calendar MCP fungerar inte i Claude Code-terminalen just
> nu, så jag använder claude.ai-sessionen för det istället. Klistra in allt
> nedanför "--- KLISTRA IN HÄR ---" i en ny chat på claude.ai.

--- KLISTRA IN HÄR ---

Hej. Jag heter Pablo Acosta, mejl pablo.acosta@usha.se. Idag är 2026-05-12.

Du har Gmail- och Google Calendar-connectorer aktiva på mitt konto. Jag behöver
hjälp med tre saker, kör allt autonomt:

## 1. Skicka påminnelse-mail till Signicat

Skicka från mitt Gmail (pablo.acosta@usha.se) detta meddelande:

- **Till:** aron.sritharan@signicat.com
- **CC:** simon.hartvig@signicat.com
- **Subject:** Usha AB / case #334834 — Nordea cert ordered, need dashboard access this week
- **Body:**

Hi Aron,

Quick update — Nordea registered our BankID Förlitande Part agreement on May 11
and we've now ordered the production certificate at www.nordea.se/fpcert. We
expect the .p12 + password back from Nordea within a few business days.

To avoid bottlenecking once the cert arrives, we need two things from your side:

1. Signicat dashboard invite for pablo.acosta@usha.se. Outstanding since
onboarding kicked off (case #334834, last reminder May 6). Simon confirmed
escalation on May 8 with ETA Monday May 11. Today is May 12 and we still
don't have access.

2. Cert upload + production credentials. When the .p12 arrives we'll need to
either upload via the dashboard or hand it to your support team. Please
confirm which path you prefer and the secure transfer method (we will NOT
email the cert).

We'd also still appreciate clarification on the open technical questions from
our previous thread:
   - Production host: api.signicat.com or a region-specific endpoint?
   - nin attribute — enabled on the prod account by default?
   - Provider scope — adding norwegian/danish/finnish later, separate approval?
   - SLA / status page / incident escalation contact

Targeted go-live: ~June 1 if we keep moving this week. We're paying for Starter
Auth (599 SEK/month, 12-month commitment from April 24) — would like to start
using it.

Thanks,
Pablo Acosta
Founder & firmatecknare, Usha AB (org 559401-8326)
pablo.acosta@usha.se

---

## 2. Sök inkorgen efter senaste status

Sök i Gmail och rapportera tillbaka:

- Senaste meddelandet **från Aron** (`from:aron.sritharan@signicat.com OR
  from:onboarding@signicat.com`) under sista 14 dagarna — har han svarat?
- Senaste **från Nordea** (`from:nordea.com OR from:nordea.se`) under sista
  14 dagarna — finns något jag missat efter Jessicas chat 2026-05-11 15:19?
- Eventuella **drafts** med "nordea" eller "signicat" eller "bankid" i ämne
  eller body — finns det fler påbörjade utkast?

## 3. Skapa Google Calendar-påminnelse

Skapa en händelse i min primära kalender:

- **Titel:** Chase Nordea cert (om inte levererat)
- **Datum/tid:** 2026-05-15, 10:00–10:15 svensk tid
- **Beskrivning:** Om .p12-cert inte levererats: ring 0771-350 360 ELLER
  skriv till Jessica i Nordea Business chat. Beställning lagd 2026-05-12 på
  www.nordea.se/fpcert. Ärende-spår i ~/Concent/INTEGRATION-CHECKLIST.md.
- **Notifiering:** 1 timme innan + 15 min innan

Och en till:

- **Titel:** Chase Aron Signicat dashboard (om inte invitat)
- **Datum/tid:** 2026-05-14, 14:00–14:15 svensk tid
- **Beskrivning:** Om Aron inte svarat på påminnelsen 2026-05-12 — eskalera
  Simon Hartvig direkt på +46 768435251.

---

Rapportera tillbaka när allt tre är klart, och citera ev. ny status från sökningen.
