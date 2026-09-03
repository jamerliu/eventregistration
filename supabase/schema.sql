-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
-- It sets up everything the app needs: three tables, row-level security, and a trigger that
-- auto-creates a profile row whenever someone signs in for the first time.

-- 1. Profiles — one row per user, mirroring auth.users, plus a role.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  name       text,
  role       text not null default 'STUDENT' check (role in ('STUDENT', 'ADMIN')),
  created_at timestamptz not null default now()
);

-- 2. Events
create table if not exists public.events (
  id                     uuid primary key default gen_random_uuid(),
  title                  text not null,
  description            text not null,
  location               text not null,
  starts_at              timestamptz not null,
  registration_deadline  timestamptz not null,
  max_attendees          int not null,
  draw_status            text not null default 'OPEN' check (draw_status in ('OPEN', 'CLOSED', 'DRAWN')),
  created_by             uuid references public.profiles(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- 3. Registrations — one row per (user, event) pair.
create table if not exists public.registrations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade,
  event_id   uuid references public.events(id) on delete cascade,
  status     text not null default 'PENDING'
             check (status in ('PENDING', 'SELECTED', 'WAITLISTED', 'NOT_SELECTED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

-- 4. Auto-create a profile row the moment someone signs in for the first time.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Row-Level Security.
-- The app's server-side code uses the SERVICE ROLE key for all writes and admin reads (which
-- bypasses RLS entirely, since our own API routes already check auth + role before running
-- anything sensitive). These policies are a second line of defense in case anything ever
-- queries Supabase directly with a user's own session instead.

alter table public.profiles      enable row level security;
alter table public.events        enable row level security;
alter table public.registrations enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Anyone signed in can read events"
  on public.events for select
  to authenticated
  using (true);

create policy "Users can read their own registrations"
  on public.registrations for select
  using (auth.uid() = user_id);

create policy "Users can register themselves"
  on public.registrations for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel their own pending registration"
  on public.registrations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
