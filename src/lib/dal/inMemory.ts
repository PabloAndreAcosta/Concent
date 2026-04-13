import { randomUUID } from "node:crypto";
import type { Consent } from "@/lib/types";
import { computeActivatesAt } from "@/lib/consent/delay";
import type { CreateConsentInput, Dal, SignConsentInput } from "./types";

/**
 * In-memory store för test-läge. Persisteras INTE — startar tomt vid restart.
 * Globaliseras så Next.js dev-mode hot reload inte tappar state.
 */
const g = globalThis as unknown as { __concentStore?: Map<string, Consent> };
const store: Map<string, Consent> = g.__concentStore ?? (g.__concentStore = new Map());

function recomputeStatus(c: Consent, now: Date): Consent {
  if (c.revokedAt) return { ...c, status: "revoked" };
  if (c.activatesAt && now.getTime() >= new Date(c.activatesAt).getTime()) {
    return { ...c, status: "active" };
  }
  return { ...c, status: c.bothSignedAt ? "pending" : "pending" };
}

export const inMemoryDal: Dal = {
  async createConsent(input: CreateConsentInput): Promise<Consent> {
    const id = randomUUID();
    const consent: Consent = {
      id,
      initiator: {
        id: randomUUID(),
        pnoHash: input.initiatorPnoHash,
        displayName: input.initiatorDisplayName,
        signedAt: new Date().toISOString()
      },
      counterparty: {
        id: randomUUID(),
        pnoHash: "",
        displayName: "",
        signedAt: null
      },
      createdAt: new Date().toISOString(),
      bothSignedAt: null,
      activatesAt: null,
      revokedAt: null,
      revokedBy: null,
      status: "pending",
      scope: input.scope
    };
    store.set(id, consent);
    return consent;
  },

  async getConsent(id: string): Promise<Consent | null> {
    const c = store.get(id);
    if (!c) return null;
    return recomputeStatus(c, new Date());
  },

  async listConsentsByPno(pnoHash: string): Promise<Consent[]> {
    const now = new Date();
    return [...store.values()]
      .filter((c) => c.initiator.pnoHash === pnoHash || c.counterparty.pnoHash === pnoHash)
      .map((c) => recomputeStatus(c, now));
  },

  async signConsent(input: SignConsentInput): Promise<Consent> {
    const c = store.get(input.consentId);
    if (!c) throw new Error("consent not found");
    if (c.revokedAt) throw new Error("consent revoked");

    const next: Consent = { ...c };
    const now = new Date();
    if (input.role === "initiator") {
      next.initiator = {
        ...next.initiator,
        pnoHash: input.pnoHash,
        displayName: input.displayName,
        signedAt: now.toISOString()
      };
    } else {
      next.counterparty = {
        ...next.counterparty,
        pnoHash: input.pnoHash,
        displayName: input.displayName,
        signedAt: now.toISOString()
      };
    }
    if (next.initiator.signedAt && next.counterparty.signedAt && !next.bothSignedAt) {
      next.bothSignedAt = now.toISOString();
      next.activatesAt = computeActivatesAt(now).toISOString();
    }
    store.set(next.id, next);
    return recomputeStatus(next, now);
  },

  async revokeConsent(id: string, by: "initiator" | "counterparty"): Promise<Consent> {
    const c = store.get(id);
    if (!c) throw new Error("consent not found");
    const next: Consent = {
      ...c,
      revokedAt: new Date().toISOString(),
      revokedBy: by,
      status: "revoked"
    };
    store.set(id, next);
    return next;
  },

  async reconcileStatuses(now: Date): Promise<{ updated: number }> {
    let updated = 0;
    for (const [id, c] of store) {
      const next = recomputeStatus(c, now);
      if (next.status !== c.status) {
        store.set(id, next);
        updated++;
      }
    }
    return { updated };
  }
};
