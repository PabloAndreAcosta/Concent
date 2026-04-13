import { beforeEach, describe, expect, it } from "vitest";
import { inMemoryDal } from "../src/lib/dal/inMemory";

beforeEach(() => {
  // Töm globalt store mellan tester.
  (globalThis as any).__concentStore = new Map();
});

describe("inMemoryDal", () => {
  it("skapar samtycke i pending-status", async () => {
    const c = await inMemoryDal.createConsent({
      initiatorPnoHash: "h1",
      initiatorDisplayName: "Anna",
      scope: "demo"
    });
    expect(c.status).toBe("pending");
    expect(c.bothSignedAt).toBeNull();
  });

  it("sätter activatesAt först när bägge signerat", async () => {
    const c = await inMemoryDal.createConsent({
      initiatorPnoHash: "h1",
      initiatorDisplayName: "Anna",
      scope: "demo"
    });
    expect(c.activatesAt).toBeNull();

    const signed = await inMemoryDal.signConsent({
      consentId: c.id,
      role: "counterparty",
      pnoHash: "h2",
      displayName: "Bo"
    });
    expect(signed.activatesAt).not.toBeNull();
    expect(signed.bothSignedAt).not.toBeNull();
  });

  it("revoke är alltid tillåten", async () => {
    const c = await inMemoryDal.createConsent({
      initiatorPnoHash: "h1",
      initiatorDisplayName: "Anna",
      scope: "demo"
    });
    const r = await inMemoryDal.revokeConsent(c.id, "initiator");
    expect(r.status).toBe("revoked");
    expect(r.revokedBy).toBe("initiator");
  });

  it("revoke på redan signerat samtycke fungerar", async () => {
    const c = await inMemoryDal.createConsent({
      initiatorPnoHash: "h1",
      initiatorDisplayName: "Anna",
      scope: "demo"
    });
    await inMemoryDal.signConsent({
      consentId: c.id,
      role: "counterparty",
      pnoHash: "h2",
      displayName: "Bo"
    });
    const r = await inMemoryDal.revokeConsent(c.id, "counterparty");
    expect(r.status).toBe("revoked");
  });
});
