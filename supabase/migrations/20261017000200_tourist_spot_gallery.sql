-- Copy this entire file into Supabase Dashboard > SQL Editor and click Run.
begin;

alter table public.tourist_spots
  add column if not exists image_urls text[] not null default '{}'
  constraint tourist_spots_gallery_valid check (
    cardinality(image_urls) <= 10 and array_position(image_urls, null) is null
  );

-- Keep existing cover photos in each destination's gallery.
update public.tourist_spots
set image_urls = array[image_url]
where cardinality(image_urls) = 0 and nullif(trim(image_url), '') is not null;

-- The gallery uses the existing tourist_spots admin write policies and
-- tourist-images bucket. Regular users can read but cannot change galleries.
notify pgrst, 'reload schema';
commit;
