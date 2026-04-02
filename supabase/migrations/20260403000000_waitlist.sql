-- Waitlist: stores beta applications
create table if not exists waitlist (
  id             uuid        primary key default gen_random_uuid(),
  email          text        not null unique,
  reason         text,
  status         text        not null default 'pending'
                             check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  applied_at     timestamptz default now()
);

-- Invite codes: one-time use codes sent via email
create table if not exists invite_codes (
  id         uuid        primary key default gen_random_uuid(),
  code       text        not null unique,
  email      text        not null,
  used       boolean     not null default false,
  created_at timestamptz default now(),
  used_at    timestamptz
);

-- Atomically validate and consume an invite code
create or replace function validate_invite_code(p_code text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from invite_codes
  where code = p_code and used = false;

  if v_id is null then return false; end if;

  update invite_codes
  set used = true, used_at = now()
  where id = v_id;

  return true;
end;
$$;

-- RLS
alter table waitlist enable row level security;
alter table invite_codes enable row level security;

-- Anyone can submit a beta application
create policy "anon_insert_waitlist" on waitlist
  for insert to anon with check (true);

-- Service role has full access to both tables
create policy "service_waitlist" on waitlist
  for all to service_role using (true) with check (true);

create policy "service_invite_codes" on invite_codes
  for all to service_role using (true) with check (true);
