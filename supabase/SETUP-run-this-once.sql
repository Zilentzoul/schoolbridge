-- =====================================================================
-- SchoolBridge — ONE-PASTE SETUP (run this whole block once)
-- Supabase → SQL Editor → New query → paste all → Run.
-- Safe to run even if you've run parts before: everything uses
-- "if not exists" / "on conflict do nothing", so nothing is duplicated
-- and no existing data is changed.
-- =====================================================================

-- 1) Settings table (branding + links). Created only if missing.
create table if not exists school_settings (
  id int primary key default 1,
  school_name text not null default 'Your School',
  tagline text default 'Parent Portal',
  logo_url text,
  primary_color text default '#12233B',
  accent_color text default '#C69A3C',
  currency_symbol text default '₵',
  staff_platform_url text,
  staff_platform_label text default 'Staff Tools',
  contact_email text,
  registry_api_url text,
  registry_admin_key text,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- 2) In case the table already existed WITHOUT the newer columns, add them.
alter table school_settings add column if not exists registry_api_url text;
alter table school_settings add column if not exists registry_admin_key text;
alter table school_settings add column if not exists staff_platform_url text;
alter table school_settings add column if not exists staff_platform_label text default 'Staff Tools';
alter table school_settings add column if not exists logo_url text;
alter table school_settings add column if not exists contact_email text;

-- 3) Seed the single row (only if it isn't there yet).
insert into school_settings (id, school_name, tagline, staff_platform_url, staff_platform_label)
values (1, 'Faith Kids Academy of Excellence', 'Parent Portal', 'https://fka-staff.netlify.app', 'Staff Portal')
on conflict (id) do nothing;

-- 4) Pre-fill the staff link if it's currently empty (your own edits always win).
update school_settings
  set staff_platform_url = 'https://fka-staff.netlify.app',
      staff_platform_label = coalesce(staff_platform_label, 'Staff Portal')
  where id = 1 and (staff_platform_url is null or staff_platform_url = '');

-- 5) Security: everyone signed in can READ settings; only admins can change them.
alter table school_settings enable row level security;

drop policy if exists "anyone reads settings" on school_settings;
create policy "anyone reads settings" on school_settings for select using (true);

drop policy if exists "admin updates settings" on school_settings;
create policy "admin updates settings" on school_settings for update using (is_admin());

drop policy if exists "admin inserts settings" on school_settings;
create policy "admin inserts settings" on school_settings for insert with check (is_admin());

-- 6) Make sure admins can manage core records + read profiles (for linking parents).
drop policy if exists "admin manages subjects extra" on subjects;
create policy "admin manages subjects extra" on subjects for all using (is_admin());

drop policy if exists "admin manages class_levels extra" on class_levels;
create policy "admin manages class_levels extra" on class_levels for all using (is_admin());

drop policy if exists "admin reads all profiles" on profiles;
create policy "admin reads all profiles" on profiles for select using (is_admin() or id = auth.uid() or is_staff());

-- Done. You should see "Success. No rows returned".
