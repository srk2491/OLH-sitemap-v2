-- Run once in the Supabase SQL editor to enable the private site logbook.
-- Create Auth users first, then add their email addresses to official_site_board_users.

create extension if not exists pgcrypto;

create table if not exists public.official_site_board_users (
  email text primary key check (email = lower(email)),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.official_site_board_users enable row level security;
drop policy if exists "Board users can read own allowlist row" on public.official_site_board_users;
create policy "Board users can read own allowlist row" on public.official_site_board_users
  for select to authenticated using (email = lower(auth.jwt()->>'email'));

create or replace function public.is_olh_site_board_user()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.official_site_board_users
  where email = lower(auth.jwt()->>'email') and active
) $$;
revoke all on function public.is_olh_site_board_user() from public;
grant execute on function public.is_olh_site_board_user() to authenticated;

create table if not exists public.site_logbook (
  id uuid primary key default gen_random_uuid(),
  site_key text not null check (site_key ~ '^[12]-[A-Za-z0-9_-]+$'),
  site_keys text[] not null default '{}',
  site_name text not null,
  home_type text not null check (home_type in ('1','2')),
  entry_type text not null default 'Review meeting'
    check (entry_type in ('Review meeting','Site visit','Coordination','Other')),
  title text not null check (char_length(title) between 1 and 180),
  meeting_date date not null default current_date,
  participants text not null default '' check (char_length(participants) <= 1000),
  discussion text not null default '' check (char_length(discussion) <= 12000),
  decisions text not null default '' check (char_length(decisions) <= 8000),
  action_items text not null default '' check (char_length(action_items) <= 8000),
  owner text not null default '' check (char_length(owner) <= 200),
  due_date date,
  status text not null default 'For review'
    check (status in ('Open','For review','In progress','Completed')),
  is_archived boolean not null default false,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade an earlier one-site logbook and retain each existing site's association.
alter table public.site_logbook
  add column if not exists site_keys text[] not null default '{}';
update public.site_logbook
  set site_keys = array[site_key]
  where cardinality(site_keys) = 0;

create index if not exists site_logbook_site_date
  on public.site_logbook(site_key, meeting_date desc);
create index if not exists site_logbook_site_keys
  on public.site_logbook using gin(site_keys);

alter table public.site_logbook enable row level security;
drop policy if exists "Approved board users can read logbook" on public.site_logbook;
drop policy if exists "Approved board users can create logbook entries" on public.site_logbook;
drop policy if exists "Approved board users can update logbook entries" on public.site_logbook;
create policy "Approved board users can read logbook" on public.site_logbook
  for select to authenticated using (public.is_olh_site_board_user());
create policy "Approved board users can create logbook entries" on public.site_logbook
  for insert to authenticated with check (
    public.is_olh_site_board_user() and created_by = auth.uid() and updated_by = auth.uid()
  );
create policy "Approved board users can update logbook entries" on public.site_logbook
  for update to authenticated using (public.is_olh_site_board_user())
  with check (public.is_olh_site_board_user() and updated_by = auth.uid());
grant select, insert, update on public.site_logbook to authenticated;

create or replace function public.set_site_logbook_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists site_logbook_updated_at on public.site_logbook;
create trigger site_logbook_updated_at before update on public.site_logbook
for each row execute function public.set_site_logbook_updated_at();

-- Separate, assignable follow-up actions for the site's Kanban board.
create table if not exists public.site_logbook_actions (
  id uuid primary key default gen_random_uuid(),
  site_key text not null check (site_key ~ '^[12]-[A-Za-z0-9_-]+$'),
  meeting_id uuid references public.site_logbook(id) on delete set null,
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '' check (char_length(description) <= 8000),
  owner text not null default '' check (char_length(owner) <= 200),
  due_date date,
  priority text not null default 'Normal' check (priority in ('Low','Normal','High')),
  status text not null default 'Open'
    check (status in ('Open','In progress','Awaiting response','Completed')),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_logbook_actions_site_status_due
  on public.site_logbook_actions(site_key, status, due_date);

alter table public.site_logbook_actions enable row level security;
drop policy if exists "Approved board users can read follow-up actions" on public.site_logbook_actions;
drop policy if exists "Approved board users can create follow-up actions" on public.site_logbook_actions;
drop policy if exists "Approved board users can update follow-up actions" on public.site_logbook_actions;
create policy "Approved board users can read follow-up actions" on public.site_logbook_actions
  for select to authenticated using (public.is_olh_site_board_user());
create policy "Approved board users can create follow-up actions" on public.site_logbook_actions
  for insert to authenticated with check (
    public.is_olh_site_board_user() and created_by = auth.uid() and updated_by = auth.uid()
  );
create policy "Approved board users can update follow-up actions" on public.site_logbook_actions
  for update to authenticated using (public.is_olh_site_board_user())
  with check (public.is_olh_site_board_user() and updated_by = auth.uid());
grant select, insert, update on public.site_logbook_actions to authenticated;

create or replace function public.set_site_logbook_action_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists site_logbook_action_updated_at on public.site_logbook_actions;
create trigger site_logbook_action_updated_at before update on public.site_logbook_actions
for each row execute function public.set_site_logbook_action_updated_at();


-- Append-only updates preserve the discussion trail across review meetings.
create table if not exists public.site_logbook_action_updates (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.site_logbook_actions(id) on delete cascade,
  site_key text not null check (site_key ~ '^[12]-[A-Za-z0-9_-]+$'),
  meeting_id uuid references public.site_logbook(id) on delete set null,
  note text not null check (char_length(note) between 1 and 8000),
  status text not null check (status in ('Open','In progress','Awaiting response','Completed')),
  owner text not null default '' check (char_length(owner) <= 200),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists site_logbook_action_updates_action_date on public.site_logbook_action_updates(action_id, created_at);
create index if not exists site_logbook_action_updates_site_date on public.site_logbook_action_updates(site_key, created_at desc);
alter table public.site_logbook_action_updates enable row level security;
drop policy if exists "Approved board users can read ticket history" on public.site_logbook_action_updates;
drop policy if exists "Approved board users can add ticket history" on public.site_logbook_action_updates;
create policy "Approved board users can read ticket history" on public.site_logbook_action_updates
  for select to authenticated using (public.is_olh_site_board_user());
create policy "Approved board users can add ticket history" on public.site_logbook_action_updates
  for insert to authenticated with check (public.is_olh_site_board_user() and created_by = auth.uid());
grant select, insert on public.site_logbook_action_updates to authenticated;
