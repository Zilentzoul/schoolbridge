-- =====================================================================
-- SchoolBridge — Seed data (run AFTER schema.sql, AFTER creating users)
-- =====================================================================
-- STEP 1 first: create your login accounts in Supabase
--   Authentication → Users → Add user (create these three, confirm email):
--     admin@school.edu.gh    (role admin)
--     teacher@school.edu.gh  (role teacher)
--     parent@school.edu.gh   (role parent)
--   Then in Table Editor → profiles, set each row's `role` accordingly
--   (or set role via user metadata {"role":"admin"} at creation).
--
-- STEP 2: replace the UUIDs below with the real profile IDs, then run this.
-- =====================================================================

-- --- Academic year + terms ---
insert into academic_years (id, name, is_current)
values ('11111111-1111-1111-1111-111111111111', '2025/2026', true);

insert into terms (year_id, name, starts_on, ends_on, is_current) values
('11111111-1111-1111-1111-111111111111', 'Term 1', '2025-09-09', '2025-12-19', false),
('11111111-1111-1111-1111-111111111111', 'Term 2', '2026-01-13', '2026-04-10', false),
('11111111-1111-1111-1111-111111111111', 'Term 3', '2026-05-05', '2026-08-01', true);

-- --- Class levels (Ghanaian) ---
insert into class_levels (id, name, stage) values
('22222222-0000-0000-0000-000000000006', 'Basic 6 - Blue', 'Primary'),
('22222222-0000-0000-0000-000000000003', 'Basic 3 - Sunbird', 'Primary');

-- --- Subjects (Ghana Basic curriculum core) ---
-- NOTE: set teacher_id to your real teacher profile UUID
insert into subjects (name, class_level_id) values
('Mathematics',           '22222222-0000-0000-0000-000000000006'),
('English Language',      '22222222-0000-0000-0000-000000000006'),
('Integrated Science',    '22222222-0000-0000-0000-000000000006'),
('Social Studies',        '22222222-0000-0000-0000-000000000006'),
('Computing (ICT)',       '22222222-0000-0000-0000-000000000006'),
('Ghanaian Language',     '22222222-0000-0000-0000-000000000006'),
('Religious & Moral Ed.', '22222222-0000-0000-0000-000000000006'),
('Creative Arts',         '22222222-0000-0000-0000-000000000006'),
('French',                '22222222-0000-0000-0000-000000000006');

-- --- Students (wards) ---
insert into students (id, full_name, avatar_initials, class_level_id, house) values
('33333333-0000-0000-0000-000000000001', 'Ama Mensah', 'AM', '22222222-0000-0000-0000-000000000006', 'Kente'),
('33333333-0000-0000-0000-000000000002', 'Kofi Mensah', 'KM', '22222222-0000-0000-0000-000000000003', 'Adinkra');

-- --- Link the demo parent to both wards ---
-- Replace <PARENT_UUID> with the real parent profile id:
-- insert into guardianships (parent_id, student_id) values
-- ('<PARENT_UUID>', '33333333-0000-0000-0000-000000000001'),
-- ('<PARENT_UUID>', '33333333-0000-0000-0000-000000000002');

-- --- Announcements ---
insert into announcements (title, body, tag, pinned) values
('Term 3 Sports Day — Friday', 'All parents welcome. Gates open 8:00 AM at the main field.', 'Event', true),
('Mid-term reports published', 'Digital report cards for all wards are now available under Grades.', 'Academic', false),
('Cafeteria menu update', 'New rotating menu takes effect next Monday. Allergen list attached.', 'General', false);

-- --- Calendar events ---
insert into events (title, event_date, time_label, type) values
('Parent–Teacher Conference', '2026-07-12', '2:00 – 4:30 PM', 'meeting'),
('Sports Day', '2026-07-18', '8:00 AM', 'event'),
('Science Fair — Project Due', '2026-07-22', 'All day', 'deadline'),
('End of Term Assembly', '2026-07-29', '10:00 AM', 'event');
