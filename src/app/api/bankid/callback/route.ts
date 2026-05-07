import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { getBankIdSessionResult } from "@/lib/signicat/client";
import { hashPersonalNumber, verifyCookieValue } from "@/lib/signicat/crypto";
import { dal } from "@/lib/dal";

/**
 * Callback från Signicat efter att användaren slutfört (eller avbrutit) BankID.
 *
 * Signicat anropar denna med ?status=success|abort|error och vi har en
 * httpOnly signed cookie `bankid_session` som innehåller sessionId + consentId
 * + role från start-anropet.
 *
 * Säkerhetsmodell (samma anti-forgery-mönster som i creators-platform):
 *   - Klienten skickar ALDRIG in vem som signerade
 *   - pnoHash + displayName kommer alltid från Signicat-svaret server-side
 *   - Cookie är HMAC-signerad → klienten kan inte modifiera consentId/role
 *   - Sessionen verifieras genom att vi anropar Signicat med sessionId och
 *     kontrollerar att status=SUCCESS
 *
 * Anti-forgery: en motståndare som modifierar cookien får verifyCookieValue
 * att returnera null (signature mismatch) → vi avbryter.
 */

interface BankIdSessionCookie {
  sessionId: string;
  consentId: string;
  role: "initiator" | "counterparty";
}

function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set("bankid_session", "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(req: NextRequest) {
  const baseUrl = config.appUrl || new URL(req.url).origin;
  const status = req.nextUrl.searchParams.get("status");

  // Bara live-mode förväntas hit. I test-mode pollar UI:n /collect istället.
  if (config.mode !== "live") {
    return clearSessionCookie(
      NextResponse.redirect(`${baseUrl}/?bankid=test_mode_no_callback`)
    );
  }

  // === Steg 1: Hämta + verifiera signed cookie ===
  const cookieValue = req.cookies.get("bankid_session")?.value;
  if (!cookieValue) {
    return clearSessionCookie(
      NextResponse.redirect(`${baseUrl}/?bankid=missing_session`)
    );
  }

  const sessionData = verifyCookieValue<BankIdSessionCookie>(cookieValue);
  if (!sessionData) {
    return clearSessionCookie(
      NextResponse.redirect(`${baseUrl}/?bankid=invalid_session`)
    );
  }

  const { sessionId, consentId, role } = sessionData;
  const consentUrl = `${baseUrl}/consents/${consentId}`;

  // === Steg 2: Hantera abort/error innan vi pingar Signicat onödigt ===
  if (status !== "success") {
    const reason = status === "abort" ? "aborted" : "failed";
    return clearSessionCookie(NextResponse.redirect(`${consentUrl}?bankid=${reason}`));
  }

  // === Steg 3: Hämta verifierat resultat från Signicat ===
  let result;
  try {
    result = await getBankIdSessionResult(sessionId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[bankid/callback] Signicat session fetch failed:", err);
    return clearSessionCookie(NextResponse.redirect(`${consentUrl}?bankid=error`));
  }

  if (result.status !== "SUCCESS" || !result.subject) {
    return clearSessionCookie(NextResponse.redirect(`${consentUrl}?bankid=failed`));
  }

  const { name, nin } = result.subject;
  if (!nin?.value) {
    return clearSessionCookie(NextResponse.redirect(`${consentUrl}?bankid=no_nin`));
  }

  const pnoHash = hashPersonalNumber(nin.value);

  // === Steg 4: Skriv consent + audit-event via DAL ===
  try {
    await dal().signConsent({
      consentId,
      role,
      pnoHash,
      displayName: name
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[bankid/callback] signConsent failed:", err);
    return clearSessionCookie(NextResponse.redirect(`${consentUrl}?bankid=sign_failed`));
  }

  // === Steg 5: Klart, redirecta tillbaka till consent-sidan ===
  return clearSessionCookie(NextResponse.redirect(`${consentUrl}?bankid=success`));
}
