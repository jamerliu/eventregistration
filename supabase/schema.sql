-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).
-- It sets up everything the app needs: three tables, row-level security, and a trigger that
-- auto-creates a profile row whenever someone signs in for the first time.

-- 1. Profiles — one row per user, mirroring auth.users, plus a role.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  name       text,
  first_name text not null default '',
  last_name  text not null default '',
  year_group text not null default '1A' check (year_group in ('1A', '2A', 'EXCHANGE')),
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
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz
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

-- 3b. Admin allow-list — manage this table directly (Table Editor → admin_emails → Insert row)
-- to grant or revoke admin access. No env var, no redeploy needed. Add an email here *before*
-- someone signs up and they'll be made an admin the moment they do; add it after they've
-- already signed up and they'll be promoted the next time they load the app.
create table if not exists public.admin_emails (
  email      text primary key,
  added_at   timestamptz not null default now()
);

-- 4. Auto-create a profile row the moment someone signs in for the first time.
-- If their email is already in admin_emails, they're created as an ADMIN immediately.
-- first_name / last_name / year_group come from the sign-up form (passed as user metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_first_name text := coalesce(new.raw_user_meta_data ->> 'first_name', '');
  v_last_name  text := coalesce(new.raw_user_meta_data ->> 'last_name', '');
  v_year_group text := coalesce(new.raw_user_meta_data ->> 'year_group', '1A');
begin
  insert into public.profiles (id, email, name, first_name, last_name, year_group, role)
  values (
    new.id,
    new.email,
    trim(v_first_name || ' ' || v_last_name),
    v_first_name,
    v_last_name,
    v_year_group,
    case when exists (select 1 from public.admin_emails where email = lower(new.email))
         then 'ADMIN' else 'STUDENT' end
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
alter table public.admin_emails  enable row level security;
-- No policies on admin_emails at all — it's readable/writable only via the service-role
-- key (which bypasses RLS) or by you directly in the Supabase Table Editor, which uses
-- your own project owner privileges rather than RLS.

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
