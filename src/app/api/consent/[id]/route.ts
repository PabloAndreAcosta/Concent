import { NextResponse } from "next/server";
import { dal } from "@/lib/dal";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const consent = await dal().getConsent(params.id);
  if (!consent) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Exponera endast fält som är säkra för motparten innan signering.
  return NextResponse.json({
    id: consent.id,
    scope: consent.scope,
    message: consent.message,
    status: consent.status,
    initiator: { displayName: consent.initiator.displayName }
  });
}
