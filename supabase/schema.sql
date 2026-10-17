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
  requested_username := trim(new.raw_user_meta_data ->> 'username');
  if requested_username is null or requested_username !~ '^[A-Za-z0-9_]{3,30}$' then
    requested_username := 'user_' || left(replace(new.id::text, '-', ''), 25);
  end if;
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
-- Profile editing is restricted to personal fields by the grants below.
-- Only the trigger and privileged SQL administrator can create or change a role.

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
  image_urls text[] not null default '{}' constraint tourist_spots_gallery_valid
    check (cardinality(image_urls) <= 10 and array_position(image_urls, null) is null),
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
-- Admins manage every destination, including ones created by a previous admin.
-- Only inserts require created_by to match the current admin.
create policy "Admin can edit spots" on public.tourist_spots
  for update to authenticated using (public.is_lakbay_admin())
  with check (public.is_lakbay_admin());
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

-- User dashboard: personal profile fields, private avatars, and saved spots.
-- Run in Supabase SQL Editor as project owner for existing installations.
begin;

alter table public.profiles
  add column if not exists display_name text check (char_length(display_name) between 1 and 80),
  add column if not exists avatar_path text check (avatar_path like id::text || '/%' and char_length(avatar_path) <= 512);

-- Row ownership alone must not allow a user to change their role or identity.
revoke insert, update, delete on public.profiles from public, anon, authenticated;
revoke update (id, role, created_at) on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, display_name, avatar_path) on public.profiles to authenticated;
drop policy if exists "Edit own personal profile" on public.profiles;
create policy "Edit own personal profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create table if not exists public.saved_spots (
  user_id uuid not null references auth.users(id) on delete cascade,
  spot_id uuid not null references public.tourist_spots(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);
create index if not exists saved_spots_spot_idx on public.saved_spots (spot_id);
alter table public.saved_spots enable row level security;
revoke all on public.saved_spots from public, anon, authenticated;
grant select, insert, delete on public.saved_spots to authenticated;
drop policy if exists "View own saved spots" on public.saved_spots;
drop policy if exists "Save own spots" on public.saved_spots;
drop policy if exists "Remove own saved spots" on public.saved_spots;
create policy "View own saved spots" on public.saved_spots
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Save own spots" on public.saved_spots
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Remove own saved spots" on public.saved_spots
  for delete to authenticated using (user_id = (select auth.uid()));

-- Private avatar files. Each user can access only their own UUID folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 2097152,
  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Read own avatar" on storage.objects;
drop policy if exists "Upload own avatar" on storage.objects;
drop policy if exists "Delete own avatar" on storage.objects;
create policy "Read own avatar" on storage.objects for select to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

commit;
