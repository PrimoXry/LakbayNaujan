-- Run in Supabase Dashboard > SQL Editor as project owner.
-- Repairs accounts created before the profile trigger was installed.
begin;

-- Restore profile creation for future email/password and OAuth signups.
-- Roles always come from the database, never from user-editable metadata.
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

-- A missing SELECT policy also looks like a missing profile to the client.
alter table public.profiles enable row level security;
grant select on public.profiles to authenticated;
drop policy if exists "View own profile" on public.profiles;
create policy "View own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

-- Preserve every existing profile, including admin roles and personal fields.
-- Old metadata can contain invalid or already-used usernames. Retry collisions
-- with a generated username instead of aborting the repair for all accounts.
do $$
declare
  account record;
  candidate text;
  attempt integer;
begin
  for account in
    select u.id, u.raw_user_meta_data, u.created_at
    from auth.users u
    where not exists (select 1 from public.profiles p where p.id = u.id)
    order by u.created_at, u.id
  loop
    candidate := trim(account.raw_user_meta_data ->> 'username');
    if candidate is null or candidate !~ '^[A-Za-z0-9_]{3,30}$' then
      candidate := 'user_' || left(replace(account.id::text, '-', ''), 25);
    end if;
    attempt := 0;
    loop
      insert into public.profiles (id, username, role, created_at)
      values (account.id, candidate, 'user', coalesce(account.created_at, now()))
      on conflict do nothing;
      exit when found or exists (select 1 from public.profiles p where p.id = account.id);
      attempt := attempt + 1;
      if attempt > 100 then
        raise exception 'Could not assign a unique username for account %', account.id;
      end if;
      candidate := 'user_' || left(md5(account.id::text || ':' || attempt::text), 25);
    end loop;
  end loop;
end;
$$;

commit;
