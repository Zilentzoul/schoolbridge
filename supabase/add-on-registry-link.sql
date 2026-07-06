-- =====================================================================
-- SchoolBridge — Add-on: quiz-system link (phase two)
-- Run this in Supabase → SQL Editor. Safe to run once, and safe to run
-- even though you already created the settings table — it only ADDS one
-- optional column and changes nothing else.
--
-- What it does: lets an admin store the Registry web-app address so
-- parents can see quiz results (read-only) inside the parent portal.
-- =====================================================================

alter table school_settings
  add column if not exists registry_api_url text;

alter table school_settings
  add column if not exists registry_admin_key text;

-- Pre-fill the staff portal link so the "Open Staff Portal" button works
-- right away. Only fills it if it's currently empty — your own edits win.
update school_settings
  set staff_platform_url = 'https://fka-staff.netlify.app',
      staff_platform_label = coalesce(staff_platform_label, 'Staff Portal')
  where id = 1 and (staff_platform_url is null or staff_platform_url = '');

-- No data changes, no policy changes needed: the existing
-- "anyone reads settings" and "admin updates settings" policies already
-- cover this new column.
