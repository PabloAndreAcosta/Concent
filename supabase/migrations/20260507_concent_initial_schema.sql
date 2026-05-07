-- Concent v1 — initial schema
-- Created: 2026-05-07
--
-- Designprinciper (från AGENTS.md):
--   - Personnummer SHA-256-hashas, sparas aldrig i klartext
--   - Tombsten istället för hard delete (bevarar bevisspår)
--   - All skrivning via service-role; anon-läsning blockerad här (vi gör allt server-side)
--   - Audit-logg är hash-chained (SHA-256 av previous_hash || canonical(payload))
--
-- Domänmodell baseras på src/lib/types.ts:
--   Consent { id, initiator: Party, counterparty: Party, createdAt, bothSignedAt,
--             activatesAt, revokedAt, revokedBy, status, scope, message }
--   Party { id, pnoHash, displayName, signedAt }
--
-- Status-livscykel: pending → active → revoked | expired

-- =============================================================================
-- consents — den centrala domänen
-- =============================================================================
create table public.consents (
  id uuid primary key default gen_random_uuid(),

  -- Initiator (den som skapar samtycket och betalar)
  initiator_pno_hash text not null,
  initiator_display_name text not null,
  initiator_signed_at timestamptz not null,

  -- Counterparty (den som godkänner — fyll i när hen signerat)
  counterparty_pno_hash text,
  counterparty_display_name text,
  counterparty_signed_at timestamptz,

  -- Tidsstämplar
  created_at timestamptz not null default now(),
  both_signed_at timestamptz,
  activates_at timestamptz,
  revoked_at timestamptz,
  revoked_by text check (revoked_by in ('initiator', 'counterparty')),

  -- Status
  status text not null default 'pending'
    check (status in ('pending', 'active', 'revoked', 'expired')),

  -- Innehåll
  scope text not null,
  message text,

  -- Stripe-betalning (avsändare betalar 50 kr vid skapande)
  payment_intent_id text,
  paid_at timestamptz,

  -- Tombsten för GDPR-radering (sätt till true istället för delete)
  redacted boolean not null default false,
  redacted_at timestamptz,

  -- Sanity-constraints
  constraint signed_initiator_check
    check (initiator_pno_hash <> '' and initiator_display_name <> ''),
  constraint counterparty_completeness
    check (
      (counterparty_signed_at is null and counterparty_pno_hash is null)
      or
      (counterparty_signed_at is not null and counterparty_pno_hash is not null)
    ),
  constraint both_signed_consistency
    check (
      (both_signed_at is null) or
      (both_signed_at is not null and counterparty_signed_at is not null)
    ),
  constraint activation_requires_both_signed
    check (
      (activates_at is null) or
      (activates_at is not null and both_signed_at is not null)
    ),
  constraint revoke_consistency
    check (
      (revoked_at is null and revoked_by is null)
      or
      (revoked_at is not null and revoked_by is not null)
    )
);

-- Indexes för "min consents"-listan + reconcile-jobb
create index consents_initiator_pno_idx
  on public.consents (initiator_pno_hash) where redacted = false;
create index consents_counterparty_pno_idx
  on public.consents (counterparty_pno_hash) where redacted = false and counterparty_pno_hash is not null;
create index consents_pending_activation_idx
  on public.consents (activates_at) where status = 'pending' and activates_at is not null;
create index consents_payment_intent_idx
  on public.consents (payment_intent_id) where payment_intent_id is not null;

comment on table public.consents is
  'Samtycken. Skrivs endast via service-role. pno_hash = sha256(personnummer) — aldrig klartext.';

-- =============================================================================
-- audit_log — tamper-evident hash-chained log (juridisk bevisbas)
-- =============================================================================
--
-- Varje rad är en oföränderlig händelse. current_hash = sha256(previous_hash || canonical_payload).
-- Bryter någon en mellan-rad så bryts kedjan och /verify-endpointen visar det.
--
create table public.audit_log (
  id bigserial primary key,
  consent_id uuid not null references public.consents(id) on delete restrict,

  action text not null check (action in (
    'consent_created',
    'initiator_signed',
    'counterparty_signed',
    'consent_activated',
    'consent_revoked',
    'consent_expired',
    'payment_completed',
    'redacted'
  )),

  -- Vem utförde handlingen (om relevant)
  actor_pno_hash text,
  actor_role text check (actor_role in ('initiator', 'counterparty', 'system')),

  -- Snapshot av relevant state vid tidpunkten — canonical JSON
  payload jsonb not null,

  -- Hash chain
  previous_hash text,                   -- null för första raden i kedjan
  current_hash text not null,           -- sha256(previous_hash || canonical(payload))

  created_at timestamptz not null default now(),

  -- Ev. forensisk metadata (frivilligt)
  ip inet,
  user_agent text
);

create index audit_log_consent_idx on public.audit_log (consent_id, created_at);
create index audit_log_action_idx on public.audit_log (action);

comment on table public.audit_log is
  'Tamper-evident händelselogg. Skrivs ENDAST av service-role, ALDRIG uppdateras eller raderas.';

-- =============================================================================
-- Säkerhet: blockera UPDATE/DELETE på audit_log
-- =============================================================================
-- Append-only: även service-role ska inte kunna ändra historik.
create or replace function public.audit_log_no_modify()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only — UPDATE/DELETE is forbidden';
end;
$$;

create trigger audit_log_block_update
  before update on public.audit_log
  for each row execute function public.audit_log_no_modify();

create trigger audit_log_block_delete
  before delete on public.audit_log
  for each row execute function public.audit_log_no_modify();

-- =============================================================================
-- Hash-chain hjälpfunktion: append_audit_event
-- =============================================================================
-- Beräknar previous_hash + current_hash automatiskt så server-koden inte kan
-- råka skriva fel hash. Använd denna istället för direkt INSERT.
--
create or replace function public.append_audit_event(
  p_consent_id uuid,
  p_action text,
  p_actor_pno_hash text,
  p_actor_role text,
  p_payload jsonb,
  p_ip inet default null,
  p_user_agent text default null
) returns bigint
language plpgsql
security definer
as $$
declare
  v_prev_hash text;
  v_canonical text;
  v_current_hash text;
  v_new_id bigint;
begin
  -- Hämta senaste hash för detta consent (eller globalt — vi väljer per-consent kedja)
  select current_hash into v_prev_hash
  from public.audit_log
  where consent_id = p_consent_id
  order by id desc
  limit 1;

  -- Canonical JSON för deterministisk hash. jsonb_build_object säkrar nyckelordning.
  v_canonical := jsonb_build_object(
    'consent_id', p_consent_id,
    'action', p_action,
    'actor_pno_hash', p_actor_pno_hash,
    'actor_role', p_actor_role,
    'payload', p_payload,
    'previous_hash', coalesce(v_prev_hash, '')
  )::text;

  -- SHA-256 av canonical
  v_current_hash := encode(digest(v_canonical, 'sha256'), 'hex');

  insert into public.audit_log (
    consent_id, action, actor_pno_hash, actor_role,
    payload, previous_hash, current_hash, ip, user_agent
  ) values (
    p_consent_id, p_action, p_actor_pno_hash, p_actor_role,
    p_payload, v_prev_hash, v_current_hash, p_ip, p_user_agent
  ) returning id into v_new_id;

  return v_new_id;
end;
$$;

comment on function public.append_audit_event is
  'Append-only hjälpfunktion som beräknar hash chain. Använd denna istället för direkt INSERT.';

-- pgcrypto behövs för digest()
create extension if not exists pgcrypto;

-- =============================================================================
-- Row Level Security
-- =============================================================================
-- Vi gör allt server-side via service-role. Anon/auth får INTE skriva eller läsa.
-- Om vi senare öppnar anon-läsning för "verify chain"-publik endpoint så lägger
-- vi en separat policy för det.

alter table public.consents enable row level security;
alter table public.audit_log enable row level security;

-- Inga policies = inget tillåtet för anon/auth. service-role bypassar RLS.

-- =============================================================================
-- Reconcile-helper: automatisk pending → active när activates_at passerats
-- =============================================================================
create or replace function public.reconcile_consent_statuses(p_now timestamptz default now())
returns table(updated_count bigint)
language plpgsql
security definer
as $$
declare
  v_count bigint;
begin
  with updated as (
    update public.consents
    set status = 'active'
    where status = 'pending'
      and activates_at is not null
      and activates_at <= p_now
      and revoked_at is null
    returning id
  )
  select count(*) into v_count from updated;

  return query select v_count;
end;
$$;

comment on function public.reconcile_consent_statuses is
  'Drift-jobb: flyttar pending→active när tidsfönstret passerats. Anropa via cron eller lat vid läsning.';
