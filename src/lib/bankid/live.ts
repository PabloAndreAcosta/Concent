/**
 * Live BankID v6-klient.
 *
 * STATUS: stub. För att aktivera:
 *   1. Hämta test-cert (.p12) från https://www.bankid.com/utvecklare/test
 *   2. Lägg i ./certs/bankid.p12 och sätt BANKID_CERT_PATH + BANKID_CERT_PASSWORD.
 *   3. Implementera fetch med klientcert via undici.Agent eller https.Agent.
 *   4. Mappa svaret till BankIdClient-kontraktet.
 *
 * Endpoint-referenser:
 *   POST /sign        — startar signeringsorder
 *   POST /collect     — pollar status
 *   POST /cancel      — avbryter
 *
 * Säkerhet: cert-filen MÅSTE ligga utanför versionshanterat område.
 * .gitignore skyddar certs/*.p12 men dubbelkolla innan commit.
 */
import type { BankIdClient } from "./types";

export const liveBankIdClient: BankIdClient = {
  async startSign() {
    throw new Error("liveBankIdClient not implemented — se src/lib/bankid/live.ts");
  },
  async collect() {
    throw new Error("liveBankIdClient not implemented");
  },
  async cancel() {
    throw new Error("liveBankIdClient not implemented");
  }
};
