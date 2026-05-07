/**
 * Signicat-klient för BankID Auth via OAuth-redirect-flow.
 *
 * Anropas endast från server-side (API-routes). Kräver dessa env:
 *   - SIGNICAT_CLIENT_ID
 *   - SIGNICAT_CLIENT_SECRET
 *   - SIGNICAT_ACCOUNT_ID
 *   - SIGNICAT_API_BASE (default https://api.signicat.com)
 *
 * Tillitsmodell: vi initierar en sesssion mot Signicat → får tillbaka en
 * authenticationUrl → browser redirectar dit → användaren BankID-loggar in →
 * Signicat redirectar tillbaka till våran callback-URL → vi hämtar session-
 * resultatet via getBankIdSessionResult() och får verifierad nin från BankID.
 *
 * Mönster är portat från creators-platform/src/lib/signicat/client.ts.
 */

const CLIENT_ID = process.env.SIGNICAT_CLIENT_ID || "";
const CLIENT_SECRET = process.env.SIGNICAT_CLIENT_SECRET || "";
const ACCOUNT_ID = process.env.SIGNICAT_ACCOUNT_ID || "";
const API_BASE = process.env.SIGNICAT_API_BASE || "https://api.signicat.com";

export interface SignicatSession {
  id: string;
  authenticationUrl: string;
  status?: string;
}

export interface SignicatSessionResult {
  status: "SUCCESS" | "ABORTED" | "FAILED" | "EXPIRED" | string;
  subject?: {
    name: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nin: { value: string; type?: string };
  };
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const res = await fetch(`${API_BASE}/auth/open/connect/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials&scope=signicat-api"
  });

  if (!res.ok) {
    throw new Error(`Signicat token request failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  // Refresh 60 sekunder innan expiry
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Skapar en BankID Auth-session hos Signicat. Returnerar URL som browsern
 * ska redirecta till. Statuset på sessionen pollar vi inte — Signicat
 * redirectar tillbaka till oss via callbackUrls.
 */
export async function createBankIdSession(callbackBaseUrl: string): Promise<SignicatSession> {
  const token = await getAccessToken();

  const res = await fetch(
    `${API_BASE}/auth/rest/sessions?signicat-accountId=${ACCOUNT_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        flow: "redirect",
        allowedProviders: ["sbid"],
        requestedAttributes: ["name", "firstName", "lastName", "dateOfBirth", "nin"],
        callbackUrls: {
          success: `${callbackBaseUrl}/api/bankid/callback?status=success`,
          abort: `${callbackBaseUrl}/api/bankid/callback?status=abort`,
          error: `${callbackBaseUrl}/api/bankid/callback?status=error`
        }
      })
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Signicat session creation failed: ${res.status} ${text}`);
  }

  return (await res.json()) as SignicatSession;
}

/**
 * Hämtar autentiseringsresultatet för en avslutad session.
 * Anropas i callback-routen efter att Signicat redirectat tillbaka.
 */
export async function getBankIdSessionResult(sessionId: string): Promise<SignicatSessionResult> {
  const token = await getAccessToken();

  const res = await fetch(`${API_BASE}/auth/rest/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Signicat session fetch failed: ${res.status}`);
  }

  return (await res.json()) as SignicatSessionResult;
}
