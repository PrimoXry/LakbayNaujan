# Missing account profile

`Your account profile could not be found. Please contact support.` comes from
`src/lib/auth.ts` when the signed-in user's ID returns no visible `profiles` row.
It can mean the row is missing or a SELECT policy is hiding it. Authentication
and application profiles are separate records; a signup trigger only handles
accounts created after that trigger was installed.

## Repair an existing installation

1. Open the Supabase project used by this app's `VITE_SUPABASE_URL`.
2. In **SQL Editor**, run the entire contents of
   [`20261017000100_repair_missing_profiles.sql`](../supabase/migrations/20261017000100_repair_missing_profiles.sql)
   as project owner. The base `public.profiles` table must already exist; for a
   fresh project, run `supabase/schema.sql` first, then this repair if accounts
   were created before the schema.
3. Confirm the script succeeds, then log in again using the existing account.

The repair restores the signup trigger and the own-profile read policy, then
creates only missing profiles. Repaired profiles get role `user`. Valid, unused
metadata usernames are retained; invalid or conflicting ones get a generated
username. Existing profiles and their roles are preserved. The script is safe
to rerun. Apply it to the database; saving the SQL file locally does not run it.

An intended admin whose profile was missing needs the explicit email-based
promotion described in the README after the repair. User metadata cannot assign
admin access.

## Check the result

Run this in SQL Editor. It should return zero rows:

```sql
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
```

If the error persists with zero missing rows, verify that the browser uses the
same Supabase project and a valid signed-in session. Inspect the `/rest/v1/profiles`
request in browser DevTools. A successful empty response means the requested ID
has no visible row; a failed request requires checking its error message and
database policies. Additional restrictive policies may still block reads.

Do not delete and recreate the account or disable Row Level Security to bypass
this error. A local build cannot verify the deployed trigger or account rows.

Reference: [Supabase user management and profile triggers](https://supabase.com/docs/guides/auth/managing-user-data).
