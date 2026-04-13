/**
 * Central konfiguration. Läses en gång vid uppstart.
 * Om en variabel saknas i live-läge — fail fast hellre än att tyst köra mock.
 */
export type AppMode = "test" | "live";

export const config = {
  mode: (process.env.APP_MODE ?? "test") as AppMode,
  consentDelayHours: Number(process.env.CONSENT_DELAY_HOURS ?? 72),
  supabase: {
    url: process.env.SUPABASE_URL ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    anonKey: process.env.SUPABASE_ANON_KEY ?? ""
  },
  bankid: {
    certPath: process.env.BANKID_CERT_PATH ?? "",
    certPassword: process.env.BANKID_CERT_PASSWORD ?? "",
    apiUrl: process.env.BANKID_API_URL ?? "https://appapi2.test.bankid.com/rp/v6.0"
  }
};

export function assertLiveConfig(): void {
  if (config.mode !== "live") return;
  const missing: string[] = [];
  if (!config.supabase.url) missing.push("SUPABASE_URL");
  if (!config.supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!config.bankid.certPath) missing.push("BANKID_CERT_PATH");
  if (missing.length) {
    throw new Error(
      `APP_MODE=live men följande env saknas: ${missing.join(", ")}`
    );
  }
}
