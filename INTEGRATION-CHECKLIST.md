# BankID Integration — Master Checklist

**Senast uppdaterad:** 2026-05-08
**Owner:** Pablo Acosta (firmatecknare Usha AB) + Claude (autonomous build)
**Sammanhang:** Usha-platform + Concent ska båda gå live med Mobilt BankID via Signicat (teknisk integrator) + Nordea (cert-utgivare)

> **Critical path-summa:** Vi väntar på två trådar — Nordea-cert (4-8 v) och Signicat dashboard-aktivering (dagar). Tekniska sidan är klar.
>
> **Tidigaste live-datum:** ~2026-06-15 om Nordea går snabbt, ~2026-07-15 om de tar full lead-time.

---

## Spår A: Nordea (avtal + certifikat)

| # | Steg | Status | Owner | Datum |
|---|---|---|---|---|
| A1 | Öppna företagskonto hos Nordea | ✅ | Pablo | tidigare |
| A2 | Genomföra ägarbyte (Ludvig → Pablo) | ✅ | Pablo + Nordea KYC | 2026-05-05 |
| A3 | Aktivera admin-behörigheter (företagskonto) | ✅ | Pablo (ringt 0771-350 360) | 2026-05-06 |
| A4 | Initial kontakt med BankID-handläggare | ✅ | Jenny Ågren via Nordea Business chat | 2026-05-08 |
| A5 | **Skicka info-paket till Jenny** | 🟡 *Väntar på dig* | Pablo | utkast i Gmail (1756 tecken) |
| A6 | Nordea skickar avtalsutkast (BankID Förlitande Part-avtal) | ⏳ | Nordea | väntar A5 |
| A7 | Granska + signera Nordea-avtal | ⏳ | Pablo | väntar A6 |
| A8 | Nordea utfärdar Köparcertifikat | ⏳ | Nordea | väntar A7. Tid: ~2-4 v |
| A9 | Cert utväxlas (Nordea → Pablo → Signicat) | ⏳ | Pablo + Signicat | väntar A8 |

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
| B7 | **Aron skickar Signicat dashboard-invite** | 🟡 *Väntar på Aron* | Aron | påmint 2026-05-06, 2 dagar tyst |
| B8 | Pablo accepterar invite + fyller i företagsuppgifter | ⏳ | Pablo | väntar B7 |
| B9 | Pablo begär production account | ⏳ | Pablo | väntar B8 |
| B10 | Letter of Authorization (om Nordea kräver) | ⏳ | Pablo + Aron | föreslagen i info-paketet |
| B11 | Signicat installerar Nordea-cert i prod-miljö | ⏳ | Signicat | väntar A9 |
| B12 | Signicat aktiverar prod CLIENT_ID/SECRET/ACCOUNT_ID | ⏳ | Signicat | väntar B11 |
| B13 | Signicat whitelistar prod callback URLs | ⏳ | Signicat | väntar B12 |

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
| **v1 (denna)** | A5 (skicka info), parallellt B7 påminnelse om inget händer fre/lör |
| **v2** | A6/A7 (Nordea-avtal) — ofta snabbt om avtalet är standard |
| **v3-5** | A8 (cert-utfärdande) + B7-B10 i bakgrunden, Q5 beta-test på sandbox |
| **v6** | B11/B12 (Signicat-integration), parallellt Q4 jurist |
| **v7** | C5/D9 + C6/D10 + smoke-test |
| **v8** | Public launch |

**Realistisk launch:** ~2026-07-01 om allt går smidigt, ~2026-07-15 med några bumps.

---

## Vad jag (Claude) kan göra autonomt under tiden

- ✅ Concent v1 byggt och pushat
- ⏳ Stripe webhook backstop tested mot test-events (kräver lokalt env)
- ⏳ Integration-tester för supabaseDal (mock eller live test-rader)
- ⏳ Sentry-stub i kod (Pablo lägger DSN senare)
- ⏳ Reconcile-cron testad i prod (efter D8)

## Vad du (Pablo) behöver göra manuellt

### Denna vecka (krit-bana)
1. **Skicka utkastet till Jenny** (Gmail draft `r-4378737976325707163`, ~1756 tecken, klistra in i Nordea Business chat)
2. **Generera PNO_HMAC_SECRET** lokalt och spara säkert: `openssl rand -base64 32` (sätt i Vercel senare)

### Inom 2 veckor
3. **Skapa Vercel-projekt** för Concent: `cd ~/Concent && vercel link`
4. **DNS:** lägg till CNAME `concent.usha.se → cname.vercel-dns.com`
5. **Pinga Aron** om dashboard-invite om inget hänt 2026-05-13

### När cert-trådarna är klara
6. **Granska + signera Nordea-avtal**
7. **Pinga mig** för Vercel-env-rond + smoke-tests

### Innan public launch
8. **Jurist-granskning** av `/terms` + `/privacy`
9. **Stripe live-mode** företagsverifiering
10. **Beta-test** med 5 personer

---

## Lärdomar och fallgropar

- ❌ `foretag@nordea.se` är död — använd Nordea Business chat
- ⚠️ Signicat Auth-paket räcker INTE för Concent om vi senare lägger till underskrift — då behöver vi uppgradera till Auth+Sign
- ⚠️ PNO_HMAC_SECRET får ALDRIG ändras efter första prod-deploy (rotation = re-hash av allt)
- ⚠️ Service-role-key får aldrig committas eller skickas på Slack/mejl
