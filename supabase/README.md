# Supabase access setup

1. Apply `migrations/20261125154500_staff_and_customer_rls.sql` to the Supabase
   project before using the app. It enables row-level security and gives each
   customer access only to parcels they register. Staff can access operational
   records only when their verified JWT has `app_metadata.role = "staff"`.
2. Enable email sign-in in Supabase Authentication. For a hosted test project
   without an email provider, you can turn off email confirmations so new users
   can sign in immediately. For production, keep confirmations enabled and
   configure custom SMTP delivery in Supabase.
3. Create or verify staff users in Supabase Authentication, then assign their
   role from the Supabase SQL Editor (replace the placeholder with the
   account's email address):

   ```sql
   update auth.users
   set raw_app_meta_data =
     coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"staff"}'::jsonb
   where email = lower('<STAFF_EMAIL>');
   ```

   Staff must sign out and sign in again after their role is assigned so their
   JWT includes the updated app metadata. Never assign roles through user
   metadata that the client can edit.
4. Existing parcels have no `owner_id` until they are explicitly associated
   with a customer. They remain unavailable to customer accounts and are
   visible only to staff; verify ownership before backfilling any records.

Existing phone-only accounts cannot sign in with email and a password until
they have an email/password identity. Creating a new account creates a new
user ID, so it will not automatically gain access to parcels owned by the
previous account.
