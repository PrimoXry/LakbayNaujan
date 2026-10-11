-- LAKBAYNAUJAN MVP - Run in Supabase Dashboard > SQL Editor.
-- Run BEFORE creating user/admin accounts.
-- Roles are NEVER selected by users during sign-up.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_ci_unique
  on public.profiles (lower(username));
-- This enforces no more than ONE admin across all profiles.
create unique index if not exists exactly_one_possible_admin
  on public.profiles ((1)) where role = 'admin';

-- Assign role 'user' on account creation. Ignore untrusted client role metadata.
create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare requested_username text;
begin
  requested_username := coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
     'user_' || left(replace(new.id::text, '-', ''), 8));
  insert into public.profiles(id, username, role)
  values (new.id, requested_username, 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_lakbay on auth.users;
create trigger on_auth_user_created_lakbay
  after insert on auth.users for each row execute function public.create_profile_for_new_user();

-- This definer-owned function can check roles without recursive RLS.
create or replace function public.is_lakbay_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_lakbay_admin() from public;
grant execute on function public.is_lakbay_admin() to authenticated;

alter table public.profiles enable row level security;
drop policy if exists "View own profile" on public.profiles;
create policy "View own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
-- No client insert/update/delete policy for profiles: only the trigger and
-- privileged SQL administrator can create or change a role.

grant select on public.profiles to authenticated;

create table if not exists public.tourist_spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Nature',
  description text not null,
  address text not null,
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  image_url text,
  entrance_fee text,
  opening_hours text,
  best_time_to_visit text,
  bucket_list text[] not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null))
);
create table if not exists public.nearby_places (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.tourist_spots(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('Carinderia', 'Sari-sari Store', 'Other')),
  address text not null,
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null))
);
create index if not exists nearby_places_spot_idx on public.nearby_places(spot_id);

alter table public.tourist_spots enable row level security;
alter table public.nearby_places enable row level security;

drop policy if exists "Users can view tourist spots" on public.tourist_spots;
drop policy if exists "Admin can add spots" on public.tourist_spots;
drop policy if exists "Admin can edit spots" on public.tourist_spots;
drop policy if exists "Admin can delete spots" on public.tourist_spots;
create policy "Users can view tourist spots" on public.tourist_spots
  for select to authenticated using (true);
create policy "Admin can add spots" on public.tourist_spots
  for insert to authenticated with check (public.is_lakbay_admin() and created_by = (select auth.uid()));
create policy "Admin can edit spots" on public.tourist_spots
  for update to authenticated using (public.is_lakbay_admin())
  with check (public.is_lakbay_admin() and created_by = (select auth.uid()));
create policy "Admin can delete spots" on public.tourist_spots
  for delete to authenticated using (public.is_lakbay_admin());

drop policy if exists "Users can view nearby places" on public.nearby_places;
drop policy if exists "Admin can add nearby" on public.nearby_places;
drop policy if exists "Admin can edit nearby" on public.nearby_places;
drop policy if exists "Admin can delete nearby" on public.nearby_places;
create policy "Users can view nearby places" on public.nearby_places
  for select to authenticated using (true);
create policy "Admin can add nearby" on public.nearby_places
  for insert to authenticated with check (public.is_lakbay_admin());
create policy "Admin can edit nearby" on public.nearby_places
  for update to authenticated using (public.is_lakbay_admin()) with check (public.is_lakbay_admin());
create policy "Admin can delete nearby" on public.nearby_places
  for delete to authenticated using (public.is_lakbay_admin());

grant select, insert, update, delete on public.tourist_spots to authenticated;
grant select, insert, update, delete on public.nearby_places to authenticated;

-- Public tourism photos, but only admin may upload or delete them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tourist-images', 'tourist-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admin upload Lakbay photos" on storage.objects;
drop policy if exists "Admin read Lakbay photo metadata" on storage.objects;
drop policy if exists "Admin delete Lakbay photos" on storage.objects;
create policy "Admin upload Lakbay photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'tourist-images' and public.is_lakbay_admin());
create policy "Admin read Lakbay photo metadata" on storage.objects
  for select to authenticated using (bucket_id = 'tourist-images' and public.is_lakbay_admin());
create policy "Admin delete Lakbay photos" on storage.objects
  for delete to authenticated using (bucket_id = 'tourist-images' and public.is_lakbay_admin());

-- AFTER the intended admin signs up and verifies their email, promote by email:
-- UPDATE public.profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin@gmail.com');
-- The unique partial index prevents promoting a second account.
