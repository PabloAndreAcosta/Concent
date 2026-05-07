/**
 * Live BankID-implementation.
 *
 * NOTERA: Concent använder Signicat OAuth-redirect-flow istället för direkt
 * BankID v6 (cert-baserat). Live-flödet hanteras därför inte via BankIdClient-
 * interfacet — det skulle inte mappa rent (mock = sync polling, Signicat =
 * async redirect).
 *
 * Live-flödets entry-points:
 *   - POST /api/bankid/sign     → returnerar { authenticationUrl }
 *   - GET  /api/bankid/callback → Signicat redirectar hit, vi skriver consent
 *
 * BankIdClient-interfacet används BARA i test-läge (mockBankIdClient).
 *
 * Den här filen finns för att bankid()-selektorn inte ska kasta vid import,
 * men metoderna ska aldrig anropas.
 */
import type { BankIdClient } from "./types";

const NOT_USED_MSG =
  "liveBankIdClient anropas aldrig — live-flödet går via /api/bankid/sign + " +
  "/api/bankid/callback (Signicat redirect). Se src/app/api/bankid/.";

export const liveBankIdClient: BankIdClient = {
  async startSign() {
    throw new Error(NOT_USED_MSG);
  },
  async collect() {
    throw new Error(NOT_USED_MSG);
  },
  async cancel() {
    throw new Error(NOT_USED_MSG);
  }
};
