/**
 * Supabase-implementation av DAL.
 *
 * STATUS: stub. Schema och queries är dokumenterade nedan men inte aktiverade.
 * När du migrerar:
 *   1. Skapa tabellen `consents` enligt schemat i kommentaren under.
 *   2. Aktivera RLS — endast service-role får skriva, anon kan läsa egen rad via pno_hash-match.
 *   3. Installera @supabase/supabase-js och fyll i metoderna.
 *   4. Byt selectDal() i dal/index.ts till att returnera supabaseDal i live-mode.
 *
 * Tabellschema (kör som migration):
 *
 *   create table consents (
 *     id uuid primary key default gen_random_uuid(),
 *     initiator_pno_hash text not null,
 *     initiator_display_name text not null,
 *     initiator_signed_at timestamptz not null,
 *     counterparty_pno_hash text,
 *     counterparty_display_name text,
 *     counterparty_signed_at timestamptz,
 *     created_at timestamptz not null default now(),
 *     both_signed_at timestamptz,
 *     activates_at timestamptz,
 *     revoked_at timestamptz,
 *     revoked_by text,
 *     status text not null default 'pending',
 *     scope text not null
 *   );
 *
 *   alter table consents enable row level security;
 *
 *   create policy "read own" on consents for select using (
 *     initiator_pno_hash = current_setting('request.jwt.claim.pno_hash', true)
 *     or counterparty_pno_hash = current_setting('request.jwt.claim.pno_hash', true)
 *   );
 */
import type { Dal } from "./types";

export const supabaseDal: Dal = {
  async createConsent() {
    throw new Error("supabaseDal not implemented — see src/lib/dal/supabase.ts");
  },
  async getConsent() {
    throw new Error("supabaseDal not implemented");
  },
  async listConsentsByPno() {
    throw new Error("supabaseDal not implemented");
  },
  async signConsent() {
    throw new Error("supabaseDal not implemented");
  },
  async revokeConsent() {
    throw new Error("supabaseDal not implemented");
  },
  async reconcileStatuses() {
    throw new Error("supabaseDal not implemented");
  }
};
