alter table challenges
  add column if not exists condition text not null default '',
  add column if not exists verification text not null default '';
