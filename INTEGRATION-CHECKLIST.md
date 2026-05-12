# BankID Integration — Master Checklist

**Senast uppdaterad:** 2026-05-13 (sen kväll — efter end-to-end verifiering)
**Owner:** Pablo Acosta (firmatecknare Usha AB) + Claude (autonomous build)
**Sammanhang:** Usha-platform + Concent ska båda gå live med Mobilt BankID via Signicat (teknisk integrator) + Nordea (cert-utgivare)

> **Critical path-summa (uppdaterad):** Server-sidan av Signicat-integrationen
> är verifierad mot prod (2026-05-13 — token OK + session created via
> verify-skript). Återstår: (1) klargöra cert-konflikten via Moumys svar på
> ticket 335970 — slutsteget BankID-app-login gav "QR code invalid" vilket
> troligen indikerar att BankID Sweden ännu inte mappat Usha AB under
> Signicats broker-cert, (2) Vercel-env-rond i creators-platform + Concent,
> (3) live smoke-test.
>
> **Tidigaste live-datum:** dagar, inte veckor — så fort Moumy bekräftar
> cert-provisioneringen är klar.

---

## Spår A: Nordea (avtal + certifikat)

| # | Steg | Status | Owner | Datum |
|---|---|---|---|---|
| A1 | Öppna företagskonto hos Nordea | ✅ | Pablo | tidigare |
| A2 | Genomföra ägarbyte (Ludvig → Pablo) | ✅ | Pablo + Nordea KYC | 2026-05-05 |
| A3 | Aktivera admin-behörigheter (företagskonto) | ✅ | Pablo (ringt 0771-350 360) | 2026-05-06 |
| A4 | Initial kontakt med BankID-handläggare | ✅ | Jenny Ågren via Nordea Business chat | 2026-05-08 |
| A5 | Skicka info-paket till Jenny | ✅ | Pablo | 2026-05-08 morgon |
| A6 | Nordea skickar avtalsutkast (BankID Förlitande Part) | ✅ | Nordea | 2026-05-08 11:19 |
| A7 | Granska + signera Nordea-avtal | ✅ | Pablo | 2026-05-08 ~14:20 (digital signering BankID) |
| A8 | **Avtal registrerat hos Nordea** | ✅ | Jessica @ Nordea | 2026-05-11 15:19 (3 dagar, snabbare än ETA!) |
| A9 | Pablo beställer cert på www.nordea.se/fpcert | ⏸️ *PAUSAD* | — | Cert-konflikt: Moumy 2026-05-11 säger "we already ordered for you, no action needed". Verifiera m. Moumy om eget Nordea-cert ändå krävs innan A9 körs. |
| A10 | Nordea utfärdar .p12 + lösenord | ⏸️ | — | Beror på Moumys svar |
| A11 | Cert laddas upp i Signicat dashboard | ⏸️ | — | Beror på Moumys svar — kanske ej tillämpligt i broker-modellen |

**Pris (exkl moms):** Anslutning 1 000 kr engång + 500 kr/mån + 0,20 kr/identifiering.

**Kontakt:** Jenny Ågren via Nordea Business app → Hjälp → Meddelanden.
**Tekniska frågor:** teknikinfo@bankid.com.

**OBS:** Gmail till `foretag@nordea.se` STUDSAR (adressen är död). Använd alltid Nordea Business chat för affärskommunikation.

---

## Spår B: Signicat (teknisk integrator)

| # | Steg | Status | Owner | Datum |
|---|---|---|---|---|
| B1 | Tecknat Starter Auth-paket (599 kr/mån) | ✅ | Pablo + Simon Hartvig | 2026-04-24 |
| B2 | Sandbox-credentials utfärdade | ✅ | Signicat | tidigare |
| B3 | Sandbox-flow byggt + testat (creators-platform) | ✅ | Claude | 2026-04-22 (forgery-test) |
| B4 | Sandbox-flow byggt + testat (Concent) | ✅ | Claude | 2026-05-07 |
| B5 | Aron Sritharan startar onboarding | ✅ | Aron | 2026-04-28 |
| B6 | Pablo svarar Aron med org-info | ✅ | Pablo | 2026-04-29 |
| B7 | Signicat dashboard-invite | ✅ | Moumy (efter Simon-eskalering) | 2026-05-08 17:13 — invite till pablo.acosta@usha.se |
| B8 | Pablo accepterar invite + fyller i företagsuppgifter | ✅ | Pablo | 2026-05-12 — inloggad, prod-scope synlig (`a-ppge-9zMYhtLxFISFfCFIl6g0`) |
| B9 | Prod-konto aktiverat | ✅ | Moumy | 2026-05-12 15:51 — "Swedish BankID is now enabled in your production account" |
| B10 | Letter of Authorization (om Nordea kräver) | ❓ | — | Sannolikt ej tillämplig i broker-modellen — fråga Moumy om osäker |
| B11 | Signicat ordnar cert i broker-modellen | ✅ (enligt Moumy) | Signicat | 2026-05-11 — "we have already ordered the certificate for you" |
| B12 | Skapat API client + secret + permissions i dashboard | ✅ | Pablo | 2026-05-12 — Client `prod-irate-puma-674`, permission "Authentication REST API", secret i lösenordshanterare |
| B13 | Whitelistat prod callback URLs | ✅ (implicit) | Signicat | callback-URLs accepterades vid session creation utan klagomål |
| B14 | Verifiera prod-creds end-to-end (server-side) | ✅ | Claude + Pablo | 2026-05-13 — `verify-signicat.mjs`: token OK, session created, branded subdomain `usha-ab.app.signicat.com` aktiverad |
| B15 | Verifiera prod-creds end-to-end (BankID-app-login) | 🔴 | Pablo + Moumy | 2026-05-13 — QR i MBID-appen säger "QR code is invalid". Troligen ej Signicats fel utan BankID Sweden-provisionering. Väntar Moumys svar på ticket 335970 |

**Kvarstående tekniska frågor till Aron** (i tidigare draft, kan ställas igen):
- Production host: api.signicat.com eller annan region-endpoint?
- nin-attribut aktiverat i prod eller separat?
- Provider-scope: bara sbid nu, lägga till norsk/dansk/finsk senare = ny godkännandecykel?
- SLA / status page / incident-eskalering

**Kontakter:**
- **Aron Sritharan** (onboarding): onboarding@signicat.com — ärende #334834
- **Simon Hartvig** (sales): simon.hartvig@signicat.com, +46 768435251

---

## Spår C: Tekniska sidan (kod + deploy)

### Usha-platform (`~/Code/creators-platform`)

| # | Steg | Status | Owner | Datum |
|---|---|---|---|---|
| C1 | Signicat-integration kod | ✅ | Claude | tidigare |
| C2 | Anti-forgery-mönster (apply-verification) | ✅ | Claude | tidigare |
| C3 | 8/8 enhetstester gröna | ✅ | Claude | tidigare |
| C4 | Live-forgery-test mot prod | ✅ | Claude | 2026-04-22 |
| C5 | Sätt SIGNICAT_* env i Vercel prod | ⏳ | Pablo | väntar B12 |
| C6 | Smoke-test: signup på usha.se mot prod-cert | ⏳ | Pablo + Claude | väntar C5 |
| C7 | Städa testanvändare efter smoke | ⏳ | Claude | väntar C6 |

### Concent (`~/Concent`)

| # | Steg | Status | Owner | Datum |
|---|---|---|---|---|
| D1 | v1 MVP byggt (12 commits, 17 tasks) | ✅ | Claude | 2026-05-07 |
| D2 | Pushat till GitHub | ✅ | Claude | 2026-05-07 |
| D3 | Supabase deploy:at + smoke-testat | ✅ | Claude | 2026-05-07 |
| D4 | **Skapa Vercel-projekt** | ⏳ | Pablo | (`vercel link` i ~/Concent) |
| D5 | DNS: concent.usha.se → Vercel CNAME | ⏳ | Pablo | väntar D4 |
| D6 | **Sätt env-vars i Vercel** (lista nedan) | ⏳ | Pablo | väntar D4 |
| D7 | Sätt Stripe webhook i Stripe dashboard | ⏳ | Pablo | väntar D4 |
| D8 | Initial deploy (test-mode först) | ⏳ | Pablo / Claude | väntar D6 |
| D9 | Sätt APP_MODE=live + Signicat-creds | ⏳ | Pablo | väntar B12 + D6 |
| D10 | Smoke-test signup → samtycke → BankID | ⏳ | Pablo + Claude | väntar D9 |

#### Concent Vercel env-vars (full lista)

```bash
# Driftläge
APP_MODE=live
NEXT_PUBLIC_APP_URL=https://concent.usha.se

# Supabase (eu-north-1, fkotofxvqiqblxusixqa)
SUPABASE_URL=https://fkotofxvqiqblxusixqa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<från Supabase Settings → API>
SUPABASE_ANON_KEY=<från Supabase Settings → API>

# Signicat (väntar B12)
SIGNICAT_CLIENT_ID=<från Aron>
SIGNICAT_CLIENT_SECRET=<från Aron>
SIGNICAT_ACCOUNT_ID=<från Aron>
SIGNICAT_API_BASE=https://api.signicat.com

# HMAC (genereras EN GÅNG, ändras ALDRIG)
PNO_HMAC_SECRET=<openssl rand -base64 32>

# Stripe (test-mode först)
STRIPE_SECRET_KEY=<från Stripe dashboard>
STRIPE_WEBHOOK_SECRET=<från Stripe webhooks-config>
STRIPE_PRICE_SEK=5000  # = 50 kr i öre

# Cron (skydd för Vercel Cron)
CRON_SECRET=<openssl rand -base64 32>
```

---

## Spår D: Pre-launch QA

| # | Steg | Status | Owner | Notes |
|---|---|---|---|---|
| Q1 | ToS + Privacy Policy live | ✅ | Claude | `/terms` + `/privacy` |
| Q2 | SECURITY-REVIEW.md | ✅ | Claude | self-review klart |
| Q3 | npm audit (14 CVE i dev-deps, 0 i runtime) | ✅ | Claude | acceptabelt för MVP |
| Q4 | **Jurist-granska ToS + Privacy** | ⏳ | Pablo | innan public launch, inte beta |
| Q5 | **Beta-test 5 personer på sandbox** | ⏳ | Pablo | väntar B7 → kan göras innan cert |
| Q6 | DPA med Signicat verifierat | ⏳ | Pablo | check Appendix 4 i Signicat-avtalet |
| Q7 | Stripe live-mode aktiverat (företagsverifiering) | ⏳ | Pablo | separat process, ~3-7 dagar |
| Q8 | Sentry/Logtail för error monitoring | ⏳ | Pablo | trevligt-att-ha, ej blocker |

---

## Beroende-graf (kritisk väg)

```
A5 (du skickar info)
  └─ A6 (Nordea avtalsutkast)
      └─ A7 (du signerar)
          └─ A8 (Nordea utfärdar cert) ────┐
                                           │
B7 (Aron dashboard-invite) ──┐             │
  └─ B8 (du fyller i)        │             │
      └─ B9 (request prod)   │             │
          └─ B10 (LoA)       │             │
                             ▼             ▼
                          B11 (Signicat installerar cert)
                             │
                             ▼
                          B12 (prod-credentials)
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
            C5/D9        Q5 sandbox     C6/D10
          (env vars)     (kan göras     (smoke-test
                         redan nu)      mot prod)
                                           │
                                           ▼
                                       PUBLIC LAUNCH
                                       (efter Q4 jurist)
```

**Critical path:** A5 → A8 → B11 → B12 → C5/D9 → C6/D10 → launch.
**A8 är den långsamma punkten** (Nordea cert-utfärdande, 2-4 v efter avtalssignering).

---

## Tidsuppskattning

| Vecka | Aktivitet |
|---|---|
| **v1 (8 maj)** | ✅ A5+A6+A7 KLART. Pinga Aron snabbt så B-spåret hinner ikapp |
| **v2-3 (12-22 maj)** | A8 cert-utfärdande pågår. B7-B10 (Aron, dashboard, LoA) i parallell |
| **v3-4 (19-29 maj)** | Beta-test på sandbox (Q5), jurist-granskning (Q4) |
| **v4-5 (26 maj-5 juni)** | A9 cert-leverans → B11/B12 (Signicat installerar) |
| **v5-6 (2-12 juni)** | C5/D9 + C6/D10 (env + smoke) |
| **v6-7 (9-19 juni)** | Public launch |

**Ny realistisk launch:** ~2026-06-12 om Nordea-cert tar 3 v + Signicat 1 v.
**Pessimistisk launch:** ~2026-06-26 om Nordea drar 4 v.

**Tidigare bedömning** (1 juli–15 juli) hängde på A5-A7 som klart idag.

---

## Vad jag (Claude) kan göra autonomt under tiden

- ✅ Concent v1 byggt och pushat
- ⏳ Stripe webhook backstop tested mot test-events (kräver lokalt env)
- ⏳ Integration-tester för supabaseDal (mock eller live test-rader)
- ⏳ Sentry-stub i kod (Pablo lägger DSN senare)
- ⏳ Reconcile-cron testad i prod (efter D8)

## Vad du (Pablo) behöver göra manuellt

### Denna vecka (krit-bana, uppdaterad 2026-05-12 e.m.)
1. **Granska + skicka Moumy-draften** (Gmail draft `r5770839028368370154`) — frågar
   cert-konflikten + 3 tekniska följdfrågor. Trycka Skicka när du är OK med tonen.
2. **Pausa Jenny-utkastet** i Gmail-drafts tills Moumys cert-svar landar.
3. **Logga in på dashboard.signicat.com** med pablo.acosta@usha.se.
   - Hämta prod `CLIENT_ID` / `CLIENT_SECRET` / `ACCOUNT_ID`
   - Kolla callback-URL-whitelist-sektionen — addera om möjligt själv:
     - creators-platform: `https://usha.se/api/auth/bankid/callback?status=success`
       (+ samma för status=abort och status=error)
     - Concent: `https://concent.usha.se/api/bankid/callback?status=success`
       (+ samma för status=abort och status=error)
4. **Smoke-testa prod-creds lokalt** innan Vercel:
   ```bash
   SIGNICAT_CLIENT_ID=… SIGNICAT_CLIENT_SECRET=… SIGNICAT_ACCOUNT_ID=… \
     APP_URL=https://usha.se \
     node ~/Code/creators-platform/scripts/verify-signicat.mjs
   ```
5. **Generera PNO_HMAC_SECRET** för Concent: `openssl rand -base64 32`

### När Moumy bekräftat cert-frågan
6. **Om broker-cert räcker:** arkivera Jenny-utkastet, meddela Jessica via
   Nordea Business chat att Usha går via Signicat-broker, inget eget cert.
7. **Om eget Nordea-cert behövs ändå:** skicka Jenny-utkastet, kör A9.

### Vercel env-rond
8. **creators-platform** Vercel env-vars: `SIGNICAT_CLIENT_ID`,
   `SIGNICAT_CLIENT_SECRET`, `SIGNICAT_ACCOUNT_ID`,
   `SIGNICAT_API_BASE=https://api.signicat.com` (eller region-specifik per
   Moumys svar), `BANKID_COOKIE_SECRET=<openssl rand -base64 32>`.
9. **Concent** Vercel env-vars: samma SIGNICAT_* + `APP_MODE=live` +
   `PNO_HMAC_SECRET` + övriga från D6 nedan.
10. **Smoke-test signup-flow** på usha.se mot prod-cert (live BankID-login).

### Innan public launch
11. **Jurist-granskning** av `/terms` + `/privacy`
12. **Stripe live-mode** företagsverifiering
13. **Beta-test** med 5 personer

---

## Lärdomar och fallgropar

- ❌ `foretag@nordea.se` är död — använd Nordea Business chat
- ⚠️ Signicat Auth-paket räcker INTE för Concent om vi senare lägger till underskrift — då behöver vi uppgradera till Auth+Sign
- ⚠️ PNO_HMAC_SECRET får ALDRIG ändras efter första prod-deploy (rotation = re-hash av allt)
- ⚠️ Service-role-key får aldrig committas eller skickas på Slack/mejl
