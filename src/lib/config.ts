/**
 * Central konfiguration. Läses en gång vid uppstart.
 * Om en variabel saknas i live-läge — fail fast hellre än att tyst köra mock.
 */
export type AppMode = "test" | "live";

export const config = {
  mode: (process.env.APP_MODE ?? "test") as AppMode,
  consentDelayHours: Number(process.env.CONSENT_DELAY_HOURS ?? 72),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
  supabase: {
    url: process.env.SUPABASE_URL ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    anonKey: process.env.SUPABASE_ANON_KEY ?? ""
  },
  signicat: {
    clientId: process.env.SIGNICAT_CLIENT_ID ?? "",
    clientSecret: process.env.SIGNICAT_CLIENT_SECRET ?? "",
    accountId: process.env.SIGNICAT_ACCOUNT_ID ?? "",
    apiBase: process.env.SIGNICAT_API_BASE ?? "https://api.signicat.com"
  },
  pnoHmacSecret: process.env.PNO_HMAC_SECRET ?? ""
};

export function assertLiveConfig(): void {
  if (config.mode !== "live") return;
  const missing: string[] = [];
  if (!config.supabase.url) missing.push("SUPABASE_URL");
  if (!config.supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!config.signicat.clientId) missing.push("SIGNICAT_CLIENT_ID");
  if (!config.signicat.clientSecret) missing.push("SIGNICAT_CLIENT_SECRET");
  if (!config.signicat.accountId) missing.push("SIGNICAT_ACCOUNT_ID");
  if (!config.pnoHmacSecret) missing.push("PNO_HMAC_SECRET");
  if (!config.appUrl) missing.push("NEXT_PUBLIC_APP_URL");
  if (missing.length) {
    throw new Error(
      `APP_MODE=live men följande env saknas: ${missing.join(", ")}`
    );
  }
}
