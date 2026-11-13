-- Run once in the Supabase SQL editor. Invite official accounts in Auth first,
-- then add their email addresses to official_media_uploaders.
create extension if not exists pgcrypto;

create table if not exists public.official_media_uploaders (
  email text primary key check (email = lower(email)),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.official_media_uploaders enable row level security;
drop policy if exists "Uploader can read own allowlist row" on public.official_media_uploaders;
create policy "Uploader can read own allowlist row" on public.official_media_uploaders
  for select to authenticated using (email = lower(auth.jwt()->>'email'));

create or replace function public.is_olh_media_uploader()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.official_media_uploaders
  where email = lower(auth.jwt()->>'email') and active
) $$;
revoke all on function public.is_olh_media_uploader() from public;
grant execute on function public.is_olh_media_uploader() to authenticated;

create table if not exists public.site_media (
  id uuid primary key default gen_random_uuid(),
  site_key text not null check (site_key ~ '^[12]-[A-Za-z0-9_-]+$'),
  media_type text not null check (media_type in ('image','video')),
  object_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 250),
  alt_text text not null default '' check (char_length(alt_text) <= 300),
  position integer not null default 0 check (position >= 0),
  uploader_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint site_media_path_matches_site check (split_part(object_path, '/', 1) = site_key)
);
create index if not exists site_media_site_position on public.site_media(site_key, position, created_at);
alter table public.site_media enable row level security;
drop policy if exists "Public can read published site media" on public.site_media;
drop policy if exists "Approved officials can upload site media" on public.site_media;
drop policy if exists "Approved officials can delete site media" on public.site_media;
create policy "Public can read published site media" on public.site_media
  for select to anon, authenticated using (true);
create policy "Approved officials can upload site media" on public.site_media
  for insert to authenticated with check (uploader_id = auth.uid() and public.is_olh_media_uploader());
create policy "Approved officials can delete site media" on public.site_media
  for delete to authenticated using (public.is_olh_media_uploader());
grant select on public.site_media to anon, authenticated;
grant insert, delete on public.site_media to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 94371840,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do update set public = true, file_size_limit = 94371840,
  allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Approved officials upload site media files" on storage.objects;
drop policy if exists "Approved officials delete site media files" on storage.objects;
create policy "Approved officials upload site media files" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'site-media' and public.is_olh_media_uploader()
    and (storage.foldername(name))[1] ~ '^[12]-[A-Za-z0-9_-]+$'
  );
create policy "Approved officials delete site media files" on storage.objects
  for delete to authenticated using (
    bucket_id = 'site-media' and public.is_olh_media_uploader()
  );
