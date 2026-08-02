create table links (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,
  destination_url text not null,
  created_at timestamptz default now(),
  views int default 0,
  enabled boolean default true
);
-- Note: the unique constraint on short_code already creates an index, so the
-- explicit one below is redundant. Harmless, kept to avoid changing behaviour.
create index on links (short_code);

-- Brute-force tracking for admin login. Must live in the database, not memory:
-- in-memory counters reset on every serverless cold start and aren't shared
-- across concurrent instances, so they don't actually limit anything.
create table if not exists login_attempts (
  ip_hash text primary key,
  failures int not null default 0,
  last_attempt timestamptz not null default now()
);

-- Both tables are only ever read/written by the server using the service-role
-- key, which bypasses RLS. Enabling RLS with no policies means that if the anon
-- key is ever exposed, it grants no access to either table.
alter table links enable row level security;
alter table login_attempts enable row level security;
