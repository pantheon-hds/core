-- Create a view with only public-safe fields from users.
-- The anon key can query this view; the full users table is no longer public.

create or replace view public_profiles as
select
  id,
  username,
  steam_id,
  avatar_url,
  created_at,
  is_judge
from users;

-- Grant read access to anon and authenticated roles
grant select on public_profiles to anon, authenticated;

-- Remove the public read policy from the users table
drop policy if exists "public read" on users;

-- Allow users to read only their own row (needed for nothing currently —
-- all sensitive reads go through Edge Functions with service role key)
-- We add no new SELECT policy: service role bypasses RLS entirely.
