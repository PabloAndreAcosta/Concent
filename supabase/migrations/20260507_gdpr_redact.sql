-- redact_consents_by_pno_hash(pno_hash):
--   GDPR Art 17 (rätten att bli glömd) — redactar alla consents för en
--   pno_hash. Bevarar audit_log-stomme och tidsstämplar för bevisspår.
--
-- Användning: Pablo kör manuellt vid GDPR-radering-begäran.
--   select public.redact_consents_by_pno_hash('hashvärdet_från_användarens_pnr');
--
-- Säkerhet: function är security definer → bypassar RLS. Kan endast anropas
-- via Supabase dashboard SQL-konsoll eller via service-role-klient.

create or replace function public.redact_consents_by_pno_hash(p_pno_hash text)
returns table(redacted_count bigint)
language plpgsql
security definer
as $$
declare
  v_consent_ids uuid[];
  v_consent_id uuid;
  v_count bigint;
begin
  select array_agg(id) into v_consent_ids
  from public.consents
  where (initiator_pno_hash = p_pno_hash or counterparty_pno_hash = p_pno_hash)
    and redacted = false;

  if v_consent_ids is null then
    return query select 0::bigint;
    return;
  end if;

  v_count := array_length(v_consent_ids, 1);

  -- Tombstone-event innan PII rensas. Vi rensar inte event-rader (append-only
  -- enforcement förhindrar det och hash-kedjan skulle brytas).
  foreach v_consent_id in array v_consent_ids
  loop
    perform public.append_audit_event(
      v_consent_id,
      'redacted',
      null,
      'system',
      jsonb_build_object(
        'redacted_at', now(),
        'reason', 'gdpr_request'
      )
    );
  end loop;

  -- Rensa PII. Behåller: id, tidsstämplar, status, payment_intent_id, revoked_by.
  update public.consents
  set
    initiator_pno_hash = '[redacted]',
    initiator_display_name = '[redacted]',
    counterparty_pno_hash = case when counterparty_pno_hash is not null then '[redacted]' else null end,
    counterparty_display_name = case when counterparty_display_name is not null then '[redacted]' else null end,
    scope = '[redacted]',
    message = null,
    redacted = true,
    redacted_at = now()
  where id = any(v_consent_ids);

  return query select v_count;
end;
$$;

comment on function public.redact_consents_by_pno_hash is
  'GDPR Art 17 (rätten att bli glömd) — redactar alla consents för en pno_hash. Bevarar audit_log-stomme och tidsstämplar för bevisspår. Anropas manuellt av admin.';
