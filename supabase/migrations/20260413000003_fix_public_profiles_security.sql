-- Fix: public_profiles view was implicitly SECURITY DEFINER (PostgreSQL default),
-- meaning it ran as the view owner (postgres) and bypassed RLS on the users table.
--
-- Fix: switch to SECURITY INVOKER so the view respects the caller's permissions.
-- To allow anon to still read through the view, we grant SELECT on only the safe
-- columns of users (column-level grant) and add a permissive RLS policy.

-- 1. Grant SELECT only on public-safe columns — anon cannot read sensitive fields
--    (is_admin, is_banned, ban_reason, etc.) directly even if they try.
grant select (id, username, steam_id, avatar_url, created_at, is_judge)
  on users to anon, authenticated;

-- 2. Allow anon/authenticated to read rows via RLS (all rows are public-safe here
--    because column-level grants prevent access to sensitive fields).
create policy "public user data readable by all"
  on users for select
  to anon, authenticated
  using (true);

-- 3. Switch view to SECURITY INVOKER — now runs as the calling user, respects RLS.
create or replace view public_profiles
  with (security_invoker = true)
as
select
  id,
  username,
  steam_id,
  avatar_url,
  created_at,
  is_judge
from users;

-- Re-apply the view grant (recreating the view may drop it).
grant select on public_profiles to anon, authenticated;
