# Concent

Digitalt samtyckesregister för intima situationer. BankID-autentiserat.
**3-dagarsfördröjning** mellan signering och aktivering — för att samtycke ska
vara en handling, inte ett impulsbeslut. Återkallelse alltid tillåten.

> **Status:** v1 MVP klart 2026-05-07. Schema deploy:at, kod redo för
> beta-test. Väntar på Signicat dashboard-invite + Vercel-env för public
> launch.

En produkt från [Usha AB](https://usha.se) (org.nr 559401-8326).

---

## Innehåll

- [Snabbstart](#snabbstart)
- [Flöde](#flöde)
- [Arkitektur](#arkitektur)
- [Kodkarta](#kodkarta)
- [Miljövariabler](#miljövariabler)
- [Test-läge vs live-läge](#test-läge-vs-live-läge)
- [Deployment-checklista](#deployment-checklista)
- [Tester](#tester)
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

I **test-läge** (default):
- BankID autosignerar efter ~1 sekund (mockBankIdClient)
- Inget persisteras (in-memory DAL)
- Stripe-flow skippas (skapar consent direkt)
- Inga externa beroenden krävs

---

## Flöde

```
1. Initiator skapar samtycke      → /consents/new
2. Stripe Checkout (50 kr)        → POST /api/payment/create-checkout
   (test-mode: skippas)
3. Initiator signerar med BankID  → POST /api/bankid/sign
   - test: mock-polling
   - live: redirect till Signicat
4. Signicat → /api/bankid/callback (live-mode)
5. Initiator delar länk/QR        → ShareSection-komponent
6. Counterparty signerar          → samma BankID-flöde, role=counterparty
7. ⏳ 72-timmars fönster
8. pending → active                → cron eller lazy vid läsning
9. Vem som helst kan återkalla    → POST /api/consent/revoke
```

Audit-event skrivs vid varje steg via Postgres `append_audit_event` RPC →
hash-länkad kedja som kan verifieras publikt på `/verify/[id]`.

---

## Arkitektur

```
        ┌──────────────────────────────────────────────────┐
        │           Next.js 14 App Router (PWA)            │
        │     Manifest + service worker (next-pwa)         │
        └───────────────────┬──────────────────────────────┘
                            │
        ┌───────────────────┴────────────────────┐
        ▼                                         ▼
┌───────────────────┐                  ┌────────────────────┐
│   bankid()        │                  │      dal()         │
│   (selektor)      │                  │   (selektor)       │
└───┬───────────┬───┘                  └────┬─────────┬─────┘
    │           │                           │         │
mock│       live│                       in-mem│  supabase│
    │           │                           │         │
    ▼           ▼                           ▼         ▼
(mock-poll) (Signicat OAuth)          (test-läge) (live)

────────────────────────────────────────────────────────────

           Live-läge externa beroenden:
  ┌─────────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
  │  Signicat   │ │  Stripe  │ │Supabase │ │  Vercel  │
  │  (BankID)   │ │(Checkout)│ │(Postgres│ │ (hosting │
  │  OAuth      │ │ + webhook│ │ +RLS)   │ │  + Cron) │
  └─────────────┘ └──────────┘ └─────────┘ └──────────┘
```

### Tillitsmodell — varför det räcker med BankID Auth (inte Sign)

Concent använder Signicats **Auth-only**-paket, inte Sign. Den juridiska
ryggraden ligger inte i ett eIDAS-Sign-certifikat — den ligger i:

1. **Identitet**: BankID Auth verifierar vem som klickade
2. **Tidsstämpel**: server-side, deterministisk
3. **Innehåll**: scope + message, hashat in i audit-kedjan
4. **Tamper-evidence**: hash-chained audit_log, append-only på trigger-nivå

För revocable consent (som Concent) räcker detta för bevisvärde. eIDAS
Advanced Signature är overkill — vi sparar 600 kr/mån på paket-uppgradering.

### Audit-log integritet

Varje händelse skrivs via `append_audit_event()` RPC som beräknar:
```
current_hash = SHA-256(canonical({consent_id, action, actor_pno_hash,
                                  actor_role, payload, previous_hash}))
```

`UPDATE`/`DELETE` på `audit_log` blockeras av Postgres-trigger.
`verify_audit_chain()` recompute:ar varje hash server-side på begäran.
Detta exponeras publikt via `/verify/[id]` — anyone (även en domstol) kan
verifiera utan databasaccess.

---

## Kodkarta

```
src/
├── app/
│   ├── layout.tsx                    Topbar, footer, PWA-meta
│   ├── manifest.ts                   PWA-manifest (Next 14 file-based)
│   ├── icon.tsx + apple-icon.tsx     Dynamiska app-ikoner
│   ├── page.tsx                      Landningssida
│   ├── about/page.tsx                Om-sida
│   ├── terms/page.tsx                Användarvillkor
│   ├── privacy/page.tsx              Integritetspolicy
│   ├── verify/[id]/page.tsx          Publik audit-kedjevisning
│   ├── consents/
│   │   ├── new/page.tsx              Skapa → Stripe Checkout
│   │   ├── payment-success/page.tsx  Stripe redirect-landing
│   │   ├── [id]/page.tsx             Detaljvy
│   │   ├── [id]/sign/page.tsx        BankID-signering (mock-poll eller redirect)
│   │   ├── [id]/ShareSection.tsx     QR + Web Share API + copy
│   │   ├── [id]/LiveCountdown.tsx    Tickande timer till aktivering
│   │   ├── [id]/RevokeButton.tsx     Återkalla
│   │   └── page.tsx                  Listvy (auth TODO)
│   └── api/
│       ├── consent/{create,revoke,[id]}/route.ts
│       ├── bankid/sign/route.ts      Start BankID (mode-branchat)
│       ├── bankid/callback/route.ts  Signicat redirect (live)
│       ├── bankid/collect/route.ts   Mock polling (test)
│       ├── payment/create-checkout/route.ts  Stripe session
│       ├── stripe/webhook/route.ts   Backstop för avbrutna flows
│       ├── verify/[id]/route.ts      JSON audit-chain
│       ├── cron/reconcile/route.ts   Vercel Cron, var 5:e min
│       └── health/route.ts           Driftcheck
├── lib/
│   ├── config.ts                     Env → typad config + assertLiveConfig()
│   ├── types.ts                      Domän-typer
│   ├── consent/delay.ts              72h-logiken
│   ├── rate-limit.ts                 Token bucket per-IP
│   ├── dal/                          Persistens-abstraktion
│   │   ├── inMemory.ts (test)
│   │   ├── supabase.ts (live)
│   │   └── index.ts (selektor)
│   ├── bankid/                       BankID-klient (test-mode)
│   │   ├── mock.ts
│   │   ├── live.ts (stub — live går via Signicat-routes)
│   │   └── index.ts
│   ├── signicat/
│   │   ├── client.ts                 OAuth-klient
│   │   └── crypto.ts                 HMAC-cookies + pno-hashning
│   ├── supabase/client.ts            Service-role-klient
│   └── stripe/client.ts              Stripe SDK
└── tests/
    ├── delay.test.ts
    └── dal.test.ts

supabase/migrations/
├── 20260507_concent_initial_schema.sql
├── 20260507_verify_audit_chain.sql
├── 20260507_payment_intent_unique.sql
└── 20260507_gdpr_redact.sql
```

---

## Miljövariabler

Se `.env.example`. Sammanfattat:

| Variabel | Krävs när | Beskrivning |
|---|---|---|
| `APP_MODE` | alltid | `test` (default) eller `live` |
| `NEXT_PUBLIC_APP_URL` | live | Publik URL (för Signicat callback) |
| `SUPABASE_URL/SERVICE_ROLE_KEY/ANON_KEY` | live | Supabase-credentials |
| `SIGNICAT_CLIENT_ID/SECRET/ACCOUNT_ID` | live | Från Signicat-onboarding |
| `PNO_HMAC_SECRET` | live | HMAC-nyckel för personnummer-hashning. **Generera en gång, ändra ALDRIG** (rotation = re-hash av allt) |
| `STRIPE_SECRET_KEY/WEBHOOK_SECRET` | live | Från Stripe dashboard |
| `STRIPE_PRICE_SEK` | live | Pris i öre, default 5000 (= 50 kr) |
| `CRON_SECRET` | live | Vercel Cron auth-bearer |
| `CONSENT_DELAY_HOURS` | nej | Default 72. **Ändra inte utan att läsa AGENTS.md** |

`config.assertLiveConfig()` failar fast om något saknas i live-läge.

---

## Test-läge vs live-läge

| | Test (`APP_MODE=test`) | Live (`APP_MODE=live`) |
|---|---|---|
| BankID | mock, autosignerar 1s | Signicat OAuth-redirect |
| Persistens | in-memory (förlorad vid restart) | Supabase Postgres + RLS |
| Personnummer | mockas baserat på orderRef | Hämtas från BankID, HMAC-hashas |
| Stripe | skippas, consent skapas direkt | Riktig Checkout, 50 kr |
| Audit log | skrivs inte | `append_audit_event` RPC |
| Externa beroenden | inga | Signicat + Stripe + Supabase + Vercel |
| Användning | utveckling, demo, CI | produktion |

---

## Deployment-checklista

### 1. Vercel-projekt (engång)
```bash
vercel link  # eller skapa via dashboard
```

### 2. Sätt environment variables i Vercel dashboard
Production-tabben, kopiera följande:
- `APP_MODE=live`
- `NEXT_PUBLIC_APP_URL=https://concent.usha.se`
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY`
- `SIGNICAT_CLIENT_ID` / `SIGNICAT_CLIENT_SECRET` / `SIGNICAT_ACCOUNT_ID`
- `PNO_HMAC_SECRET=$(openssl rand -base64 32)` ← **GENERERA EN GÅNG, ÄNDRA ALDRIG**
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_SEK`
- `CRON_SECRET=$(openssl rand -base64 32)`

### 3. Konfigurera Signicat callback-URLs
I Signicat dashboard → Account settings → Callbacks:
- `https://concent.usha.se/api/bankid/callback?status=success`
- `https://concent.usha.se/api/bankid/callback?status=abort`
- `https://concent.usha.se/api/bankid/callback?status=error`

### 4. Konfigurera Stripe webhook
Stripe dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://concent.usha.se/api/stripe/webhook`
- Events: `checkout.session.completed`
- Kopiera signing-secret → `STRIPE_WEBHOOK_SECRET` i Vercel

### 5. DNS
`concent.usha.se` → Vercel CNAME (cname.vercel-dns.com)

### 6. Health-check
Efter deploy:
```bash
curl https://concent.usha.se/api/health
```
Bör returnera `{ ok: true, mode: "live", ... }`.

---

## Tester

```bash
npm test           # vitest run, kör alla tester en gång
npm run test:watch
npm run typecheck  # tsc --noEmit
npm run build      # production build (verifierar att inget trasigt commit:as)
```

Aktuell coverage:
- 3-dagarsfördröjningens beräkningar
- DAL-livscykeln (in-memory, create → sign → activate → revoke)

Saknas (TODO):
- Integration-tester mot Supabase (kräver test-DB setup)
- E2E mot Signicat sandbox (kräver live env-vars)

---

## Designbeslut som inte är buggar

Läs `AGENTS.md` innan du "förbättrar" något av följande:

- **72-timmarsfönstret** (kondom-analogin) — initiatorn går också igenom det
- **Inget överfallslarm** — hänvisa till 112
- **Endast BankID** (svensk identitet, ej internationell)
- **Hash, inte kryptering** av personnummer (HMAC-SHA-256)
- **Inga "påminn motpart"-notifikationer** — bara transaktionella
- **Tombstone, inte hard delete** — bevarar bevisspår

---

## Säkerhet

Se `SECURITY-REVIEW.md` för full självgranskning. Sammanfattat:
- HMAC-SHA-256 för personnummer (rainbow-table-skyddad)
- Hash-chained audit-log med UPDATE/DELETE-block via Postgres-trigger
- Anti-forgery: pno_hash + displayName från server-verifierat Signicat-svar
- Rate-limiting (token bucket) på känsliga endpoints
- RLS aktiverat — all skrivning via service-role server-side
- Service-role-key endast i Vercel-env, aldrig i klient

---

## Licens

Inte definierad än. Som tumregel: behandla som proprietary tills `LICENSE` finns.
