import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { dal } from "@/lib/dal";

/**
 * Vercel Cron: kör var 5:e minut.
 *
 * Anropar dal().reconcileStatuses() som flyttar pending→active när
 * activates_at har passerats. Backstop för lazy-reconciliation som sker vid
 * läsning — utan cron skulle status-flyttning ske först när någon tittar på
 * consenten, vilket gör webhooks/notifieringar opålitliga.
 *
 * Vercel sätter automatiskt headern `Authorization: Bearer ${CRON_SECRET}` på
 * cron-anrop. Vi verifierar mot CRON_SECRET i env för att förhindra obehörig
 * åtkomst (utan auth skulle vem som helst kunna spamma endpoint:en).
 *
 * Reference: https://vercel.com/docs/cron-jobs/manage-cron-jobs#secure-cron-jobs
 *
 * Schema i vercel.json: var 5:e minut.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Säkerhet: Vercel skickar CRON_SECRET som Authorization-header
  if (config.mode === "live") {
    const authHeader = req.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
    if (!process.env.CRON_SECRET || authHeader !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await dal().reconcileStatuses(new Date());
    return NextResponse.json({
      ok: true,
      updated: result.updated,
      ranAt: new Date().toISOString()
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[cron/reconcile] failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
