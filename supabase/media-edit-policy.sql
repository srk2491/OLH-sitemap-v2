-- Run once in Supabase SQL Editor to enable editing media captions and replacing files.
-- Existing public-read and approved-uploader policies remain unchanged.
drop policy if exists "Approved officials can edit site media" on public.site_media;
create policy "Approved officials can edit site media" on public.site_media
  for update to authenticated
  using (public.is_olh_media_uploader())
  with check (public.is_olh_media_uploader());
grant update on public.site_media to authenticated;
