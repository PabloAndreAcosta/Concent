import { NextResponse } from "next/server";
import { z } from "zod";
import { dal } from "@/lib/dal";

const Schema = z.object({
  scope: z.string().min(5).max(500),
  message: z.string().max(1000).optional()
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const consent = await dal().createConsent({
    initiatorPnoHash: "PENDING",
    initiatorDisplayName: "(ej signerad)",
    scope: parsed.data.scope,
    message: parsed.data.message?.trim() || null
  });
  return NextResponse.json({ consentId: consent.id });
}
