# Security self-review — Concent v1 MVP

**Datum:** 2026-05-07
**Genomförd av:** Claude (autonomous mode)
**Scope:** Hela MVP-bygget från 2026-05-07 commits ea3e583..HEAD

## Säkerhetsegenskaper (verifierade)

### Audit-log integritet
- ✅ SHA-256 hash chain via `append_audit_event()` RPC, `current_hash = sha256(canonical(payload + previous_hash))`
- ✅ `UPDATE`/`DELETE` på `audit_log` blockerade av Postgres-trigger (även för service-role)
- ✅ Publik `verify_audit_chain()` recompute:ar varje hash server-side, returnerar per-event integritetsflaggor
- ⚠️ `TRUNCATE` bypassar trigger. Service-role-key-läcka → kedjan kan rensas. **Mitigation:** key endast i Vercel-env, aldrig i kod/repo

### Personnummer-skydd
- ✅ HMAC-SHA-256 (`PNO_HMAC_SECRET`-keyed). Rainbow-table-attack på YYYYMMDD-XXXX-formatet förhindrad
- ✅ Klartext-personnummer skrivs aldrig till DB eller log
- ✅ `displayName` (för-/efternamn från BankID) är OK att exponera — har redan delats med motparten
- ⚠️ HMAC-rotation kräver re-hashing av alla consents (destructive). **Acceptabel risk** för MVP

### BankID/Signicat OAuth-flow
- ✅ `bankid_session`-cookie HMAC-signerad → klient kan inte modifiera consentId/role
- ✅ `pno_hash` + `displayName` kommer **alltid** från server-verifierat Signicat-svar, aldrig från klienten (anti-forgery)
- ✅ `httpOnly`, `sameSite: lax`, max 10 min livslängd
- ✅ Session rensas oavsett utfall (success/abort/error/exception)

### Stripe-flow
- ✅ `payment_intent_id` idempotens-check förhindrar dubbla consents vid reload
- ✅ Server-side verifiering av `payment_status === "paid"` innan consent skapas
- ✅ Stripe metadata begränsat till 500 chars (truncerat)
- ⚠️ Race: browser stängd mellan Stripe success och vår redirect → betald men ingen consent. **Mitigation v1.5:** webhook som backstop

### Rate limiting
- ✅ `/api/bankid/sign`: 5/min/IP
- ✅ `/api/payment/create-checkout`: 3/min/IP
- ✅ `/api/verify/[id]`: 30/min/IP
- ⚠️ In-process bucket → ej delad mellan Vercel-instanser, förlorad vid cold start. **Acceptabel** för 5/min-limits på låg volym. **Uppgradering v1.5:** Upstash Redis

### Database / RLS
- ✅ All skrivning via `serviceClient()` (service-role) på server-side
- ✅ RLS aktiverat på `consents` + `audit_log`
- ✅ Inga anon/auth-policies → nekas implicit
- ✅ Service-role-key endast på server (env-only, aldrig browser-bundlad)

### Cookies
- ✅ `bankid_session`: httpOnly, signed, sameSite: lax, secure i prod
- ✅ Inga tracking- eller marknadsförings-cookies
- ✅ Endpoint-baserad CSRF-säkerhet via sameSite

### XSS
- ✅ Next.js JSX auto-escaping
- ✅ Inga `dangerouslySetInnerHTML` används
- ✅ User-input scope/message renderas via React (escapad)

### Service worker / PWA
- ✅ `NetworkOnly` cache-strategi för `/api/*` → ingen cached känslig data
- ✅ Scope `/` med `start_url: /`
- ⚠️ `skipWaiting: true` → ny version aktiveras direkt vid deploy. Vid Vercel-kompromettering aktiveras malware-version omedelbart. **Mitigation:** Vercel-deploy är hårt skyddat med 2FA-krav

## NPM audit-observation

14 vulnerabilities (4 moderate, 8 high, 2 critical) — **alla i dev-dependencies**:
- `@next/eslint-plugin-next` (linter, build-time)
- `esbuild` dev-server (kommer aldrig till prod)
- `next-pwa` → `workbox-build`-kedjan (build-time)

Inga runtime-paket har CVE:er. Acceptabel risk för MVP. **Action:** kör `npm audit` periodiskt, uppgradera när Next.js 15 är stabilt.

## Kvarstående för pre-launch (manuellt av Pablo)

### Måste göras
1. **Sätt env-variabler i Vercel** för Concent-projektet:
   - `APP_MODE=live`
   - `NEXT_PUBLIC_APP_URL=https://concent.usha.se`
   - `SUPABASE_URL=https://fkotofxvqiqblxusixqa.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=` (kopiera från Supabase dashboard → Settings → API)
   - `SUPABASE_ANON_KEY=` (samma plats)
   - `SIGNICAT_CLIENT_ID/SECRET/ACCOUNT_ID` (väntar på Aron's invite)
   - `PNO_HMAC_SECRET=$(openssl rand -base64 32)` (generera nu, byt aldrig)
   - `STRIPE_SECRET_KEY` (test-mode först, byt vid public launch)

2. **Konfigurera Signicat callback-whitelist** med:
   - `https://concent.usha.se/api/bankid/callback?status=success`
   - `https://concent.usha.se/api/bankid/callback?status=abort`
   - `https://concent.usha.se/api/bankid/callback?status=error`

3. **Lägg till ToS- + Privacy-länk** vid signup om vi bygger sessions senare (för v1 räcker footer-länkar + att man läst policies vid skapande)

### Bör göras före public launch
4. **Be advokat granska** ToS + Privacy (jag är inte jurist — texten är ett genomtänkt utkast men ej rättsligt verifierat)
5. **Beta-testa** med 5 personer på sandbox-BankID innan prod-cert kommer
6. **DPA med Signicat** — verifiera att vi har det signerat (Appendix 4 i Signicat-avtalet?)
7. **Kvitto-flöde via Stripe** för bokföring
8. **Cookies-banner** är inte krav (vi har inga tracking-cookies, bara funktionella) men kan övervägas

### Senare iterationer
9. **Stripe webhook** som backstop för stängda browsers
10. **Upstash rate-limiter** för delad state mellan instanser
11. **Sentry/Logtail** för error-monitoring
12. **GDPR-radering UI** (admin-flöde för "redacted"-tillstånd)
13. **Reconcile cron** (Vercel Cron) — idag uppdateras pending→active lazy vid läsning

## Slutsats

MVP är **säker nog för beta-test** med ett begränsat antal användare. För
publik lansering bör punkterna 4-7 ovan adresseras först.

Den arkitektoniska tillitsmodellen — BankID Auth + tamper-evident audit log —
har juridisk substans även utan Signicat Sign-uppgradering. Audit-loggen är det
som ger bevisvärdet, inte produktnamnet på Signicat-paketet.
