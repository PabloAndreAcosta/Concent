/**
 * Supabase server-side klient (service-role).
 *
 * VARNING: SUPABASE_SERVICE_ROLE_KEY bypassar RLS. Får ALDRIG nå klienten.
 * Använd endast i:
 *   - server components
 *   - API-routes
 *   - server actions
 *
 * Klienter ska aldrig ha denna nyckel — kräver vi någonsin anon-läsning från
 * browsern bygger vi en separat anonClient med publishable_key + RLS-policies.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

let cachedClient: SupabaseClient | null = null;

/**
 * Returnerar en cachad service-role-klient. Failar fast om env saknas och vi
 * är i live-läge. I test-läge returnerar vi en stub som kraschar vid bruk —
 * inMemoryDal ska användas istället.
 */
export function serviceClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error(
      "Supabase service-client används utan SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY. " +
      "Antingen sätt env eller använd inMemoryDal i test-läge."
    );
  }

  cachedClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      // Service-role-klient ska aldrig persistera session.
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: "public"
    }
  });

  return cachedClient;
}
