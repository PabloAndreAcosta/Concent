import { NextResponse } from "next/server";
import { z } from "zod";
import { bankid } from "@/lib/bankid";
import { dal } from "@/lib/dal";

const Schema = z.object({
  orderRef: z.string().min(1),
  consentId: z.string().uuid(),
  role: z.enum(["initiator", "counterparty"])
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Schema.safeParse({
    orderRef: url.searchParams.get("orderRef"),
    consentId: url.searchParams.get("consentId"),
    role: url.searchParams.get("role")
  });
  if (!parsed.success) return NextResponse.json({ status: "failed", reason: "invalid" }, { status: 400 });

  const result = await bankid().collect(parsed.data.orderRef);
  if (result.status === "complete") {
    await dal().signConsent({
      consentId: parsed.data.consentId,
      role: parsed.data.role,
      pnoHash: result.result.pnoHash,
      displayName: result.result.displayName
    });
  }
  return NextResponse.json(result);
}
