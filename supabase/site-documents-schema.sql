-- Run once in Supabase SQL Editor to enable official public project documents.
-- PDFs are uploaded by approved officials and are public immediately after upload.
-- Confirm each file is approved for public release before uploading it.

create table if not exists public.site_documents (
  id uuid primary key default gen_random_uuid(),
  site_key text not null check (site_key ~ '^[12]-[A-Za-z0-9_-]+$'),
  document_type text not null check (document_type in (
    'RERA registration',
    'Approved layout plan',
    'Building plan approval',
    'Commencement certificate',
    'Completion / occupancy certificate',
    'Other official project document'
  )),
  title text not null check (char_length(title) between 1 and 200),
  issuing_authority text not null check (char_length(issuing_authority) between 1 and 200),
  document_date date,
  object_path text not null unique,
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  file_size integer not null check (file_size between 1 and 26214400),
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  uploader_id uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_documents_path_matches_site check (
    split_part(object_path, '/', 1) = site_key
    and split_part(object_path, '/', 2) = 'documents'
    and object_path like '%.pdf'
  )
);

create index if not exists site_documents_site_date
  on public.site_documents(site_key, document_date desc, created_at desc);

alter table public.site_documents enable row level security;
drop policy if exists "Public can read project documents" on public.site_documents;
drop policy if exists "Approved officials can upload project documents" on public.site_documents;
drop policy if exists "Approved officials can edit project document details" on public.site_documents;
drop policy if exists "Approved officials can delete project documents" on public.site_documents;

create policy "Public can read project documents" on public.site_documents
  for select to anon, authenticated using (true);
create policy "Approved officials can upload project documents" on public.site_documents
  for insert to authenticated with check (
    public.is_olh_media_uploader() and uploader_id = auth.uid()
  );
create policy "Approved officials can edit project document details" on public.site_documents
  for update to authenticated using (public.is_olh_media_uploader())
  with check (public.is_olh_media_uploader() and updated_by = auth.uid());
create policy "Approved officials can delete project documents" on public.site_documents
  for delete to authenticated using (public.is_olh_media_uploader());

grant select on public.site_documents to anon, authenticated;
grant insert, update, delete on public.site_documents to authenticated;

-- The existing site-media bucket remains public for dashboard photos/videos.
-- Add PDF support while retaining all existing media types.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 94371840,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm','application/pdf'])
on conflict (id) do update
  set public = true,
      file_size_limit = 94371840,
      allowed_mime_types = excluded.allowed_mime_types;
