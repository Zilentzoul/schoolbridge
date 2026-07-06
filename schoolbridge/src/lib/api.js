import { supabase } from "./supabase";

// ---- Profile / session ----
export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

// ---- Wards (students) ----
export async function getMyWards() {
  // Parents: RLS returns only their wards. Staff/admin: returns all.
  const { data } = await supabase
    .from("students")
    .select("*, class_levels(name, stage)")
    .order("full_name");
  return data || [];
}

// ---- Grades ----
export async function getGrades(studentId, termId) {
  let q = supabase
    .from("grades")
    .select("*, subjects(name)")
    .eq("student_id", studentId);
  if (termId) q = q.eq("term_id", termId);
  const { data } = await q;
  return data || [];
}

export async function upsertGrade(row) {
  const total = (Number(row.class_score) || 0) + (Number(row.exam_score) || 0);
  const letter = total >= 80 ? "A" : total >= 70 ? "B" : total >= 60 ? "C" : total >= 50 ? "D" : "E";
  const { data, error } = await supabase
    .from("grades")
    .upsert({ ...row, total_score: total, letter_grade: letter }, { onConflict: "student_id,subject_id,term_id" })
    .select();
  return { data, error };
}

// ---- Attendance ----
export async function getAttendance(studentId) {
  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false });
  return data || [];
}

export async function markAttendance(row) {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from("attendance").upsert(
    { ...row, recorded_by: user?.id },
    { onConflict: "student_id,date" }
  ).select();
}

// ---- Assignments ----
export async function getAssignments(classLevelId) {
  let q = supabase.from("assignments").select("*, subjects(name)").order("due_date");
  if (classLevelId) q = q.eq("class_level_id", classLevelId);
  const { data } = await q;
  return data || [];
}

export async function createAssignment(row) {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from("assignments").insert({ ...row, created_by: user?.id }).select();
}

// ---- Messaging (school-mediated) ----
export async function getThreads() {
  const { data } = await supabase
    .from("threads")
    .select("*, students(full_name, avatar_initials), staff:staff_id(full_name, avatar_initials), parent:parent_id(full_name)")
    .order("last_message_at", { ascending: false });
  return data || [];
}

export async function getMessages(threadId) {
  const { data } = await supabase
    .from("messages")
    .select("*, profiles:sender_id(full_name)")
    .eq("thread_id", threadId)
    .order("created_at");
  return data || [];
}

export async function sendMessage(threadId, body, senderRole, attachmentUrl = null) {
  const { data: { user } } = await supabase.auth.getUser();
  const res = await supabase.from("messages").insert({
    thread_id: threadId,
    sender_id: user?.id,
    sender_role: senderRole,
    body,
    attachment_url: attachmentUrl,
  }).select();
  await supabase.from("threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);
  return res;
}

export async function createThread({ studentId, staffId, subjectLabel }) {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from("threads").insert({
    student_id: studentId,
    parent_id: user?.id,
    staff_id: staffId,
    subject_label: subjectLabel,
  }).select();
}

// ---- Announcements & events ----
export async function getAnnouncements() {
  const { data } = await supabase
    .from("announcements")
    .select("*, profiles:author_id(full_name)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  return data || [];
}

export async function createAnnouncement(row) {
  const { data: { user } } = await supabase.auth.getUser();
  return supabase.from("announcements").insert({ ...row, author_id: user?.id }).select();
}

export async function getEvents() {
  const { data } = await supabase.from("events").select("*").order("event_date");
  return data || [];
}

// ---- Terms ----
export async function getCurrentTerm() {
  const { data } = await supabase.from("terms").select("*").eq("is_current", true).single();
  return data;
}
