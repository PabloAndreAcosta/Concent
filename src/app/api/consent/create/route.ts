import { NextResponse } from "next/server";
import { z } from "zod";
import { dal } from "@/lib/dal";

const Schema = z.object({ scope: z.string().min(5).max(500) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  // I test-läge skapar vi en placeholder-initiator. När BankID är på plats
  // hämtas pnoHash + displayName från BankID-svaret innan createConsent kallas.
  const consent = await dal().createConsent({
    initiatorPnoHash: "PENDING",
    initiatorDisplayName: "(ej signerad)",
    scope: parsed.data.scope
  });
  return NextResponse.json({ consentId: consent.id });
}
