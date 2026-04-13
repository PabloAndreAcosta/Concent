import { NextResponse } from "next/server";
import { z } from "zod";
import { bankid } from "@/lib/bankid";

/**
 * TODO (innan produktion):
 *   - Rate limit per IP (t.ex. 5/min).
 *   - Logga endast orderRef, aldrig personnummer.
 *   - Verifiera origin/CSRF-token.
 */
const Schema = z.object({
  consentId: z.string().uuid(),
  role: z.enum(["initiator", "counterparty"])
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const session = await bankid().startSign(null, `Samtycke ${parsed.data.consentId}`);
  return NextResponse.json({ orderRef: session.orderRef });
}
