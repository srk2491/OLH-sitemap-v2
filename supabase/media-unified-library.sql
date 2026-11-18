-- Run once in Supabase SQL Editor before using the unified media library.
-- Keeps legacy GitHub files as a fallback while linking them to online library records.

alter table public.site_media
  add column if not exists legacy_src text;

create unique index if not exists site_media_legacy_src_unique
  on public.site_media(site_key, legacy_src)
  where legacy_src is not null;

create table if not exists public.site_media_overrides (
  site_key text not null check (site_key ~ '^[12]-[A-Za-z0-9_-]+$'),
  legacy_src text not null check (
    legacy_src like 'media/%'
    and position('..' in legacy_src) = 0
  ),
  caption text,
  alt_text text,
  is_hidden boolean not null default false,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (site_key, legacy_src)
);

alter table public.site_media_overrides enable row level security;
drop policy if exists "Public can read site media overrides" on public.site_media_overrides;
drop policy if exists "Approved officials can read site media overrides" on public.site_media_overrides;
drop policy if exists "Approved officials can create site media overrides" on public.site_media_overrides;
drop policy if exists "Approved officials can edit site media overrides" on public.site_media_overrides;

create policy "Public can read site media overrides" on public.site_media_overrides
  for select to anon, authenticated using (true);
create policy "Approved officials can create site media overrides" on public.site_media_overrides
  for insert to authenticated with check (
    public.is_olh_media_uploader() and updated_by = auth.uid()
  );
create policy "Approved officials can edit site media overrides" on public.site_media_overrides
  for update to authenticated using (public.is_olh_media_uploader())
  with check (public.is_olh_media_uploader() and updated_by = auth.uid());

grant select on public.site_media_overrides to anon, authenticated;
grant insert, update on public.site_media_overrides to authenticated;

create or replace function public.set_site_media_override_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists site_media_override_updated_at on public.site_media_overrides;
create trigger site_media_override_updated_at before update on public.site_media_overrides
for each row execute function public.set_site_media_override_updated_at();
