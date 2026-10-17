-- Existing projects: run in Supabase Dashboard > SQL Editor as project owner.
-- Requires the tables, helper function, and policy from supabase/schema.sql.
-- The previous WITH CHECK rejected edits when the original creator was not
-- the current admin. Admins should be able to manage every destination.
-- This changes only the update policy; it does not change rows or user roles.

begin;

alter policy "Admin can edit spots" on public.tourist_spots
  to authenticated
  using (public.is_lakbay_admin())
  with check (public.is_lakbay_admin());

commit;
