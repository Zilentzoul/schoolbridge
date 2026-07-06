-- =====================================================================
-- SchoolBridge — Add-on: white-label settings + admin management support
-- Run this in Supabase → SQL Editor AFTER the main schema.sql.
-- Safe to run once. It adds a settings table and helpful policies.
-- =====================================================================

-- ---------- SCHOOL SETTINGS (single row of branding/config) ----------
create table if not exists school_settings (
  id int primary key default 1,
  school_name text not null default 'Your School',
  tagline text default 'Parent Portal',
  logo_url text,                       -- optional image URL for the logo
  primary_color text default '#12233B',-- deep navy by default
  accent_color text default '#C69A3C', -- gold by default
  currency_symbol text default '₵',
  staff_platform_url text,             -- link to your existing Google-Sheets staff app
  staff_platform_label text default 'Staff Tools',
  contact_email text,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- Seed the one row if it isn't there yet.
insert into school_settings (id, school_name, tagline)
values (1, 'Faith Kids Academy of Excellence', 'Parent Portal')
on conflict (id) do nothing;

alter table school_settings enable row level security;

-- Everyone signed in can READ settings (the app needs them to render).
drop policy if exists "anyone reads settings" on school_settings;
create policy "anyone reads settings" on school_settings for select using (true);

-- Only admins can CHANGE settings.
drop policy if exists "admin updates settings" on school_settings;
create policy "admin updates settings" on school_settings for update using (is_admin());
drop policy if exists "admin inserts settings" on school_settings;
create policy "admin inserts settings" on school_settings for insert with check (is_admin());

-- ---------- Make sure admins can fully manage core records ----------
-- (These mirror policies already in schema.sql; "if not exists" keeps it safe.)
drop policy if exists "admin manages subjects extra" on subjects;
create policy "admin manages subjects extra" on subjects for all using (is_admin());

drop policy if exists "admin manages class_levels extra" on class_levels;
create policy "admin manages class_levels extra" on class_levels for all using (is_admin());

-- Allow admins to read every profile (needed to link parents to students).
drop policy if exists "admin reads all profiles" on profiles;
create policy "admin reads all profiles" on profiles for select using (is_admin() or id = auth.uid() or is_staff());
