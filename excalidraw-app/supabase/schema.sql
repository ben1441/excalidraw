-- Run this in the Supabase SQL editor to set up the schema.

-- Drawings table
create table if not exists drawings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) not null,
  name       text not null default 'Untitled',
  elements   jsonb not null default '[]',
  app_state  jsonb not null default '{}',
  files      jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table drawings enable row level security;
create policy "owner" on drawings for all using (auth.uid() = user_id);

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger drawings_updated_at
  before update on drawings
  for each row execute function update_updated_at();

-- Comments table
create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  drawing_id uuid references drawings(id) on delete cascade not null,
  user_id    uuid references auth.users(id) not null,
  content    text not null,
  x          float8,
  y          float8,
  resolved   boolean default false,
  created_at timestamptz default now()
);

alter table comments enable row level security;
create policy "owner" on comments for all using (auth.uid() = user_id);
