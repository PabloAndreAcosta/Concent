import { NextResponse } from "next/server";
import { z } from "zod";
import { dal } from "@/lib/dal";

const Schema = z.object({
  consentId: z.string().uuid(),
  by: z.enum(["initiator", "counterparty"])
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const consent = await dal().revokeConsent(parsed.data.consentId, parsed.data.by);
  return NextResponse.json({ consent });
}
