/**
 * Cookie-signing + personnummer-hashning.
 *
 * Personnummer hashas med HMAC-SHA-256 (inte plain SHA-256). HMAC förhindrar
 * rainbow-table-attacker mot det förutsägbara svenska personnummerformatet
 * (YYYYMMDD-XXXX, ~10^11 möjliga värden — trivialt att precomputa).
 *
 * AGENTS.md säger "SHA-256" — HMAC-SHA-256 är SHA-256 med en hemlighet, så
 * kontraktet är uppfyllt och vi får extra läcksäkerhet på köpet.
 *
 * Mönster portat från creators-platform/src/lib/signicat/crypto.ts.
 */
import crypto from "node:crypto";

const HMAC_SECRET = process.env.PNO_HMAC_SECRET || process.env.BANKID_COOKIE_SECRET || "";

if (typeof window === "undefined" && !HMAC_SECRET) {
  // eslint-disable-next-line no-console
  console.warn(
    "WARNING: PNO_HMAC_SECRET (eller BANKID_COOKIE_SECRET) saknas. " +
    "Cookie-signering och personnummer-hashning är OSÄKER. " +
    "Sätt env innan live-deploy."
  );
}

/**
 * Signera ett cookie-värde med HMAC. Returnerar `{base64url}.{signature}`.
 * Verifiera senare med verifyCookieValue.
 */
export function signCookieValue(data: object): string {
  const json = JSON.stringify(data);
  const encoded = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

/** Returnerar null om signaturen inte stämmer (timing-safe jämförelse). */
export function verifyCookieValue<T = unknown>(signedValue: string): T | null {
  const lastDot = signedValue.lastIndexOf(".");
  if (lastDot === -1) return null;

  const encoded = signedValue.slice(0, lastDot);
  const signature = signedValue.slice(lastDot + 1);

  const expected = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(encoded)
    .digest("base64url");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
  } catch {
    // timingSafeEqual kastar om längderna inte matchar
    return null;
  }

  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Hashar ett svenskt personnummer med HMAC-SHA-256.
 * Returnerar lowercase hex-string (64 tecken).
 *
 * Säkerhet: HMAC med secret förhindrar rainbow-table-attacker. Om secret
 * läcker kan en angripare återskapa hashar för KÄNDA personnummer, men inte
 * brute-force:a alla (eftersom secret är okänd för brute-force-tabeller).
 */
export function hashPersonalNumber(nin: string): string {
  return crypto.createHmac("sha256", HMAC_SECRET).update(nin).digest("hex");
}
