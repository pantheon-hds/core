-- One-time auth codes for the Steam OAuth code-exchange flow.
-- steam-auth stores a short-lived code here instead of passing the JWT in the redirect URL.
-- exchange-code validates and consumes the code, returning the JWT in the response body.

create table auth_codes (
  code        text         primary key,
  user_id     uuid         not null references users(id) on delete cascade,
  steam_id    text         not null,
  username    text         not null,
  avatar_url  text         not null,
  is_public   boolean      not null default false,
  token       text         not null,
  expires_at  timestamptz  not null,
  used        boolean      not null default false
);

alter table auth_codes enable row level security;
-- No public policies — only the service role (Edge Functions) may access this table.
