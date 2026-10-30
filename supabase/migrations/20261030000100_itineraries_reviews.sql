-- Itinerary builder, completion tracking, and post-trip reviews.
begin;

alter table public.tourist_spots
  add column if not exists weather_suitability text[] not null default array['Sunny', 'Cloudy'];

create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Naujan adventure' check (char_length(trim(title)) between 1 and 120),
  status text not null default 'planning' check (status in ('planning', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists itineraries_user_updated_idx on public.itineraries(user_id, updated_at desc);

create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  spot_id uuid not null references public.tourist_spots(id) on delete cascade,
  position integer not null check (position >= 0),
  visited boolean not null default false,
  visited_at timestamptz,
  unique (itinerary_id, spot_id),
  unique (itinerary_id, position)
);
create index if not exists itinerary_items_itinerary_idx on public.itinerary_items(itinerary_id, position);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  itinerary_id uuid not null references public.itineraries(id) on delete cascade,
  tourist_spot_id uuid not null references public.tourist_spots(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, itinerary_id, tourist_spot_id)
);
create index if not exists reviews_spot_created_idx on public.reviews(tourist_spot_id, created_at desc);

create or replace function public.set_lakbay_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists itineraries_updated_at on public.itineraries;
create trigger itineraries_updated_at before update on public.itineraries for each row execute function public.set_lakbay_updated_at();
drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at before update on public.reviews for each row execute function public.set_lakbay_updated_at();

alter table public.itineraries enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.reviews enable row level security;
grant select, insert, update, delete on public.itineraries to authenticated;
grant select, insert, update, delete on public.itinerary_items to authenticated;
grant select, insert, update on public.reviews to authenticated;

drop policy if exists "Users manage own itineraries" on public.itineraries;
create policy "Users manage own itineraries" on public.itineraries for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users manage own itinerary items" on public.itinerary_items;
create policy "Users manage own itinerary items" on public.itinerary_items for all to authenticated
  using (exists (select 1 from public.itineraries i where i.id = itinerary_id and i.user_id = (select auth.uid())))
  with check (exists (select 1 from public.itineraries i where i.id = itinerary_id and i.user_id = (select auth.uid())));
drop policy if exists "Users read reviews" on public.reviews;
create policy "Users read reviews" on public.reviews for select to authenticated using (true);
drop policy if exists "Users submit reviews for visited items" on public.reviews;
create policy "Users submit reviews for visited items" on public.reviews for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.itinerary_items item where item.itinerary_id = itinerary_id
      and item.spot_id = tourist_spot_id and item.visited = true
  ));
drop policy if exists "Users edit own reviews" on public.reviews;
create policy "Users edit own reviews" on public.reviews for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

commit;
