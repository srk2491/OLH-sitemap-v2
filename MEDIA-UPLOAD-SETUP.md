# Online site photo and video uploads

v1.15 adds an authenticated upload page at `/media-admin.html`. An approved official chooses a 1 BHK or 2 BHK site, uploads JPG/PNG/WebP or MP4/WebM, and the public map reads that site's gallery from the online media service. An open map refreshes galleries when it regains focus and every two minutes. Existing `data/media.json` galleries continue to work as a fallback.

The upload page is visible to the public, but only accounts explicitly added to the uploader allowlist can upload or remove media. It uses a public/anonymous client key; never put a service-role key in this project. Database and Storage row-level security in `supabase/media-schema.sql` enforce the write restriction.

## One-time setup

1. Create a Supabase project. In **SQL Editor**, run `supabase/media-schema.sql`.
2. In **Authentication → URL Configuration**, set **Site URL** to `https://olh-sitemap-preview.pages.dev/media-admin.html`. Add `https://olh-sitemap-preview.pages.dev/**` to **Redirect URLs**. This directs invite links to the password setup page instead of the default `localhost:3000`.
3. In the project settings, copy the **Project URL** and **anon/public key** into `media-config.js`:

   ```js
   window.OLH_MEDIA_CONFIG = {
     url: 'https://YOUR-PROJECT.supabase.co',
     anonKey: 'YOUR-ANON-PUBLIC-KEY',
     bucket: 'site-media'
   };
   ```

   This public key is designed for browser use. Keep database policies enabled, and never use the `service_role` key here.
4. Deploy the project files to Cloudflare Pages. Follow `HOST-DEMO-CLOUDFLARE.md`; rebuild with `py build_public.py` after changing `media-config.js`.
5. In **Authentication → Users**, invite each official who may upload. Disable public sign-ups in **Authentication → Providers → Email**. The official opens the fresh invite link at `/media-admin.html` and sets a password there.
6. In SQL Editor, approve each invited account by email, using the real email address:

   ```sql
   insert into public.official_media_uploaders (email)
   values (lower('official@example.gov.in'))
   on conflict (email) do update set active = true;
   ```

   To revoke upload rights later, run `update public.official_media_uploaders set active = false where email = lower('official@example.gov.in');`.
7. Open `https://olh-sitemap-preview.pages.dev/media-admin.html`, sign in with the allowlisted official account, select a site and upload a test photo. Open that site in the explorer to verify the gallery. Remove the test item from the upload page when done.

## Notes

- The configured Storage bucket allows JPG, PNG, WebP, MP4 and WebM. The app accepts images up to 20 MB and videos up to 90 MB. Supabase account/project storage limits also apply; lower the app limit or raise the project limit if its plan requires it.
- Published media is public because the housing explorer is public. Do not upload beneficiary records, faces without permission, or private documents.
- A successful upload becomes visible after the next map refresh (up to two minutes in an already-open tab). Reloading the page also fetches the latest gallery.
- Uploads are separate from the scraper. No scraper run or GitHub commit is needed for media after this setup.
- If Supabase is not configured, the upload page stays disabled and the map continues using its committed `data/media.json` galleries. The existing offline media manager remains available for ZIP-based publishing.
