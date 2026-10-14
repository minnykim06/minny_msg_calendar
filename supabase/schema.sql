-- minny & msg calendar — schema + row level security
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses "create table if not exists" / "drop policy if exists".

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per account (there are only ever two: minny and msg)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (display_name in ('minny', 'msg')),
  timezone text not null,          -- IANA zone, e.g. 'America/Los_Angeles' or 'Asia/Seoul'
  color text not null,             -- tailwind-friendly hex used consistently in the UI
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- settings: per-person awake-hours window (used by "best time to talk")
-- ---------------------------------------------------------------------------
create table if not exists settings (
  owner_id uuid primary key references profiles (id) on delete cascade,
  awake_start_local time not null default '08:00',
  awake_end_local time not null default '23:00'
);

-- ---------------------------------------------------------------------------
-- events: each person's calendar entries, always stored as UTC instants
-- ---------------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  start_utc timestamptz not null,
  end_utc timestamptz not null,
  note text,
  category text not null default 'Free'
    check (category in ('Work', 'Class', 'Sleep', 'Free', 'Date Call')),
  created_at timestamptz not null default now(),
  constraint events_end_after_start check (end_utc > start_utc)
);

create index if not exists events_owner_start_idx on events (owner_id, start_utc);

-- ---------------------------------------------------------------------------
-- trip_countdown: a single shared row holding the date of the next visit
-- ---------------------------------------------------------------------------
create table if not exists trip_countdown (
  id int primary key default 1 check (id = 1), -- singleton row
  target_date date,
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now()
);

insert into trip_countdown (id, target_date)
values (1, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Only the two signed-in accounts (authenticated role) may read/write, and
-- each person may only ever modify rows that belong to them.
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table settings enable row level security;
alter table events enable row level security;
alter table trip_countdown enable row level security;

-- profiles: both can see both profiles (needed to show the partner's name/
-- color/timezone), but you may only edit your own row.
drop policy if exists "profiles_select_both" on profiles;
create policy "profiles_select_both" on profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update to authenticated using (auth.uid() = id);

-- settings: both can read both (needed for the overlap calculation), but you
-- may only edit your own awake-hours window.
drop policy if exists "settings_select_both" on settings;
create policy "settings_select_both" on settings
  for select to authenticated using (true);

drop policy if exists "settings_insert_own" on settings;
create policy "settings_insert_own" on settings
  for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "settings_update_own" on settings;
create policy "settings_update_own" on settings
  for update to authenticated using (auth.uid() = owner_id);

-- events: both can read all events (so you can see your partner's schedule),
-- but you may only insert/update/delete your own events.
drop policy if exists "events_select_both" on events;
create policy "events_select_both" on events
  for select to authenticated using (true);

drop policy if exists "events_insert_own" on events;
create policy "events_insert_own" on events
  for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "events_update_own" on events;
create policy "events_update_own" on events
  for update to authenticated using (auth.uid() = owner_id);

drop policy if exists "events_delete_own" on events;
create policy "events_delete_own" on events
  for delete to authenticated using (auth.uid() = owner_id);

-- trip_countdown: shared — either person can read or set the next-visit date.
drop policy if exists "trip_countdown_select_both" on trip_countdown;
create policy "trip_countdown_select_both" on trip_countdown
  for select to authenticated using (true);

drop policy if exists "trip_countdown_update_both" on trip_countdown;
create policy "trip_countdown_update_both" on trip_countdown
  for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Realtime: let both clients subscribe to live changes on events/countdown
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table trip_countdown;
