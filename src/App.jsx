import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard, MessageSquare, GraduationCap, CalendarDays, CreditCard,
  ClipboardList, Bell, Search, Send, Paperclip, TrendingUp, TrendingDown,
  CheckCircle2, Clock, AlertCircle, ChevronRight, Users, BookOpen, Award,
  Phone, Video, Shield, Menu, X, Plus, Download, Filter, Star, MoreVertical,
  ArrowUpRight, Circle, FileText, DollarSign, Megaphone, UserCheck
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, Cell
} from "recharts";
import { LogOut, Loader2 } from "lucide-react";
import { Building2, UserPlus, Link2, PenSquare, ExternalLink, Settings as SettingsIcon, Database } from "lucide-react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { SettingsProvider, useSettings } from "./lib/SettingsProvider";
import { getQuizResults, getAttendanceForStudent } from "./lib/registry";
import { downloadRecord } from "./lib/recordExport";
import { SchoolSettings, ManageStudents, LinkParents, ClassesSubjects, EnterGrades, RegistryManager } from "./AdminPages";
import Login from "./auth/Login";
import { hasSupabaseConfig } from "./lib/supabase";
import * as API from "./lib/api";

/* =========================================================================
   SchoolBridge — a parent–school platform where all ward communication,
   performance tracking, payments, attendance and announcements flow through
   ONE system. No personal teacher phone numbers. Every message is logged,
   routed and moderated by the school.

   Design language: "Institutional Warmth" — deep ink navy + a scholarly gold,
   generous whitespace, a serif display face paired with a clean grotesque.
   ========================================================================= */

// ---------- Design tokens ----------
const C = {
  ink: "#12233B",        // deep navy — primary
  inkSoft: "#243B57",
  paper: "#FBFAF6",      // warm off-white canvas
  card: "#FFFFFF",
  gold: "#C69A3C",       // scholarly gold accent
  goldSoft: "#EFE3C4",
  sage: "#4C7A6A",       // positive
  clay: "#B4553D",       // attention/negative
  sky: "#3E6B9C",        // info
  line: "#E7E3D8",
  mut: "#6B7789",
  mutLight: "#9AA4B2",
};

const font = {
  display: "'Fraunces', 'Georgia', serif",
  body: "'Inter', system-ui, sans-serif",
};

// ---------- Mock data ----------
const WARDS = [
  { id: "w1", name: "Ama Mensah", grade: "Grade 6 — Blue", avatar: "AM", teacher: "Mrs. Adjoa Boateng", house: "Kente" },
  { id: "w2", name: "Kofi Mensah", grade: "Grade 3 — Sunbird", avatar: "KM", teacher: "Mr. Daniel Osei", house: "Adinkra" },
];

const GRADE_TREND = [
  { term: "T1 W1", Ama: 72, Kofi: 68 },
  { term: "T1 W4", Ama: 78, Kofi: 71 },
  { term: "T1 W8", Ama: 81, Kofi: 74 },
  { term: "T2 W2", Ama: 79, Kofi: 79 },
  { term: "T2 W6", Ama: 85, Kofi: 82 },
  { term: "T2 W10", Ama: 88, Kofi: 80 },
  { term: "T3 W3", Ama: 91, Kofi: 84 },
];

const SUBJECTS = [
  { subject: "Mathematics", score: 91, grade: "A", trend: 5, teacher: "Mrs. Adjoa Boateng" },
  { subject: "English", score: 86, grade: "A", trend: 2, teacher: "Ms. Efua Sarpong" },
  { subject: "Science", score: 88, grade: "A", trend: 4, teacher: "Mr. Kwame Antwi" },
  { subject: "Social Studies", score: 79, grade: "B", trend: -3, teacher: "Mrs. Adjoa Boateng" },
  { subject: "ICT", score: 94, grade: "A", trend: 6, teacher: "Mr. Yaw Darko" },
  { subject: "French", score: 73, grade: "B", trend: -1, teacher: "Mme. Aïcha Diallo" },
];

const RADAR = [
  { skill: "Numeracy", value: 91 },
  { skill: "Literacy", value: 86 },
  { skill: "Inquiry", value: 88 },
  { skill: "Collaboration", value: 82 },
  { skill: "Conduct", value: 95 },
  { skill: "Attendance", value: 97 },
];

const THREADS = [
  {
    id: "t1", subject: "Mathematics", teacher: "Mrs. Adjoa Boateng", role: "Class Teacher",
    initials: "AB", unread: 2, tag: "Academic", pinned: true,
    last: "Ama's problem-solving has jumped this term. I've attached the fractions worksheet…",
    time: "9:14 AM",
    messages: [
      { from: "them", name: "Mrs. Adjoa Boateng", text: "Good morning. I wanted to share that Ama scored 91% on the fractions assessment — a real leap from last month. Well done to her.", time: "9:02 AM" },
      { from: "them", name: "Mrs. Adjoa Boateng", text: "I've attached the worksheet she should complete over the weekend for enrichment.", time: "9:14 AM", attach: "Fractions_Enrichment.pdf" },
    ],
  },
  {
    id: "t2", subject: "French", teacher: "Mme. Aïcha Diallo", role: "Subject Teacher",
    initials: "AD", unread: 0, tag: "Academic", pinned: false,
    last: "Please encourage 15 min of vocabulary practice at home this week.",
    time: "Yesterday",
    messages: [
      { from: "them", name: "Mme. Aïcha Diallo", text: "Bonjour. Ama is doing well but her vocabulary retention could improve. Could you support 15 minutes of practice at home this week?", time: "Yesterday, 3:40 PM" },
      { from: "me", name: "You", text: "Of course — we'll set aside time each evening. Any resources you'd recommend?", time: "Yesterday, 6:12 PM" },
    ],
  },
  {
    id: "t3", subject: "Front Office", teacher: "Admissions & Records", role: "Administration",
    initials: "FO", unread: 1, tag: "Admin", pinned: false,
    last: "Your term 3 statement is now available for download.",
    time: "Mon",
    messages: [
      { from: "them", name: "Front Office", text: "Your Term 3 fee statement is ready. You can review and pay directly under the Payments tab.", time: "Mon, 11:20 AM" },
    ],
  },
];

const ANNOUNCEMENTS = [
  { id: "a1", title: "Term 3 Sports Day — Friday", body: "All parents welcome. Gates open 8:00 AM at the main field. Ama is running in the 200m.", tag: "Event", time: "2h ago", author: "Head of School", pin: true },
  { id: "a2", title: "Mid-term reports published", body: "Digital report cards for all wards are now available under Grades.", tag: "Academic", time: "1d ago", author: "Academic Office", pin: false },
  { id: "a3", title: "Cafeteria menu update", body: "New rotating menu takes effect next Monday. Allergen list attached.", tag: "General", time: "3d ago", author: "Operations", pin: false },
];

const EVENTS = [
  { id: "e1", date: "12", month: "JUL", title: "Parent–Teacher Conference", time: "2:00 – 4:30 PM", type: "meeting", ward: "Ama" },
  { id: "e2", date: "18", month: "JUL", title: "Sports Day", time: "8:00 AM", type: "event", ward: "Both" },
  { id: "e3", date: "22", month: "JUL", title: "Science Fair — Project Due", time: "All day", type: "deadline", ward: "Kofi" },
  { id: "e4", date: "29", month: "JUL", title: "End of Term Assembly", time: "10:00 AM", type: "event", ward: "Both" },
];

const ASSIGNMENTS = [
  { id: "as1", subject: "Mathematics", title: "Fractions Enrichment Set", due: "Due Sat", status: "assigned", ward: "Ama" },
  { id: "as2", subject: "Science", title: "Ecosystem Poster", due: "Submitted", status: "done", ward: "Ama" },
  { id: "as3", subject: "English", title: "Book Review — Chapter 4", due: "Overdue 1d", status: "late", ward: "Kofi" },
  { id: "as4", subject: "ICT", title: "Scratch Animation", due: "Graded 94%", status: "graded", ward: "Ama" },
];

const FEES = [
  { id: "f1", label: "Term 3 Tuition", amount: 2400, status: "due", due: "Jul 15" },
  { id: "f2", label: "Sports & Activities Levy", amount: 180, status: "due", due: "Jul 15" },
  { id: "f3", label: "Term 2 Tuition", amount: 2400, status: "paid", due: "Paid Apr 3" },
  { id: "f4", label: "Bus Service — Term 3", amount: 320, status: "due", due: "Jul 20" },
];

const ATTENDANCE = [
  { m: "Feb", present: 20, absent: 0, late: 1 },
  { m: "Mar", present: 21, absent: 1, late: 0 },
  { m: "Apr", present: 18, absent: 2, late: 1 },
  { m: "May", present: 22, absent: 0, late: 0 },
  { m: "Jun", present: 19, absent: 1, late: 2 },
];

// ---------- Small UI helpers ----------
const Chip = ({ children, tone = "gold" }) => {
  const tones = {
    gold: { bg: C.goldSoft, fg: "#8A6A1F" },
    sage: { bg: "#E1EFE8", fg: C.sage },
    clay: { bg: "#F3E0DA", fg: C.clay },
    sky: { bg: "#E1EAF4", fg: C.sky },
    mut: { bg: "#EEF0F3", fg: C.mut },
  }[tone];
  return (
    <span style={{
      background: tones.bg, color: tones.fg, fontSize: 11, fontWeight: 600,
      padding: "3px 9px", borderRadius: 20, letterSpacing: 0.2, whiteSpace: "nowrap",
    }}>{children}</span>
  );
};

const Card = ({ children, style, pad = 20, className }) => (
  <div className={className} style={{
    background: C.card, border: `1px solid ${C.line}`, borderRadius: 16,
    padding: pad, boxShadow: "0 1px 2px rgba(18,35,59,0.04)", ...style,
  }}>{children}</div>
);

const SectionTitle = ({ children, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
    <h3 style={{ fontFamily: font.display, fontSize: 19, color: C.ink, margin: 0, fontWeight: 600, letterSpacing: -0.2 }}>{children}</h3>
    {action}
  </div>
);

const Avatar = ({ text, size = 40, bg = C.ink, color = "#fff" }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 3, background: bg, color,
    display: "grid", placeItems: "center", fontWeight: 700, fontSize: size * 0.36,
    fontFamily: font.body, flexShrink: 0,
  }}>{text}</div>
);

// ---------- Root: auth gate ----------
export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Gate />
      </SettingsProvider>
    </AuthProvider>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  // If backend isn't configured yet, run in demo mode so the UI still shows.
  if (!hasSupabaseConfig) return <Shell demo />;
  if (loading) return <FullScreenLoader />;
  if (!session) return <Login />;
  return <Shell />;
}

function FullScreenLoader() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.paper }}>
      <Loader2 size={30} color={C.gold} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ---------- Main authenticated shell ----------
function Shell({ demo = false }) {
  const auth = useAuth();
  const profile = auth?.profile || { full_name: "Guest", role: "parent" };
  const role = profile.role;

  const [tab, setTab] = useState("dashboard");
  const [wards, setWards] = useState(WARDS);
  const [ward, setWard] = useState(WARDS[0]);
  const [activeThread, setActiveThread] = useState(THREADS[0]);
  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState(THREADS);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  // Load live data when a real backend is connected.
  useEffect(() => {
    if (demo) return;
    (async () => {
      const w = await API.getMyWards();
      if (w.length) {
        const mapped = w.map(s => ({
          id: s.id, name: s.full_name, avatar: s.avatar_initials || "?",
          grade: s.class_levels?.name || "", house: s.house,
        }));
        setWards(mapped);
        setWard(mapped[0]);
      }
    })();
  }, [demo]);

  const { settings } = useSettings();
  const brand = { primary: settings.primary_color, accent: settings.accent_color };

  const baseNav = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "grades", label: "Grades", icon: GraduationCap },
    { id: "quiz-results", label: "Quiz Results", icon: Award },
    { id: "attendance", label: "Attendance", icon: UserCheck },
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "records", label: "Download Records", icon: Download },
  ];
  const teacherNav = [
    { id: "enter-grades", label: "Enter Grades", icon: PenSquare, section: "Staff" },
  ];
  const adminNav = [
    { id: "enter-grades", label: "Enter Grades", icon: PenSquare, section: "Staff" },
    { id: "manage-students", label: "Students", icon: UserPlus, section: "Admin" },
    { id: "registry", label: "Registry (live)", icon: Database, section: "Admin" },
    { id: "link-parents", label: "Link Parents", icon: Link2, section: "Admin" },
    { id: "classes-subjects", label: "Classes & Subjects", icon: Users, section: "Admin" },
    { id: "school-settings", label: "School Identity", icon: SettingsIcon, section: "Admin" },
  ];
  const nav = role === "admin" ? [...baseNav, ...adminNav]
            : role === "teacher" ? [...baseNav, ...teacherNav]
            : baseNav;

  const sendMessage = () => {
    if (!draft.trim()) return;
    const updated = threads.map(t => t.id === activeThread.id
      ? { ...t, messages: [...t.messages, { from: "me", name: "You", text: draft, time: "Now" }], last: draft, time: "Now" }
      : t);
    setThreads(updated);
    setActiveThread(updated.find(t => t.id === activeThread.id));
    setDraft("");
    if (!demo && activeThread.dbId) {
      const roleForMsg = role === "parent" ? "parent" : role === "admin" ? "admin" : "teacher";
      API.sendMessage(activeThread.dbId, draft, roleForMsg).catch(() => {});
    }
    notify("Message sent through the school system — logged & routed.");
  };

  return (
    <div style={{
      fontFamily: font.body, background: C.paper, color: C.ink,
      minHeight: "100vh", display: "flex", position: "relative",
    }}>
      {/* ---------- Sidebar (desktop) ---------- */}
      <aside className="sidebar-desktop" style={{
        width: 250, background: brand.primary, color: "#fff", padding: "24px 16px",
        display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
      }}>
        <Brand settings={settings} />
        {role === "parent" && <WardSwitcher wards={wards} ward={ward} setWard={setWard} />}
        {role !== "parent" && <RoleBadge role={role} />}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <NavList nav={nav} tab={tab} setTab={setTab} accent={brand.accent} />
          <StaffLink settings={settings} role={role} accent={brand.accent} />
        </div>
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#DCE3EC", marginBottom: 10 }}>
            <Shield size={15} color={brand.accent} />
            <span>All contact stays inside the school. No personal numbers shared.</span>
          </div>
          <ProfileFooter profile={profile} onSignOut={() => auth?.signOut?.()} demo={demo} />
        </div>
      </aside>

      {/* ---------- Mobile top bar ---------- */}
      <div className="topbar-mobile" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, background: brand.primary,
        color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={() => setMobileNav(true)} style={{ background: "none", border: "none", color: "#fff" }}><Menu size={22} /></button>
        <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: 18 }}>{settings.school_name || "SchoolBridge"}</span>
      </div>

      {mobileNav && (
        <div onClick={() => setMobileNav(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 270, height: "100%", background: brand.primary, color: "#fff", padding: 20, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Brand settings={settings} />
              <button onClick={() => setMobileNav(false)} style={{ background: "none", border: "none", color: "#fff" }}><X size={20} /></button>
            </div>
            {role === "parent" && <WardSwitcher wards={wards} ward={ward} setWard={setWard} />}
            <NavList nav={nav} tab={tab} setTab={(t) => { setTab(t); setMobileNav(false); }} accent={brand.accent} />
            <StaffLink settings={settings} role={role} accent={brand.accent} />
            <div style={{ marginTop: 16 }}>
              <ProfileFooter profile={profile} onSignOut={() => auth?.signOut?.()} demo={demo} />
            </div>
          </div>
        </div>
      )}

      {/* ---------- Main ---------- */}
      <main className="main-pad" style={{ flex: 1, padding: "28px 32px", maxWidth: "100%", overflowX: "hidden", marginTop: 0 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          {tab === "dashboard" && <Dashboard ward={ward} setTab={setTab} role={role} profile={profile} />}
          {tab === "messages" && <Messages threads={threads} active={activeThread} setActive={setActiveThread} draft={draft} setDraft={setDraft} send={sendMessage} role={role} />}
          {tab === "grades" && <Grades ward={ward} role={role} demo={demo} notify={notify} setTab={setTab} />}
          {tab === "quiz-results" && <QuizResults ward={ward} demo={demo} />}
          {tab === "attendance" && <Attendance ward={ward} demo={demo} role={role} />}
          {tab === "assignments" && <Assignments role={role} />}
          {tab === "calendar" && <Calendar role={role} />}
          {tab === "announcements" && <Announcements role={role} notify={notify} demo={demo} />}
          {tab === "records" && <Records ward={ward} demo={demo} role={role} />}
          {tab === "enter-grades" && <EnterGrades />}
          {tab === "manage-students" && <ManageStudents />}
          {tab === "registry" && <RegistryManager />}
          {tab === "link-parents" && <LinkParents />}
          {tab === "classes-subjects" && <ClassesSubjects />}
          {tab === "school-settings" && <SchoolSettings />}
        </div>
      </main>

      {/* ---------- Toast ---------- */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: C.ink, color: "#fff", padding: "13px 20px", borderRadius: 12,
          fontSize: 13.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 10,
          zIndex: 60, animation: "slideUp .3s ease", boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
        }}>
          <CheckCircle2 size={17} color={C.gold} /> {toast}
        </div>
      )}
    </div>
  );
}

// ---------- Brand + nav pieces ----------
function Brand({ settings }) {
  const s = settings || {};
  const name = s.school_name || "SchoolBridge";
  const tag = s.tagline || "School Portal";
  const accent = s.accent_color || C.gold;
  const primary = s.primary_color || C.ink;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, paddingLeft: 4 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: accent, display: "grid", placeItems: "center", overflow: "hidden", flexShrink: 0 }}>
        {s.logo_url
          ? <img src={s.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
          : <GraduationCap size={20} color={primary} strokeWidth={2.4} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16.5, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        <div style={{ fontSize: 10, color: "#8FA0B5", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{tag}</div>
      </div>
    </div>
  );
}

// Renders nav with section dividers (Staff / Admin) and brand accent on active
function NavList({ nav, tab, setTab, accent }) {
  let lastSection = null;
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
      {nav.map(n => {
        const showHeader = n.section && n.section !== lastSection;
        lastSection = n.section || lastSection;
        const active = tab === n.id;
        return (
          <React.Fragment key={n.id}>
            {showHeader && (
              <div style={{ fontSize: 9.5, color: "#8FA0B5", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700, margin: "14px 12px 4px" }}>{n.section}</div>
            )}
            <button className="nav-item" onClick={() => setTab(n.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
              background: active ? accent : "transparent", color: active ? "#12233B" : "#C6D0DD",
              border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13.5,
              fontWeight: active ? 600 : 500, width: "100%", transition: "background .15s",
            }}>
              <n.icon size={18} strokeWidth={2} />
              <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
              {n.badge && <span style={badgeStyle}>{n.badge}</span>}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Link out to the school's existing staff platform (shown to staff only)
function StaffLink({ settings, role, accent }) {
  if (role === "parent" || !settings?.staff_platform_url) return null;
  return (
    <a href={settings.staff_platform_url} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", marginTop: 8,
      background: "rgba(255,255,255,0.06)", color: "#fff", borderRadius: 10, textDecoration: "none",
      fontSize: 13.5, fontWeight: 500, border: "1px dashed rgba(255,255,255,0.2)",
    }}>
      <ExternalLink size={17} color={accent} />
      <span style={{ flex: 1 }}>{settings.staff_platform_label || "Staff Tools"}</span>
    </a>
  );
}

function WardSwitcher({ wards = WARDS, ward, setWard }) {
  return (
    <div style={{ background: C.inkSoft, borderRadius: 12, padding: 6, marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: "#8FA0B5", padding: "4px 8px", letterSpacing: 0.5, textTransform: "uppercase" }}>Viewing ward</div>
      {wards.map(w => (
        <button key={w.id} onClick={() => setWard(w)} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px",
          background: ward.id === w.id ? C.ink : "transparent", border: "none", borderRadius: 9,
          cursor: "pointer", color: "#fff", marginBottom: 2,
        }}>
          <Avatar text={w.avatar} size={30} bg={ward.id === w.id ? C.gold : "#3A5273"} color={ward.id === w.id ? C.ink : "#fff"} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{w.name}</div>
            <div style={{ fontSize: 10.5, color: "#8FA0B5" }}>{w.grade}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function RoleBadge({ role }) {
  const labels = { teacher: "Teacher workspace", admin: "Administration" };
  return (
    <div style={{ background: C.inkSoft, borderRadius: 12, padding: "10px 12px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: 4, background: C.gold }} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "#fff" }}>{labels[role]}</span>
    </div>
  );
}

function ProfileFooter({ profile, onSignOut, demo }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, background: C.inkSoft }}>
      <Avatar text={(profile.avatar_initials || profile.full_name?.[0] || "U").toUpperCase()} size={34} bg={C.gold} color={C.ink} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.full_name}</div>
        <div style={{ fontSize: 10.5, color: "#8FA0B5", textTransform: "capitalize" }}>{demo ? "Demo mode" : profile.role}</div>
      </div>
      {!demo && (
        <button onClick={onSignOut} title="Sign out" style={{ background: "none", border: "none", cursor: "pointer", color: "#8FA0B5", display: "grid", placeItems: "center" }}>
          <LogOut size={16} />
        </button>
      )}
    </div>
  );
}

const navBtnStyle = (active) => ({
  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
  background: active ? C.gold : "transparent", color: active ? C.ink : "#C6D0DD",
  border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13.5,
  fontWeight: active ? 600 : 500, transition: "background .15s", width: "100%",
});
const badgeStyle = {
  background: C.clay, color: "#fff", fontSize: 10.5, fontWeight: 700,
  minWidth: 18, height: 18, borderRadius: 9, display: "grid", placeItems: "center", padding: "0 5px",
};

// ---------- Page header ----------
function PageHead({ eyebrow, title, sub, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 6 }}>{eyebrow}</div>
        <h1 style={{ fontFamily: font.display, fontSize: 30, margin: 0, color: C.ink, fontWeight: 600, letterSpacing: -0.5 }}>{title}</h1>
        {sub && <p style={{ color: C.mut, fontSize: 14, margin: "6px 0 0" }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

// ========================= DASHBOARD =========================
function Dashboard({ ward, setTab, role = "parent", profile }) {
  const first = ward?.name?.split(" ")[0] || "your ward";
  const isStaff = role !== "parent";
  const stats = isStaff ? [
    { label: "Class Average", value: "82%", tone: "sage", icon: Award, delta: "Basic 6 - Blue" },
    { label: "Attendance Today", value: "26/28", tone: "sky", icon: UserCheck, delta: "2 absent" },
    { label: "Assignments Set", value: "4", tone: "gold", icon: ClipboardList, delta: "1 due this week" },
    { label: "Open Messages", value: "3", tone: "clay", icon: MessageSquare, delta: "From parents" },
  ] : [
    { label: "Overall Average", value: "88%", tone: "sage", icon: Award, delta: "+4 this term" },
    { label: "Attendance", value: "97%", tone: "sky", icon: UserCheck, delta: "1 late day" },
    { label: "Assignments Due", value: "1", tone: "gold", icon: ClipboardList, delta: "Fractions — Sat" },
    { label: "Conduct", value: "Excellent", tone: "sage", icon: Star, delta: "Term 3" },
  ];
  const greetName = profile?.full_name?.split(" ")[0] || "there";
  return (
    <>
      <PageHead eyebrow="Overview" title={`Good morning, ${greetName}`}
        sub={isStaff ? "Your class at a glance." : `Here's how ${first} is doing at a glance.`}
        right={<button className="btn" onClick={() => setTab("messages")} style={primaryBtn}><MessageSquare size={16} /> {isStaff ? "Open messages" : "Message a teacher"}</button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        {stats.map(s => (
          <Card key={s.label} pad={16}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: chipBg(s.tone), display: "grid", placeItems: "center" }}>
                <s.icon size={18} color={chipFg(s.tone)} />
              </div>
            </div>
            <div style={{ fontFamily: font.display, fontSize: 28, fontWeight: 600, marginTop: 12, letterSpacing: -0.5 }}>{s.value}</div>
            <div style={{ fontSize: 12.5, color: C.mut, marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11.5, color: chipFg(s.tone), fontWeight: 600, marginTop: 6 }}>{s.delta}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle action={<Chip tone="sage">Trending up</Chip>}>Academic progress</SectionTitle>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={GRADE_TREND} margin={{ left: -18, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.gold} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="term" tick={{ fontSize: 11, fill: C.mut }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: C.mut }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="Ama" stroke={C.gold} strokeWidth={2.5} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Skill profile</SectionTitle>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={RADAR} outerRadius={80}>
              <PolarGrid stroke={C.line} />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10.5, fill: C.mut }} />
              <Radar dataKey="value" stroke={C.ink} fill={C.ink} fillOpacity={0.12} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Card>
          <SectionTitle action={<button style={linkBtn} onClick={() => setTab("announcements")}>All <ChevronRight size={14} /></button>}>Latest from school</SectionTitle>
          {ANNOUNCEMENTS.slice(0, 3).map(a => (
            <div key={a.id} className="row-hover" style={{ display: "flex", gap: 12, padding: "10px 8px", borderRadius: 10, cursor: "pointer" }}>
              <div style={{ marginTop: 3 }}><Circle size={8} fill={C.gold} color={C.gold} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: C.mut, marginTop: 2 }}>{a.time} · {a.author}</div>
              </div>
              <Chip tone={a.tag === "Event" ? "sky" : a.tag === "Academic" ? "sage" : "mut"}>{a.tag}</Chip>
            </div>
          ))}
        </Card>

        <Card>
          <SectionTitle action={<button style={linkBtn} onClick={() => setTab("calendar")}>Calendar <ChevronRight size={14} /></button>}>Coming up</SectionTitle>
          {EVENTS.slice(0, 3).map(e => (
            <div key={e.id} className="row-hover" style={{ display: "flex", gap: 12, padding: "10px 8px", borderRadius: 10, alignItems: "center" }}>
              <div style={{ width: 44, textAlign: "center", background: C.paper, borderRadius: 9, padding: "6px 0", border: `1px solid ${C.line}` }}>
                <div style={{ fontFamily: font.display, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{e.date}</div>
                <div style={{ fontSize: 9.5, color: C.mut, letterSpacing: 0.5 }}>{e.month}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{e.title}</div>
                <div style={{ fontSize: 12, color: C.mut }}>{e.time} · {e.ward}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

// ========================= MESSAGES =========================
function Messages({ threads, active, setActive, draft, setDraft, send }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [active]);
  return (
    <>
      <PageHead eyebrow="Communication" title="Messages"
        sub="Every conversation is routed and logged by the school. Teachers reply during working hours."
        right={<button className="btn" style={primaryBtn}><Plus size={16} /> New message</button>} />

      <Card pad={0} className="messages-grid" style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: 560, overflow: "hidden" }}>
        {/* Thread list */}
        <div style={{ borderRight: `1px solid ${C.line}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 14, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.paper, borderRadius: 10, padding: "8px 12px" }}>
              <Search size={16} color={C.mut} />
              <input placeholder="Search teachers or subjects" style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, flex: 1 }} />
            </div>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {threads.map(t => (
              <button key={t.id} onClick={() => setActive(t)} style={{
                display: "flex", gap: 11, padding: "13px 14px", width: "100%", textAlign: "left",
                background: active.id === t.id ? C.paper : "#fff", border: "none",
                borderBottom: `1px solid ${C.line}`, cursor: "pointer", borderLeft: active.id === t.id ? `3px solid ${C.gold}` : "3px solid transparent",
              }}>
                <Avatar text={t.initials} size={40} bg={t.tag === "Admin" ? C.sky : C.ink} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.teacher}</span>
                    <span style={{ fontSize: 10.5, color: C.mut }}>{t.time}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: C.gold, fontWeight: 600, margin: "1px 0 3px" }}>{t.subject} · {t.role}</div>
                  <div style={{ fontSize: 12, color: C.mut, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.last}</div>
                </div>
                {t.unread > 0 && <span style={{ ...badgeStyle, alignSelf: "center" }}>{t.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <Avatar text={active.initials} size={38} bg={active.tag === "Admin" ? C.sky : C.ink} />
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{active.teacher}</div>
                <div style={{ fontSize: 11.5, color: C.mut }}>{active.subject} · {active.role} · <span style={{ color: C.sage, fontWeight: 600 }}>Online</span></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <IconBtn icon={Phone} /><IconBtn icon={Video} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 18, background: C.paper, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ textAlign: "center", fontSize: 11, color: C.mut, marginBottom: 4 }}>
              <Shield size={12} style={{ verticalAlign: "middle" }} /> Messages are monitored by school administration for student safety.
            </div>
            {active.messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "72%" }}>
                {m.from === "them" && <div style={{ fontSize: 11, color: C.mut, marginBottom: 3, marginLeft: 4 }}>{m.name}</div>}
                <div style={{
                  background: m.from === "me" ? C.ink : "#fff", color: m.from === "me" ? "#fff" : C.ink,
                  padding: "10px 14px", borderRadius: 14, borderBottomRightRadius: m.from === "me" ? 4 : 14,
                  borderBottomLeftRadius: m.from === "me" ? 14 : 4, fontSize: 13.5, lineHeight: 1.5,
                  border: m.from === "them" ? `1px solid ${C.line}` : "none",
                }}>
                  {m.text}
                  {m.attach && (
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, background: C.paper, padding: "8px 10px", borderRadius: 9, color: C.ink }}>
                      <FileText size={16} color={C.clay} /><span style={{ fontSize: 12.5, fontWeight: 600 }}>{m.attach}</span>
                      <Download size={14} color={C.mut} style={{ marginLeft: "auto", cursor: "pointer" }} />
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: C.mut, marginTop: 3, textAlign: m.from === "me" ? "right" : "left", padding: "0 4px" }}>{m.time}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div style={{ padding: 14, borderTop: `1px solid ${C.line}`, display: "flex", gap: 10, alignItems: "center" }}>
            <IconBtn icon={Paperclip} />
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Write a message…" style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 24, padding: "11px 16px", fontSize: 13.5, outline: "none" }} />
            <button className="btn" onClick={send} style={{ ...primaryBtn, borderRadius: 24, padding: "11px 16px" }}><Send size={16} /></button>
          </div>
        </div>
      </Card>
    </>
  );
}

// ========================= GRADES =========================
function Grades({ ward, setTab }) {
  return (
    <>
      <PageHead eyebrow="Academics" title="Grades & reports" sub={`${ward.name} · Term 3, 2025`}
        right={<button className="btn" style={secondaryBtn} onClick={() => setTab && setTab("records")}><Download size={16} /> Download report card</button>} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle>Term comparison</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SUBJECTS} margin={{ left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="subject" tick={{ fontSize: 9.5, fill: C.mut }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: C.mut }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {SUBJECTS.map((s, i) => <Cell key={i} fill={s.score >= 85 ? C.sage : s.score >= 75 ? C.gold : C.clay} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>Overall standing</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 8px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: font.display, fontSize: 56, fontWeight: 700, color: C.ink, lineHeight: 1 }}>A</div>
              <div style={{ fontSize: 13, color: C.mut, marginTop: 4 }}>88% average</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              <Stat label="Class rank" value="3 of 28" />
              <Stat label="Conduct" value="Excellent" tone="sage" />
              <Stat label="Terms improving" value="3 in a row" tone="sage" />
            </div>
          </div>
        </Card>
      </div>

      <Card pad={0}>
        <div style={{ padding: 18, borderBottom: `1px solid ${C.line}` }}>
          <SectionTitle>Subject breakdown</SectionTitle>
        </div>
        {SUBJECTS.map((s, i) => (
          <div key={s.subject} className="row-hover" style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr 80px 80px 40px", alignItems: "center",
            padding: "15px 18px", borderBottom: i < SUBJECTS.length - 1 ? `1px solid ${C.line}` : "none", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{s.subject}</div>
              <div style={{ fontSize: 11.5, color: C.mut }}>{s.teacher}</div>
            </div>
            <div>
              <div style={{ height: 7, background: C.line, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${s.score}%`, height: "100%", background: s.score >= 85 ? C.sage : s.score >= 75 ? C.gold : C.clay, borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: font.display }}>{s.score}%</div>
            <div><Chip tone={s.grade === "A" ? "sage" : "gold"}>Grade {s.grade}</Chip></div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, color: s.trend >= 0 ? C.sage : C.clay, fontSize: 12.5, fontWeight: 600 }}>
              {s.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{Math.abs(s.trend)}
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

// ========================= QUIZ RESULTS (Registry bridge) =========================
// Read-only view of quiz results pulled LIVE from the school's existing
// registry/quiz system. Nothing here writes back — it's a window into the
// system the staff already use. When no registry URL is configured (or in
// demo mode) it shows a friendly explainer instead of an error.
function QuizResults({ ward, demo }) {
  const { settings } = useSettings();
  const url = settings?.registry_api_url;
  const [state, setState] = useState({ loading: false, results: [], error: null, loaded: false });

  useEffect(() => {
    if (demo || !url || !ward?.name) { setState(s => ({ ...s, loaded: true })); return; }
    let alive = true;
    setState({ loading: true, results: [], error: null, loaded: false });
    getQuizResults(url, ward.grade, ward.name).then(r => {
      if (!alive) return;
      setState({ loading: false, results: r.results || [], error: r.ok ? null : r.error, loaded: true });
    });
    return () => { alive = false; };
  }, [url, ward?.name, ward?.grade, demo]);

  const avg = state.results.length
    ? Math.round(state.results.reduce((a, r) => a + (r.pct || 0), 0) / state.results.length)
    : null;

  return (
    <>
      <PageHead eyebrow="Continuous assessment" title="Quiz results"
        sub={ward ? `${ward.name} · live from the school's quiz system` : ""} />

      {/* Not configured / demo — explain, don't error */}
      {(demo || !url) && (
        <Card style={{ borderLeft: `4px solid ${C.gold}` }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ background: C.goldSoft, borderRadius: 10, padding: 10, color: C.ink }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                Quiz results appear here once connected
              </div>
              <p style={{ color: C.mut, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                This page shows each child's quiz scores pulled directly from the
                school's existing quiz system — no re-entry, no duplication. An
                administrator can switch it on under <strong>School Identity → Quiz
                system link</strong> by pasting the registry web-app address.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Loading */}
      {!demo && url && state.loading && (
        <Card><div style={{ display: "flex", alignItems: "center", gap: 10, color: C.mut }}>
          <Loader2 size={18} className="spin" /> Fetching the latest quiz scores…
        </div></Card>
      )}

      {/* Loaded, empty */}
      {!demo && url && state.loaded && !state.loading && state.results.length === 0 && (
        <Card>
          <div style={{ textAlign: "center", padding: "24px 12px", color: C.mut }}>
            <Award size={30} style={{ color: C.mutLight, marginBottom: 10 }} />
            <div style={{ fontWeight: 600, color: C.ink, marginBottom: 4 }}>No quiz results yet</div>
            <p style={{ fontSize: 14, margin: 0 }}>
              When {ward?.name?.split(" ")[0] || "your child"} completes a quiz, the score will show here automatically.
            </p>
          </div>
        </Card>
      )}

      {/* Results */}
      {!demo && url && state.results.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 18 }}>
            <MiniStat label="Quizzes taken" value={state.results.length} tone="sky" />
            <MiniStat label="Average score" value={avg != null ? `${avg}%` : "—"} tone="sage" />
            <MiniStat label="Best result" value={`${Math.max(...state.results.map(r => r.pct || 0))}%`} tone="gold" />
          </div>
          <Card pad={0}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: C.mut, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    <th style={{ padding: "14px 18px" }}>Quiz</th>
                    <th style={{ padding: "14px 18px" }}>Score</th>
                    <th style={{ padding: "14px 18px" }}>Percentage</th>
                    <th style={{ padding: "14px 18px" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {state.results.map((r, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                      <td style={{ padding: "14px 18px", fontWeight: 600, color: C.ink }}>{r.quiz}</td>
                      <td style={{ padding: "14px 18px", color: C.inkSoft }}>{r.score}</td>
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{
                          fontWeight: 700,
                          color: (r.pct >= 70 ? C.sage : r.pct >= 50 ? C.gold : C.clay),
                        }}>{r.pct}%</span>
                      </td>
                      <td style={{ padding: "14px 18px", color: C.mut }}>{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p style={{ color: C.mutLight, fontSize: 12, marginTop: 12, textAlign: "center" }}>
            Live from the school's quiz system · read-only
          </p>
        </>
      )}
    </>
  );
}

// ========================= RECORDS (download full record) =========================
function Records({ ward, demo, role = "parent" }) {
  const { settings } = useSettings();
  const url = settings?.registry_api_url;
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  if (role !== "parent") {
    return (
      <>
        <PageHead eyebrow="Records" title="Download records"
          sub="Parents can download their child's full record from here." />
        <Card style={{ borderLeft: `4px solid ${C.gold}` }}>
          <p style={{ margin: 0, color: C.mut, fontSize: 14, lineHeight: 1.6 }}>
            This page is for parents. When a parent signs in, they can download a
            complete record — grades, quiz results, and attendance — for each child
            linked to them, as a file they can keep or print to PDF.
          </p>
        </Card>
      </>
    );
  }

  async function handleDownload() {
    if (!ward) return;
    setBusy(true); setNote("Gathering the full record…");
    try {
      // Grades from Supabase (RLS scopes to this parent's ward).
      let grades = [];
      if (!demo) { try { grades = await API.getGrades(ward.id); } catch { grades = []; } }

      // Quiz results + attendance live from the Registry (if configured).
      let quizzes = [], attendance = null;
      if (!demo && url) {
        const q = await getQuizResults(url, ward.grade, ward.name);
        quizzes = q.results || [];
        const a = await getAttendanceForStudent(url, ward.grade, ward.name);
        attendance = { summary: a.summary, history: a.history };
      }

      downloadRecord({
        school: settings,
        student: { name: ward.name, grade: ward.grade, id: ward.id },
        term: "Term 3, 2025/2026",
        grades, quizzes, attendance,
      });
      setNote("Downloaded. Open the file, then use Print → Save as PDF if you'd like a PDF.");
    } catch {
      setNote("Something went wrong gathering the record. Please try again.");
    }
    setBusy(false);
    setTimeout(() => setNote(""), 6000);
  }

  return (
    <>
      <PageHead eyebrow="Records" title="Download records"
        sub={ward ? `Everything on file for ${ward.name}` : ""} />

      <Card>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ background: C.goldSoft, borderRadius: 12, padding: 12, color: C.ink }}>
            <Download size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontWeight: 700, color: C.ink, fontSize: 16, marginBottom: 6 }}>
              {ward ? `${ward.name}'s full record` : "Select a child"}
            </div>
            <p style={{ color: C.mut, fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
              This gathers everything on file into one document you can keep or print:
            </p>
            <ul style={{ color: C.inkSoft, fontSize: 14, lineHeight: 1.7, margin: "0 0 16px", paddingLeft: 20 }}>
              <li>Grades and report (subjects, class &amp; exam scores, totals)</li>
              <li>Quiz results pulled live from the school's system</li>
              <li>Attendance summary and day-by-day record</li>
            </ul>
            <button onClick={handleDownload} disabled={busy || !ward}
              style={{ ...primaryBtn, opacity: busy || !ward ? 0.7 : 1, cursor: busy ? "default" : "pointer" }}>
              {busy ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
              {busy ? "Preparing…" : "Download full record"}
            </button>
            {note && <p style={{ color: C.sage, fontSize: 13, marginTop: 12 }}>{note}</p>}
            {!url && (
              <p style={{ color: C.mut, fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
                Note: quiz and attendance data appear once an administrator connects the
                school's quiz system under School Identity. Grades are always included.
              </p>
            )}
          </div>
        </div>
      </Card>

      <p style={{ color: C.mutLight, fontSize: 12, marginTop: 14, textAlign: "center" }}>
        The file opens in any browser. To save as PDF: open it, then choose Print → Save as PDF.
      </p>
    </>
  );
}

function MiniStat({ label, value, tone }) {
  const toneColor = { sage: C.sage, sky: C.sky, gold: C.gold, clay: C.clay }[tone] || C.ink;
  return (
    <Card>
      <div style={{ fontSize: 12, color: C.mut, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: toneColor, fontFamily: font.display }}>{value}</div>
    </Card>
  );
}

// ========================= ATTENDANCE =========================
function Attendance({ ward, demo, role = "parent" }) {
  const { settings } = useSettings();
  const url = settings?.registry_api_url;
  const live = !demo && url && role === "parent" && ward?.name;
  const [state, setState] = useState({ loading: false, summary: null, history: [], loaded: false });

  useEffect(() => {
    if (!live) { setState(s => ({ ...s, loaded: true })); return; }
    let alive = true;
    setState({ loading: true, summary: null, history: [], loaded: false });
    getAttendanceForStudent(url, ward.grade, ward.name).then(r => {
      if (!alive) return;
      setState({ loading: false, summary: r.summary, history: r.history || [], loaded: true });
    });
    return () => { alive = false; };
  }, [live, url, ward?.name, ward?.grade]);

  // ---- Live parent view ----
  if (live) {
    const s = state.summary;
    return (
      <>
        <PageHead eyebrow="Presence" title="Attendance"
          sub={ward ? `${ward.name} · live from the school register` : ""} />

        {state.loading && (
          <Card><div style={{ display: "flex", alignItems: "center", gap: 10, color: C.mut }}>
            <Loader2 size={18} className="spin" /> Loading attendance…
          </div></Card>
        )}

        {!state.loading && state.loaded && !s && state.history.length === 0 && (
          <Card>
            <div style={{ textAlign: "center", padding: "24px 12px", color: C.mut }}>
              <UserCheck size={30} style={{ color: C.mutLight, marginBottom: 10 }} />
              <div style={{ fontWeight: 600, color: C.ink, marginBottom: 4 }}>No attendance recorded yet</div>
              <p style={{ fontSize: 14, margin: 0 }}>Once the class register is taken, {ward?.name?.split(" ")[0] || "your child"}'s attendance will show here.</p>
            </div>
          </Card>
        )}

        {!state.loading && s && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 18 }}>
            <MiniStat label="Attendance rate" value={s.pct != null ? `${s.pct}%` : "—"} tone={s.pct >= 90 ? "sage" : s.pct >= 75 ? "gold" : "clay"} />
            <MiniStat label="Days present" value={s.present} tone="sage" />
            <MiniStat label="Days absent" value={s.absent} tone="clay" />
            <MiniStat label="School days" value={s.total} tone="sky" />
          </div>
        )}

        {!state.loading && state.history.length > 0 && (
          <Card pad={0}>
            <div style={{ padding: "16px 18px 8px", fontWeight: 600, color: C.ink, fontSize: 14 }}>Day-by-day record</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: C.mut, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    <th style={{ padding: "10px 18px" }}>Date</th>
                    <th style={{ padding: "10px 18px" }}>Status</th>
                    <th style={{ padding: "10px 18px" }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {state.history.map((h, i) => {
                    const st = String(h.status || "").toLowerCase();
                    const tone = st === "present" ? C.sage : st === "absent" ? C.clay : C.gold;
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={{ padding: "11px 18px", color: C.inkSoft }}>{h.date}</td>
                        <td style={{ padding: "11px 18px" }}>
                          <span style={{ fontWeight: 700, color: tone }}>{h.status || "—"}</span>
                        </td>
                        <td style={{ padding: "11px 18px", color: C.mut }}>{h.reason || ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        <p style={{ color: C.mutLight, fontSize: 12, marginTop: 12, textAlign: "center" }}>Live from the school register · read-only</p>
      </>
    );
  }

  // ---- Demo / non-parent fallback (mock chart) ----
  const total = ATTENDANCE.reduce((a, m) => a + m.present + m.absent, 0);
  const present = ATTENDANCE.reduce((a, m) => a + m.present, 0);
  return (
    <>
      <PageHead eyebrow="Presence" title="Attendance" sub="Daily records synced from classroom check-in." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
        <Card pad={18}><Stat label="Attendance rate" value={`${Math.round(present / total * 100)}%`} tone="sage" big /></Card>
        <Card pad={18}><Stat label="Days absent" value="4" tone="clay" big /></Card>
        <Card pad={18}><Stat label="Late arrivals" value="4" tone="gold" big /></Card>
      </div>
      <Card>
        <SectionTitle action={<Chip tone="sage">Above class average</Chip>}>Monthly attendance</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ATTENDANCE} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 12, fill: C.mut }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.mut }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="present" stackId="a" fill={C.sage} radius={[0, 0, 0, 0]} />
            <Bar dataKey="late" stackId="a" fill={C.gold} />
            <Bar dataKey="absent" stackId="a" fill={C.clay} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 12.5 }}>
          <Legend c={C.sage} label="Present" /><Legend c={C.gold} label="Late" /><Legend c={C.clay} label="Absent" />
        </div>
      </Card>
    </>
  );
}

// ========================= ASSIGNMENTS =========================
function Assignments() {
  const statusMap = {
    assigned: { chip: "gold", label: "To do", icon: Clock },
    done: { chip: "sky", label: "Submitted", icon: CheckCircle2 },
    late: { chip: "clay", label: "Overdue", icon: AlertCircle },
    graded: { chip: "sage", label: "Graded", icon: Award },
  };
  return (
    <>
      <PageHead eyebrow="Homework" title="Assignments" sub="Everything set by your ward's teachers, in one list." />
      <div style={{ display: "grid", gap: 12 }}>
        {ASSIGNMENTS.map(a => {
          const st = statusMap[a.status];
          return (
            <Card key={a.id} pad={16} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: chipBg(st.chip), display: "grid", placeItems: "center" }}>
                <st.icon size={20} color={chipFg(st.chip)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: C.mut, marginTop: 2 }}>{a.subject} · {a.ward}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Chip tone={st.chip}>{st.label}</Chip>
                <div style={{ fontSize: 12, color: C.mut, marginTop: 5 }}>{a.due}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// ========================= CALENDAR =========================
function Calendar() {
  const typeTone = { meeting: "sky", event: "sage", deadline: "clay" };
  return (
    <>
      <PageHead eyebrow="Schedule" title="Calendar" sub="School events, deadlines and your booked meetings."
        right={<button className="btn" style={primaryBtn}><Plus size={16} /> Book a conference</button>} />
      <div style={{ display: "grid", gap: 12 }}>
        {EVENTS.map(e => (
          <Card key={e.id} pad={16} style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 56, textAlign: "center", background: C.ink, color: "#fff", borderRadius: 12, padding: "10px 0" }}>
              <div style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{e.date}</div>
              <div style={{ fontSize: 10, color: C.gold, letterSpacing: 1, marginTop: 2 }}>{e.month}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: 12.5, color: C.mut, marginTop: 2 }}>{e.time} · For {e.ward}</div>
            </div>
            <Chip tone={typeTone[e.type]}>{e.type}</Chip>
            <button style={linkBtn}>Details <ChevronRight size={14} /></button>
          </Card>
        ))}
      </div>
    </>
  );
}

// ========================= ANNOUNCEMENTS =========================
function Announcements() {
  return (
    <>
      <PageHead eyebrow="Broadcast" title="Announcements" sub="Official notices from the school. You'll never miss one." />
      <div style={{ display: "grid", gap: 14 }}>
        {ANNOUNCEMENTS.map(a => (
          <Card key={a.id} style={{ borderLeft: a.pin ? `3px solid ${C.gold}` : `1px solid ${C.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {a.pin && <Star size={16} fill={C.gold} color={C.gold} />}
                <h3 style={{ fontFamily: font.display, fontSize: 18, margin: 0, fontWeight: 600 }}>{a.title}</h3>
              </div>
              <Chip tone={a.tag === "Event" ? "sky" : a.tag === "Academic" ? "sage" : "mut"}>{a.tag}</Chip>
            </div>
            <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6, margin: "0 0 10px" }}>{a.body}</p>
            <div style={{ fontSize: 12, color: C.mut, display: "flex", alignItems: "center", gap: 6 }}>
              <Megaphone size={13} /> {a.author} · {a.time}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

// ---------- Reusable bits ----------
function Stat({ label, value, tone, big }) {
  return (
    <div>
      <div style={{ fontSize: big ? 13 : 12, color: C.mut, marginBottom: big ? 6 : 2 }}>{label}</div>
      <div style={{ fontFamily: font.display, fontSize: big ? 34 : 15, fontWeight: 700, color: tone ? chipFg(tone) : C.ink }}>{value}</div>
    </div>
  );
}
const IconBtn = ({ icon: Icon }) => (
  <button className="btn" style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
    <Icon size={17} color={C.mut} />
  </button>
);
const Legend = ({ c, label }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.mut }}>
    <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} /> {label}
  </span>
);

// ---------- Style helpers ----------
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 8, background: C.ink, color: "#fff", border: "none", borderRadius: 11, padding: "11px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
const secondaryBtn = { display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: C.ink, border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
const linkBtn = { display: "inline-flex", alignItems: "center", gap: 2, background: "none", border: "none", color: C.gold, fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const tooltipStyle = { background: C.ink, border: "none", borderRadius: 10, color: "#fff", fontSize: 12 };
const chipBg = (t) => ({ gold: C.goldSoft, sage: "#E1EFE8", clay: "#F3E0DA", sky: "#E1EAF4", mut: "#EEF0F3" }[t]);
const chipFg = (t) => ({ gold: "#8A6A1F", sage: C.sage, clay: C.clay, sky: C.sky, mut: C.mut }[t]);
