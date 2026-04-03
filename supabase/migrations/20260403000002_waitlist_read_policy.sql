-- Secure admin-only access to waitlist via RPC (security definer)
-- The waitlist table stays closed to anon/authenticated direct queries.
-- Only callers whose steam_id maps to is_admin=true in users can fetch it.

create or replace function get_waitlist_admin(p_steam_id text)
returns table (
  id             uuid,
  email          text,
  reason         text,
  status         text,
  rejection_reason text,
  applied_at     timestamptz
)
language plpgsql
security definer
as $$
begin
  if not exists (
    select 1 from users where steam_id = p_steam_id and is_admin = true
  ) then
    raise exception 'unauthorized';
  end if;

  return query
    select w.id, w.email, w.reason, w.status, w.rejection_reason, w.applied_at
    from waitlist w
    order by w.applied_at desc;
end;
$$;

grant execute on function get_waitlist_admin(text) to anon;
