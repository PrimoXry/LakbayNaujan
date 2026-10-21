# Multiple destination photos

## One-time Supabase setup

1. In VS Code, open
   [`20261017000200_tourist_spot_gallery.sql`](../supabase/migrations/20261017000200_tourist_spot_gallery.sql).
2. Press **Ctrl+A**, then **Ctrl+C** to copy its entire contents.
3. Open the app's Supabase project in your browser, then **SQL Editor > New query**.
4. Paste with **Ctrl+V**, click **Run**, and wait for success.
5. Refresh the app and log in as admin.

This migration must be run against the database; saving the file locally does
not apply it. It adds `tourist_spots.image_urls` and copies existing cover photos
into their galleries. It can be rerun without duplicating photos. New projects
get the gallery column from `supabase/schema.sql`.

## Add pictures

1. Open a destination in Admin using **Edit**, or create a new destination.
2. Under **Tourist photos**, select several pictures. You can select more again
   to append them. The limit is 10 pictures, each up to 5 MB (JPEG, PNG or WebP).
3. Use the arrows to arrange them or **Remove** to remove one from the gallery.
   The first picture becomes the cover photo.
4. Click **Save changes** or **Publish tourist spot**.

The files upload to the existing Supabase `tourist-images` Storage bucket. Their
ordered URLs are saved in `public.tourist_spots.image_urls`; the first URL is also
saved in `image_url` for compatibility. List and detail pages fetch these fields
from the database, then load the actual images from Storage. No sample photos
are hardcoded. An older destination with only `image_url` still shows its photo.

Visitors can swipe horizontally, click the arrows or dots, or focus the gallery
and use the left/right keyboard arrows. A single picture has no slider controls;
empty galleries show a placeholder. There is no automatic slide timer.

Only admin can upload photos and edit destination records, using the existing
Storage and database policies. Removing a gallery entry does not delete the
underlying Storage object. Failed saves retain the draft and remember completed
uploads for retry; abandoned drafts can leave unused objects in Storage. Do not
delete uploads automatically after an ambiguous network/save error.

## Verify after setup

Save two different pictures on a test destination, reload, and check both its
card and detail page. Check the second picture using Next and a touch swipe.
Edit again to reorder/remove a picture and verify the result after reloading.
The live database setup and Storage permissions must be verified in Supabase.
