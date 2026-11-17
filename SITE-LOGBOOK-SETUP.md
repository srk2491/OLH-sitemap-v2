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

A single meeting note can be linked to several sites. In the meeting form, select all sites discussed in **Sites discussed**; hold Ctrl on Windows or Command on Mac to select multiple. The same meeting note then appears in each selected site's logbook without being duplicated. Create one follow-up card per action to assign its owner, priority and due date, and optionally link it to the meeting. Move cards between Open, In progress, Awaiting response and Completed. Meeting notes remain in the Meeting notes Kanban and searchable Meeting log. Archive hides a note from the active views while retaining it in the database; turn on **Show archived** to view it again.

The board uses database row-level security. Do not disable the policies or place a Supabase service-role key in browser files. The only browser key is the existing publishable/anon key already used by the dashboard's media gallery.
