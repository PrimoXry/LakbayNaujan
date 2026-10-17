# User dashboard

## Enable the account features

For the existing Supabase project, open **SQL Editor → New query**, paste all of
`supabase/migrations/20261014000200_user_dashboard.sql`, and run it as the project
owner. Then refresh the app. The migration is safe to rerun. No existing tourist
spots or user accounts are deleted.

For a fresh project, `supabase/schema.sql` already includes these changes.

This adds personal profile fields, the `saved_spots` table, and the private
`profile-avatars` storage bucket. Saving spots and profile changes requires this
database setup; the frontend alone cannot create these resources.

## If an error returns after setup

Running a migration successfully applies it once; frontend edits do not remove
database tables. Do not repeatedly rerun the dashboard migration based only on a
generic account error. A new database feature needs its own new migration, while
an already-applied migration is not normally required again.

In development, account schema errors now show the failing feature, the server's
message, and its error code. The browser console also prints a diagnostic prefixed
`[LakbayNaujan account]`, without credentials or request bodies. Use that exact
error to distinguish missing tables (`42P01`), missing columns (`42703`), and API
schema cache errors (`PGRST204` / `PGRST205`). Production keeps a general message.

Confirm the failing browser request uses the same Supabase project as the SQL
Editor and restart Vite if its environment configuration was changed. A public
zero-row probe can confirm table/column presence, but cannot verify a signed-in
user's session or RLS permissions. An anonymous permission error is expected on
private saved spots and does not establish a signed-in permission failure.

If the correct table/column exists in the same project but the API reports it
missing from its schema cache, the project owner can refresh that cache using:

```sql
notify pgrst, 'reload schema';
```

Then retry the request. Cache refresh does not create missing tables or columns.
See [PostgREST schema cache documentation](https://docs.postgrest.org/en/v14/references/schema_cache.html).

## Use the dashboard

- **Home** (`/tourists`): greeting, destination count, saved count, categories,
  and featured destinations from the actual tourist spot records.
- **Explore** (`/tourists?tab=explore`): search destinations and filter by category.
- **Saved** (`/tourists?tab=saved`): the signed-in user’s bookmarked destinations.
  Bookmark buttons work on cards and destination detail pages.
- **Profile** (`/tourists?tab=profile`): edit name and username, change password,
  upload a picture, switch dark mode, and log out.
- The top-right picture opens shortcuts to Profile, Saved spots, and Log out.
  Initials appear until a picture is uploaded or if the image cannot load.

Pictures accept JPEG, PNG, and WebP up to 2 MB. A preview appears before saving.
Passwords require the current password, at least eight characters, and matching
confirmation. Supabase’s configured password rules also apply. Google-only
accounts are directed to manage their password in their Google Account.
Dark mode is remembered on this browser/device; the first visit follows the
device’s appearance preference.

## Access rules and validation

Saved destinations and avatar files belong to each authenticated user. Avatar
URLs are signed and expire after one hour; reopening the dashboard renews them.
Profile updates allow only username, display name, and avatar path. Column
permissions prevent users from changing their role, ID, or creation timestamp.
Passwords go through Supabase Auth and are never stored in the profile table.

Run `npm.cmd run test:unit -- --run tests/unit`, `npm.cmd run lint`, and
`npm.cmd run build`. Browser tests use mocked Supabase responses, so they do not
write to the hosted database. With `npm.cmd run dev` running, use
`npm.cmd run test:e2e -- --spec tests/e2e/specs/dashboard.cy.ts`.
The existing `src/views/Tab1.vue` has a component-name lint error unrelated to
this dashboard; the changed dashboard files pass lint.

After applying the migration, verify with two regular test accounts that each
can edit its own profile and see only its own bookmarks and profile picture.
