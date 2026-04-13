import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { BankIdClient } from "./types";

/**
 * Mock-BankID. Autosignerar efter ~1 sekund.
 * Returnerar deterministiska "personnummer" baserade på orderRef så att
 * test-flöden går att replaya.
 */
type Order = { startedAt: number; personalNumber: string | null };
const orders = new Map<string, Order>();

export const mockBankIdClient: BankIdClient = {
  async startSign(personalNumber, _userVisibleData) {
    const orderRef = randomUUID();
    orders.set(orderRef, { startedAt: Date.now(), personalNumber });
    return {
      orderRef,
      autoStartToken: randomUUID(),
      qrStartToken: randomUUID(),
      qrStartSecret: randomBytes(16).toString("hex")
    };
  },
  async collect(orderRef) {
    const order = orders.get(orderRef);
    if (!order) return { status: "failed", reason: "unknown order" };
    if (Date.now() - order.startedAt < 1000) return { status: "pending" };

    const pno = order.personalNumber ?? `MOCK-${orderRef.slice(0, 8)}`;
    const pnoHash = createHash("sha256").update(pno).digest("hex");
    return {
      status: "complete",
      result: {
        pnoHash,
        displayName: `Test-Person-${pno.slice(-4)}`,
        signedAt: new Date().toISOString()
      }
    };
  },
  async cancel(orderRef) {
    orders.delete(orderRef);
  }
};
