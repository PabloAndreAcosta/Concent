import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: config.mode,
    delayHours: config.consentDelayHours,
    time: new Date().toISOString()
  });
}
