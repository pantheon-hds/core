-- Rate limiting table: one row per (ip, endpoint), resets when window expires
create table if not exists rate_limits (
  ip             text        not null,
  endpoint       text        not null,
  count          integer     not null default 1,
  window_start   timestamptz not null default now(),
  primary key (ip, endpoint)
);

-- Atomically increment counter, reset window if expired.
-- Returns true = request allowed, false = blocked.
create or replace function check_rate_limit(
  p_ip             text,
  p_endpoint       text,
  p_limit          integer,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
as $$
declare
  v_count integer;
begin
  insert into rate_limits (ip, endpoint, count, window_start)
  values (p_ip, p_endpoint, 1, now())
  on conflict (ip, endpoint) do update set
    count = case
      when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
        then 1
        else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
        then now()
        else rate_limits.window_start
    end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Only service role can read/write (Edge Functions use service key)
alter table rate_limits enable row level security;

create policy "service_rate_limits" on rate_limits
  for all to service_role using (true) with check (true);
