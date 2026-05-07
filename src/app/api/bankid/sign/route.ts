import { NextResponse } from "next/server";
import { z } from "zod";
import { bankid } from "@/lib/bankid";
import { config } from "@/lib/config";
import { createBankIdSession } from "@/lib/signicat/client";
import { signCookieValue } from "@/lib/signicat/crypto";

/**
 * Startar BankID-signering för en consent.
 *
 * Två flöden beroende på APP_MODE:
 *   - test: mockBankIdClient → returnerar { orderRef } för polling-flow
 *   - live: Signicat OAuth → returnerar { authenticationUrl } för redirect-flow
 *
 * UI-page hanterar båda response-shapes (om authenticationUrl finns redirectar
 * den browsern, annars startar polling med orderRef).
 *
 * TODO (innan produktion):
 *   - Rate limit per IP (t.ex. 5/min) — se task #11
 *   - Verifiera origin/CSRF-token
 *   - Logga endast orderRef/sessionId, aldrig personnummer
 */
const Schema = z.object({
  consentId: z.string().uuid(),
  role: z.enum(["initiator", "counterparty"])
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { consentId, role } = parsed.data;

  if (config.mode === "live") {
    // ===== Live: Signicat OAuth-redirect-flow =====
    const baseUrl = config.appUrl || new URL(req.url).origin;
    let session;
    try {
      session = await createBankIdSession(baseUrl);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[bankid/sign] Signicat session creation failed:", err);
      return NextResponse.json(
        { error: "Kunde inte starta BankID. Försök igen." },
        { status: 502 }
      );
    }

    // Spara session-id + consent-context i httpOnly signed cookie så att
    // /api/bankid/callback kan plocka upp dem efter Signicat-redirect.
    const cookieValue = signCookieValue({
      sessionId: session.id,
      consentId,
      role
    });

    const response = NextResponse.json({
      authenticationUrl: session.authenticationUrl
    });
    response.cookies.set("bankid_session", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600 // 10 min — tid att slutföra BankID
    });
    return response;
  }

  // ===== Test: mock-polling-flow (orörd från tidigare design) =====
  const session = await bankid().startSign(null, `Samtycke ${consentId}`);
  return NextResponse.json({ orderRef: session.orderRef });
}
