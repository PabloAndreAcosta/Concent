/**
 * Domän-typer. Allt som rör samtycken passerar via dessa.
 *
 * Status-livscykel:
 *   pending  → bägge har signerat, väntar på 3-dagarsfönstret
 *   active   → fönstret har passerat, samtycket gäller
 *   revoked  → någon part har återkallat (alltid tillåtet, även när active)
 *   expired  → tidsgräns nådd utan att motpart signerat
 */
export type ConsentStatus = "pending" | "active" | "revoked" | "expired";

export interface Party {
  /** Anonymiserat ID — vi sparar aldrig personnummer i klartext. */
  id: string;
  /** Hashat personnummer (sha256). Används för match, inte för visning. */
  pnoHash: string;
  displayName: string;
  signedAt: string | null;
}

export interface Consent {
  id: string;
  initiator: Party;
  counterparty: Party;
  /** Skapad när initiator startar. */
  createdAt: string;
  /** Sätts när bägge har signerat. activatesAt = signedAt + delayHours. */
  bothSignedAt: string | null;
  activatesAt: string | null;
  revokedAt: string | null;
  revokedBy: "initiator" | "counterparty" | null;
  status: ConsentStatus;
  /** Fritextscope, t.ex. "samlag 2026-04-15 kväll". Aldrig PII utöver det. */
  scope: string;
  /** Valfritt personligt meddelande från initiator till motpart. Visas på sign-sidan. */
  message: string | null;
}

export interface BankIdSession {
  orderRef: string;
  autoStartToken: string;
  qrStartToken: string;
  qrStartSecret: string;
}

export interface BankIdResult {
  pnoHash: string;
  displayName: string;
  signedAt: string;
}
