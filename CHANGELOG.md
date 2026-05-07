# Changelog

## v1.5 — 2026-05-07 (kvällen)

Polish + ops-features ovanpå v1.0. Build-kompletta för Vercel-deploy.

### Nytt
- **Stripe webhook backstop** (`/api/stripe/webhook`) — räddar betalningar där användaren stänger browsern mid-flow. Idempotent via unique partial index på `payment_intent_id`.
- **GDPR-redact-funktion** (`redact_consents_by_pno_hash` Postgres-RPC) — Art 17 implementation. Bevarar audit-stomme och tidsstämplar, ersätter PII med `[redacted]`. Hash-kedjan förblir intakt (verifierat smoke-test).
- **Vercel Cron** — `/api/cron/reconcile` var 5:e minut, skyddad med `CRON_SECRET` Bearer-header.
- **Custom 404 + error pages** — Usha-branded med fel-digest som Sentry-fingerprint.
- **/api/health utbyggt** — env-check, Supabase-ping (`?deep=1`), build-info (VERCEL_GIT_COMMIT_SHA/REF), HTTP 503 vid degraderad status.

### Ändrat
- **README.md omskriven** — matchar verklig arkitektur (PWA + Signicat OAuth + Stripe + audit chain). Tidigare README beskrev BankID v6 cert-direkt + Expo native-pivot, båda obsolete.

### Manuell action för deploy
Se README "Deployment-checklista" — kort version: sätt env-vars i Vercel (`STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`), konfigurera Stripe webhook och Signicat callback-URLs.

---

## v1.0 — 2026-05-07 (dagen)

Pivot-byte från Expo native (2026-04-13-roadmap) till **PWA**. Bygge från Supabase reaktivering till feature-komplett MVP.

### Pivot-beslut (taget i samråd med Pablo)
- **PWA istället för Expo native** för v1 (snabbare time-to-market, återanvänder Next.js scaffold)
- **BankID Auth-only** (Signicat Starter), INGEN Sign-uppgradering — audit-log + tamper-evidence ger juridisk substans utan eIDAS Sign
- **Avsändare betalar 50 kr** vid skapande (inte mottagare, inte 50/50)
- **Beställ Nordea-cert nu parallellt** med dev (ej längre pausad)
- **Egen Supabase-projekt** för Concent (separat från Usha-platform)

### Database (Supabase `fkotofxvqiqblxusixqa`)
- Drop:at gammal prototyp-schema (consent_sessions + bankid_signatures + pending_bankid_orders + audit_log med encryption-baserad PII)
- Skapat nya schemat:
  - `consents`: med Stripe-fält (payment_intent_id, paid_at), tombsten (redacted, redacted_at), constraints (FK consistency, completion-checks)
  - `audit_log`: hash-länkad, append-only på trigger-nivå (UPDATE/DELETE blockerade även för service-role)
- Funktioner:
  - `append_audit_event()` — beräknar previous_hash + current_hash automatiskt
  - `verify_audit_chain()` — recompute:ar varje hash, returnerar per-event integritetsflaggor
  - `reconcile_consent_statuses()` — flyttar pending→active
  - `redact_consents_by_pno_hash()` — GDPR Art 17

### Backend (Next.js 14 App Router)
- **Supabase-klient** (`src/lib/supabase/client.ts`) — cachad service-role
- **DAL `supabaseDal`** — full implementation med audit-events automatisk på create/sign/revoke
- **Signicat OAuth** (`src/lib/signicat/{client,crypto}.ts`) — redirect-flow, HMAC-cookies, HMAC-SHA-256 personnummer-hashning (rainbow-table-skyddad)
- **Stripe Checkout** — server-side session, metadata för scope/message
- **Rate-limiter** (`src/lib/rate-limit.ts`) — token bucket per-IP
- **API-routes**:
  - `/api/bankid/sign` — mode-branched (mock-poll i test, Signicat-redirect i live)
  - `/api/bankid/callback` — Signicat redirect-target, anti-forgery-mönster
  - `/api/bankid/collect` — mock polling (test-only)
  - `/api/payment/create-checkout` — Stripe session
  - `/api/verify/[id]` — JSON audit-chain-verifiering
  - `/api/consent/{create,revoke,[id]}` — befintliga, fortsätter funka

### Frontend (PWA)
- **`app/manifest.ts`** — file-based manifest (display: standalone, lang: sv-SE)
- **`app/icon.tsx` + `app/apple-icon.tsx`** — dynamiska ikoner via Next OG runtime
- **`next-pwa`** — service worker (NetworkOnly för `/api/*`, CacheFirst för assets)
- **iOS meta** — apple-touch-icon, status bar, viewport-fit cover
- **Komponenter**:
  - `ShareSection` — QR-kod (qrcode.react) + Web Share API + copy-link med fallback
  - `LiveCountdown` — tickande timer, refreshar vid 0
- **Sidor**:
  - `/consents/new` — form → Stripe Checkout → BankID
  - `/consents/payment-success` — Stripe redirect-landing, idempotent
  - `/verify/[id]` — publik audit-chain-visning, server-renderad
  - `/terms` + `/privacy` — full svensk juridisk text (12 + 11 sektioner)

### Utveckling
- 10/10 unit-tester gröna (`delay.test.ts` + `dal.test.ts`)
- Typecheck OK genom hela bygget
- Build verified: 18 routes (8 dynamic, 10 static)

### Manuella moment kvar
- Vercel env-vars
- Signicat dashboard-invite (väntar på Aron)
- Nordea-cert (kommer parallellt)
- Stripe webhook-konfiguration
- Jurist-granskning ToS + Privacy
- Beta-test 5 personer

---

## v0.9 — 2026-04-15

Senaste pre-pivot commit på Concent (4dd4154). Innehöll:
- Next.js 14 scaffold
- mock-BankID + in-memory DAL
- Stripped-down /consents/new med scope + message
- Hero + om-sida
- 10/10 tester gröna

Pausade 2026-04-13 inför pivot till Expo native (övergivet 2026-05-07).
