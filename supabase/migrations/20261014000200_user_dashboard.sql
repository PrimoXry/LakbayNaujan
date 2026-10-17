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
