-- Customer profiles and user roles.
--
-- The browser holds a public key, so anyone can call the database directly and skip
-- NestJS. The grants and policies below must be safe on their own.

-- The "private" schema is not reachable through the Supabase API.
create schema if not exists private;
revoke all on schema private from public;

create type public.app_role as enum ('customer', 'admin');

-- Tables ----------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) between 1 and 100),
  phone text check (char_length(phone) between 5 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles are kept apart from profiles, so editing a profile can never change a role.
create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Grants: which operations each API role may attempt --------------------------

-- Start from nothing, in case the project grants access to new tables by default.
revoke all on table public.profiles, public.user_roles
  from public, anon, authenticated, service_role;

-- Logged-in users may read both tables, but edit only these two profile columns.
grant select on table public.profiles, public.user_roles to authenticated;
grant update (full_name, phone) on table public.profiles to authenticated;

-- service_role is used by NestJS with the secret key.
grant select, insert, update, delete
  on table public.profiles, public.user_roles to service_role;

-- Row Level Security: which rows they may touch -------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can read their own role"
  on public.user_roles for select to authenticated
  using ((select auth.uid()) = user_id);

-- Triggers --------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger user_roles_set_updated_at
  before update on public.user_roles
  for each row execute function private.set_updated_at();

-- Runs when someone signs up. "security definer" is required because the sign-up
-- process has no permission on these tables. The role is always 'customer': sign-up
-- metadata comes from the user and must not decide permissions.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 100), '')
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');

  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public;
revoke execute on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Users created before this migration -----------------------------------------

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

insert into public.user_roles (user_id)
select id from auth.users
on conflict (user_id) do nothing;
