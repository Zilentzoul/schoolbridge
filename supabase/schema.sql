-- =====================================================================
-- SchoolBridge — Database schema (Supabase / Postgres)
-- Modeled on the Ghanaian educational structure:
--   - 3 terms per academic year
--   - Class levels: KG1–2, Basic 1–9 (Primary + JHS)
--   - Continuous assessment (class score) + exam score
--   - Roles: parent, teacher, admin
-- Run this in the Supabase SQL editor (Database → SQL Editor → New query).
-- =====================================================================

-- ---------- ENUMS ----------
create type user_role as enum ('parent', 'teacher', 'admin');
create type attendance_status as enum ('present', 'absent', 'late', 'excused');
create type assignment_status as enum ('assigned', 'submitted', 'graded', 'late');
create type message_sender as enum ('parent', 'teacher', 'admin');

-- ---------- PROFILES (one row per auth user) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'parent',
  phone text,
  avatar_initials text,
  created_at timestamptz default now()
);

-- ---------- ACADEMIC STRUCTURE ----------
create table academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,              -- e.g. "2025/2026"
  is_current boolean default false
);

create table terms (
  id uuid primary key default gen_random_uuid(),
  year_id uuid references academic_years(id) on delete cascade,
  name text not null,              -- "Term 1" | "Term 2" | "Term 3"
  starts_on date,
  ends_on date,
  is_current boolean default false
);

create table class_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,              -- "Basic 6 - Blue", "KG 2 - Sunbird"
  stage text not null              -- "KG" | "Primary" | "JHS"
);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,              -- "Mathematics", "Integrated Science"...
  teacher_id uuid references profiles(id) on delete set null,
  class_level_id uuid references class_levels(id) on delete cascade
);

-- ---------- STUDENTS (wards) ----------
create table students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  avatar_initials text,
  class_level_id uuid references class_levels(id) on delete set null,
  house text,                      -- "Kente", "Adinkra"...
  class_teacher_id uuid references profiles(id) on delete set null
);

-- links parents to their ward(s); a student can have >1 guardian
create table guardianships (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references profiles(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  relationship text default 'Parent',
  unique (parent_id, student_id)
);

-- ---------- GRADES (continuous assessment + exam) ----------
create table grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  term_id uuid references terms(id) on delete cascade,
  class_score numeric,             -- continuous assessment (out of 50)
  exam_score numeric,              -- exam (out of 50)
  total_score numeric,             -- computed, out of 100
  letter_grade text,               -- A, B, C...
  remark text,
  created_at timestamptz default now(),
  unique (student_id, subject_id, term_id)
);

-- ---------- ATTENDANCE ----------
create table attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  date date not null,
  status attendance_status not null default 'present',
  note text,
  recorded_by uuid references profiles(id) on delete set null,
  unique (student_id, date)
);

-- ---------- ASSIGNMENTS ----------
create table assignments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade,
  class_level_id uuid references class_levels(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status assignment_status default 'assigned',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------- MESSAGE THREADS (school-mediated, no phone numbers) ----------
create table threads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  parent_id uuid references profiles(id) on delete cascade,
  staff_id uuid references profiles(id) on delete set null,  -- teacher/admin
  subject_label text,              -- "Mathematics", "Front Office"...
  created_at timestamptz default now(),
  last_message_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references threads(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  sender_role message_sender not null,
  body text not null,
  attachment_url text,
  created_at timestamptz default now(),
  read_at timestamptz
);

-- ---------- ANNOUNCEMENTS (school broadcast) ----------
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  tag text default 'General',      -- "Event" | "Academic" | "General"
  pinned boolean default false,
  author_id uuid references profiles(id) on delete set null,
  class_level_id uuid references class_levels(id) on delete set null, -- null = whole school
  created_at timestamptz default now()
);

-- ---------- CALENDAR EVENTS ----------
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  time_label text,
  type text default 'event',       -- "meeting" | "event" | "deadline"
  class_level_id uuid references class_levels(id) on delete set null,
  created_by uuid references profiles(id) on delete set null
);

-- =====================================================================
-- HELPER: is the current user an admin?
-- =====================================================================
create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_staff()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('teacher','admin')
  );
$$;

-- returns the student ids the current parent guards
create or replace function my_student_ids()
returns setof uuid language sql security definer stable as $$
  select student_id from guardianships where parent_id = auth.uid();
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- Parents: only their own ward's data. Staff: their classes. Admin: all.
-- =====================================================================
alter table profiles        enable row level security;
alter table students        enable row level security;
alter table guardianships   enable row level security;
alter table grades          enable row level security;
alter table attendance      enable row level security;
alter table assignments     enable row level security;
alter table threads         enable row level security;
alter table messages        enable row level security;
alter table announcements   enable row level security;
alter table events          enable row level security;
alter table subjects        enable row level security;
alter table class_levels    enable row level security;
alter table terms           enable row level security;
alter table academic_years  enable row level security;

-- profiles: you can read your own; staff/admin can read all
create policy "read own profile" on profiles for select
  using (id = auth.uid() or is_staff());
create policy "update own profile" on profiles for update
  using (id = auth.uid());
create policy "admin manage profiles" on profiles for all
  using (is_admin());

-- students: parents see their wards; staff see all
create policy "parent reads own wards" on students for select
  using (id in (select my_student_ids()) or is_staff());
create policy "admin manages students" on students for all
  using (is_admin());

-- guardianships: parent sees own; admin manages
create policy "parent reads own links" on guardianships for select
  using (parent_id = auth.uid() or is_staff());
create policy "admin manages links" on guardianships for all
  using (is_admin());

-- grades: parent sees own ward's; staff read; teacher/admin write
create policy "parent reads ward grades" on grades for select
  using (student_id in (select my_student_ids()) or is_staff());
create policy "staff writes grades" on grades for all
  using (is_staff());

-- attendance
create policy "parent reads ward attendance" on attendance for select
  using (student_id in (select my_student_ids()) or is_staff());
create policy "staff writes attendance" on attendance for all
  using (is_staff());

-- assignments: readable by everyone signed in; staff writes
create policy "read assignments" on assignments for select using (true);
create policy "staff writes assignments" on assignments for all using (is_staff());

-- threads: parent sees own; staff see threads they're on or admin
create policy "parties read threads" on threads for select
  using (parent_id = auth.uid() or staff_id = auth.uid() or is_admin());
create policy "parent creates thread" on threads for insert
  with check (parent_id = auth.uid());
create policy "staff updates thread" on threads for update
  using (staff_id = auth.uid() or is_admin());

-- messages: visible to thread parties
create policy "read thread messages" on messages for select
  using (thread_id in (
    select id from threads
    where parent_id = auth.uid() or staff_id = auth.uid() or is_admin()
  ));
create policy "send message in own thread" on messages for insert
  with check (thread_id in (
    select id from threads
    where parent_id = auth.uid() or staff_id = auth.uid() or is_admin()
  ));

-- announcements / events / subjects / structure: read for all signed in, admin writes
create policy "read announcements" on announcements for select using (true);
create policy "staff writes announcements" on announcements for all using (is_staff());
create policy "read events" on events for select using (true);
create policy "staff writes events" on events for all using (is_staff());
create policy "read subjects" on subjects for select using (true);
create policy "admin writes subjects" on subjects for all using (is_admin());
create policy "read class_levels" on class_levels for select using (true);
create policy "admin writes class_levels" on class_levels for all using (is_admin());
create policy "read terms" on terms for select using (true);
create policy "admin writes terms" on terms for all using (is_admin());
create policy "read years" on academic_years for select using (true);
create policy "admin writes years" on academic_years for all using (is_admin());

-- =====================================================================
-- AUTO-CREATE a profile row when a new auth user signs up
-- =====================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'parent'),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name','U'),1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
