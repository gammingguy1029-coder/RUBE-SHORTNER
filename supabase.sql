create table links (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,
  destination_url text not null,
  created_at timestamptz default now(),
  views int default 0,
  enabled boolean default true
);
create index on links (short_code);
