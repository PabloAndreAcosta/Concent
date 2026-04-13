import type { BankIdResult, BankIdSession } from "@/lib/types";

/**
 * BankID-klientkontrakt. Två implementationer:
 *   - mockBankId  (test-läge, autosignerar efter 1 sek)
 *   - liveBankId  (riktig BankID v6, kräver cert)
 *
 * Tillitsmodell: vi litar PÅ att BankID-svaret är äkta efter att vi har
 * verifierat ordern via collect(). Vi sparar aldrig personnummer i klartext —
 * endast SHA-256-hash. displayName kommer från BankID:s userInfo.
 */
export interface BankIdClient {
  startSign(personalNumber: string | null, userVisibleData: string): Promise<BankIdSession>;
  collect(orderRef: string): Promise<
    | { status: "pending" }
    | { status: "complete"; result: BankIdResult }
    | { status: "failed"; reason: string }
  >;
  cancel(orderRef: string): Promise<void>;
}
