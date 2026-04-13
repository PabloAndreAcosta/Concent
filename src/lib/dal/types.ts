/**
 * Data Access Layer-kontrakt. ALL persistens går via dessa metoder.
 * Routes ska aldrig importera Supabase-klient direkt — endast denna.
 *
 * Två implementationer finns:
 *   - InMemoryDal (test-läge, default)
 *   - SupabaseDal (live-läge)
 *
 * Lägger du till en metod här: implementera i bägge.
 */
import type { Consent, ConsentStatus } from "@/lib/types";

export interface CreateConsentInput {
  initiatorPnoHash: string;
  initiatorDisplayName: string;
  scope: string;
  message?: string | null;
}

export interface SignConsentInput {
  consentId: string;
  role: "initiator" | "counterparty";
  pnoHash: string;
  displayName: string;
}

export interface Dal {
  createConsent(input: CreateConsentInput): Promise<Consent>;
  getConsent(id: string): Promise<Consent | null>;
  listConsentsByPno(pnoHash: string): Promise<Consent[]>;
  signConsent(input: SignConsentInput): Promise<Consent>;
  revokeConsent(id: string, by: "initiator" | "counterparty"): Promise<Consent>;
  /** Drift-jobb: flyttar pending→active när tidsfönstret har passerat. */
  reconcileStatuses(now: Date): Promise<{ updated: number }>;
}

export type { Consent, ConsentStatus };
