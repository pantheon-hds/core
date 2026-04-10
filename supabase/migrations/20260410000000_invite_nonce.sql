-- Add nonce column to invite_codes for secure Steam OAuth linking
alter table invite_codes add column if not exists nonce text unique;

-- Update validate_invite_code to return nonce instead of boolean.
-- Does NOT mark the code as used — steam-auth does that when the user completes Steam login.
-- This means the user can re-enter the code as many times as needed before logging in.
create or replace function validate_invite_code(p_code text)
returns text
language plpgsql
security definer
as $$
declare
  v_id    uuid;
  v_nonce text;
begin
  select id into v_id
  from invite_codes
  where code = p_code and used = false;

  if v_id is null then return null; end if;

  v_nonce := gen_random_uuid()::text;

  -- Only set the nonce; used stays false until steam-auth consumes it
  update invite_codes
  set nonce = v_nonce, used_at = now()
  where id = v_id;

  return v_nonce;
end;
$$;
