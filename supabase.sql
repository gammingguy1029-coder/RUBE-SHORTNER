-- Every statement is idempotent. Postgres aborts the whole batch on the first
-- error, so a bare `create table` on an existing database stopped the script at
-- line 1 and login_attempts below was never created.
create table if not exists links (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,
  destination_url text not null,
  created_at timestamptz default now(),
  views int default 0,
  enabled boolean default true
);
-- Note: the unique constraint on short_code already creates an index, so this
-- one is redundant. Harmless, kept to avoid changing behaviour. Named rather
-- than auto-named: an auto-named index gets a numeric suffix on conflict, so
-- re-running would silently pile up links_short_code_idx1, idx2, and so on.
create index if not exists links_short_code_idx on links (short_code);

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

-- Atomic view increment — avoids read-then-write race that undercounts concurrent hits.
create or replace function increment_link_views(p_id uuid)
returns void language sql security definer as $$
  update links set views = coalesce(views,0) + 1 where id = p_id;
$$;
