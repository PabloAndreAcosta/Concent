import { NextResponse } from "next/server";
import { config } from "@/lib/config";

/**
 * /api/health — driftcheck.
 *
 * Klassisk första-steg när "varför funkar inget?" — visar mode, env-status,
 * Supabase-ping, build-info. Anropbar utan auth (men returnerar ingen
 * känslig data).
 *
 * `?deep=1` query parameter triggar Supabase round-trip ping (~50-200ms
 * extra latens).
 */
export const dynamic = "force-dynamic";

interface CheckResult {
  ok: boolean;
  detail?: string;
}

async function checkSupabase(): Promise<CheckResult> {
  if (config.mode !== "live") {
    return { ok: true, detail: "skipped (test mode)" };
  }
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    return { ok: false, detail: "env saknas" };
  }
  try {
    const { serviceClient } = await import("@/lib/supabase/client");
    const sb = serviceClient();
    // Lättviktig ping: SELECT 1
    const { error } = await sb.from("consents").select("id").limit(1);
    if (error) {
      return { ok: false, detail: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "unknown" };
  }
}

function checkEnv(): { missing: string[] } {
  if (config.mode !== "live") return { missing: [] };
  const missing: string[] = [];
  if (!config.supabase.url) missing.push("SUPABASE_URL");
  if (!config.supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!config.signicat.clientId) missing.push("SIGNICAT_CLIENT_ID");
  if (!config.signicat.clientSecret) missing.push("SIGNICAT_CLIENT_SECRET");
  if (!config.signicat.accountId) missing.push("SIGNICAT_ACCOUNT_ID");
  if (!config.pnoHmacSecret) missing.push("PNO_HMAC_SECRET");
  if (!config.appUrl) missing.push("NEXT_PUBLIC_APP_URL");
  if (!config.stripe.secretKey) missing.push("STRIPE_SECRET_KEY");
  if (!process.env.CRON_SECRET) missing.push("CRON_SECRET");
  if (!config.stripe.webhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
  return { missing };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const deep = url.searchParams.get("deep") === "1";

  const env = checkEnv();
  const supabase = deep ? await checkSupabase() : { ok: true, detail: "use ?deep=1 to probe" };

  // Build-info: Vercel sätter dessa env vars automatiskt vid deploy
  const build = {
    sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "unknown",
    deployedAt: process.env.VERCEL_DEPLOYMENT_CREATED_AT ?? null,
    region: process.env.VERCEL_REGION ?? "unknown",
    nodeEnv: process.env.NODE_ENV
  };

  const allOk = env.missing.length === 0 && supabase.ok;

  return NextResponse.json(
    {
      ok: allOk,
      mode: config.mode,
      time: new Date().toISOString(),
      delayHours: config.consentDelayHours,
      env: {
        missing: env.missing,
        all_set: env.missing.length === 0
      },
      supabase,
      build
    },
    { status: allOk ? 200 : 503 }
  );
}
