# Private site logbook setup

The site board is a private meeting and follow-up workspace. The page shell is hosted with the dashboard, but the notes are only returned to authenticated users explicitly approved for the site board. Photo-upload approval does not automatically grant logbook access.

## One-time Supabase setup

1. Open the Supabase project already used by the media upload page.
2. Open **SQL Editor**, create a new query, paste the complete contents of `supabase/site-logbook-schema.sql`, and run it.
3. In **Authentication → Users**, invite each official who should use the board. The official must have an account before the access-list entry is added.
4. In **SQL Editor**, approve each user by their actual email address:

   ```sql
   insert into public.official_site_board_users (email)
   values (lower('official@example.gov.in'))
   on conflict (email) do update set active = true;
   ```

5. Open `https://olh-sitemap-preview.pages.dev/site-board.html`, sign in with the invited account, select 1 BHK or 2 BHK and a site, then create a test note.

To revoke a user's access:

```sql
update public.official_site_board_users
set active = false
where email = lower('official@example.gov.in');
```

## Using the board

Each note is linked to one selected site and includes meeting/site-visit date, participants, discussion, decisions, follow-up actions, owner, due date and status. Use the Kanban view to move cards between Open, For review, In progress and Completed. Use Logbook to review entries chronologically. Archive hides an entry from the active board while retaining it in the database; turn on **Show archived** to view it again.

The board uses database row-level security. Do not disable the policies or place a Supabase service-role key in browser files. The only browser key is the existing publishable/anon key already used by the dashboard's media gallery.
