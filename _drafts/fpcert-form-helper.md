# Pablo's stickfält för www.nordea.se/fpcert

Öppna sidan, logga in med ditt **personliga** Mobilt BankID. Här är värden så du
inte behöver tänka:

## Företag
- **Organisation:** Usha AB
- **Org.nr:** 559401-8326
- **Firmatecknare:** Pablo Andre Acosta (du, ensam)

## Cert-konfiguration
- **Display Name (visas i BankID-appen för slutanvändare):** `Usha AB`
- **Kontaktperson teknik:** Pablo Acosta — pablo.acosta@usha.se
- **Användning:** Identifiering (Auth) — INTE Underskrift (Sign)
- **Estimerad volym första året:** 50–200 transaktioner/månad
- **Miljö:** Production (inte Test/Sandbox)

## Roller (alla på Pablo, en-mans-bolag)
- **Beställa cert:** Pablo
- **Ta emot cert:** Pablo
- **Spärra cert:** Pablo

## Distribution / leverans
- **Hur du vill ha certet:** Säker nedladdning från Nordea Business (inte mejl)
- **Om de frågar om PIN/lösenord:** välj eget starkt — generera med
  `openssl rand -base64 24` i terminalen och spara DIREKT i 1Password
  innan du ens fyller i det

## Domän/RP-info (om de frågar)
- **Primär domän:** usha.se
- **Subdomäner som använder certet:** usha.se, concent.usha.se
- **Callback-URLs (om frågat):**
  - https://usha.se/api/auth/bankid/callback
  - https://concent.usha.se/api/bankid/callback

## Om något fält är oklart
**Ring Nordea Kundservice Företag:** 0771-350 360 (de hjälpte dig fixa
admin-behörigheter 2026-05-06 — samma kanal)

ELLER skriv till Jessica i Nordea Business chat — hon är aktiv där.

## När certet kommer
1. Ladda ner till ~/Downloads
2. **Genast** flytta till ~/.bankid-certs/usha-prod-2026.p12 (mappen finns redan)
3. Spara lösenord i ~/.bankid-certs/usha-prod-2026.password.txt + 1Password
4. `chmod 600 ~/.bankid-certs/*` så bara du kan läsa
5. `rm` originalet ur ~/Downloads
6. Säg till mig — jag drar igång steg 2 (Signicat-uppladdning + Vercel env)
