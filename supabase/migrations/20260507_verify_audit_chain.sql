-- verify_audit_chain(consent_id): verifierar hash-kedjan server-side.
-- Recompute:ar varje events hash med samma formel som append_audit_event.
-- Returnerar två integritetsflaggor:
--   hash_intact: stored current_hash = sha256(canonical(payload + previous_hash))
--   link_intact: previous_hash matchar föregående events current_hash
-- Kedjan är intakt iff båda är TRUE för alla events.

drop function if exists public.verify_audit_chain(uuid);

create function public.verify_audit_chain(p_consent_id uuid)
returns table(
  event_id bigint,
  action text,
  actor_role text,
  payload jsonb,
  previous_hash text,
  current_hash text,
  created_at timestamptz,
  hash_intact boolean,
  link_intact boolean
)
language plpgsql
security definer
as $$
declare
  v_prev_hash text;
  r public.audit_log%rowtype;
  v_canonical text;
  v_expected_hash text;
begin
  v_prev_hash := null;

  for r in (
    select * from public.audit_log al
    where al.consent_id = p_consent_id
    order by al.id
  ) loop
    v_canonical := jsonb_build_object(
      'consent_id', p_consent_id,
      'action', r.action,
      'actor_pno_hash', r.actor_pno_hash,
      'actor_role', r.actor_role,
      'payload', r.payload,
      'previous_hash', coalesce(v_prev_hash, '')
    )::text;

    v_expected_hash := encode(digest(v_canonical, 'sha256'), 'hex');

    event_id := r.id;
    action := r.action;
    actor_role := r.actor_role;
    payload := r.payload;
    previous_hash := r.previous_hash;
    current_hash := r.current_hash;
    created_at := r.created_at;
    hash_intact := (v_expected_hash = r.current_hash);
    link_intact := (coalesce(r.previous_hash, '') = coalesce(v_prev_hash, ''));

    return next;

    v_prev_hash := r.current_hash;
  end loop;
end;
$$;

comment on function public.verify_audit_chain is
  'Verifierar audit_log-kedjan för en consent. Anropas av /api/verify/[id].';
