import React, { useState, useEffect } from "react";
import {
  Building2, Users, Link2, PenSquare, Plus, Check, Loader2, Palette,
  ExternalLink, GraduationCap, Save, UserPlus
} from "lucide-react";
import * as API from "./lib/api";
import { useSettings } from "./lib/SettingsProvider";

const C = {
  ink: "#12233B", inkSoft: "#243B57", paper: "#FBFAF6", card: "#FFFFFF",
  gold: "#C69A3C", goldSoft: "#EFE3C4", sage: "#4C7A6A", clay: "#B4553D",
  sky: "#3E6B9C", line: "#E7E3D8", mut: "#6B7789",
};
const font = { display: "'Fraunces', Georgia, serif", body: "'Inter', system-ui, sans-serif" };

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 22, marginBottom: 16 };
const label = { display: "block", fontSize: 12.5, fontWeight: 600, color: C.ink, marginBottom: 6 };
const input = { width: "100%", padding: "10px 13px", borderRadius: 9, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", fontFamily: font.body, background: "#fff" };
const btn = { display: "inline-flex", alignItems: "center", gap: 8, background: C.ink, color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
const btnGhost = { ...btn, background: "#fff", color: C.ink, border: `1px solid ${C.line}` };

function Head({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 6 }}>{eyebrow}</div>
      <h1 style={{ fontFamily: font.display, fontSize: 28, margin: 0, color: C.ink, fontWeight: 600, letterSpacing: -0.5 }}>{title}</h1>
      {sub && <p style={{ color: C.mut, fontSize: 14, margin: "6px 0 0" }}>{sub}</p>}
    </div>
  );
}

function Field({ labelText, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={label}>{labelText}</label>
      <input style={input} {...props} />
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.ink, color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 13.5, fontWeight: 500, display: "flex", gap: 10, alignItems: "center", zIndex: 80, boxShadow: "0 8px 30px rgba(0,0,0,.25)" }}>
      <Check size={16} color={C.gold} /> {msg}
    </div>
  );
}

/* ========================= SCHOOL SETTINGS (white-label) ========================= */
export function SchoolSettings() {
  const { settings, refresh } = useSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => { setForm(settings); }, [settings]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save() {
    setSaving(true);
    const { error } = await API.updateSchoolSettings({
      school_name: form.school_name,
      tagline: form.tagline,
      logo_url: form.logo_url || null,
      primary_color: form.primary_color,
      accent_color: form.accent_color,
      currency_symbol: form.currency_symbol,
      staff_platform_url: form.staff_platform_url || null,
      staff_platform_label: form.staff_platform_label,
      contact_email: form.contact_email || null,
    });
    setSaving(false);
    if (error) { setToast("Couldn't save — " + error.message); }
    else { await refresh(); setToast("School settings saved. Changes are live."); }
    setTimeout(() => setToast(""), 3200);
  }

  return (
    <>
      <Head eyebrow="Customize" title="School identity"
        sub="Change your school's name, logo and colors. Updates apply for everyone instantly — no redeploy." />

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <div>
          <div style={card}>
            <SectionLabel icon={Building2}>Name & branding</SectionLabel>
            <Field labelText="School name" value={form.school_name || ""} onChange={set("school_name")} placeholder="Faith Kids Academy of Excellence" />
            <Field labelText="Tagline (small text under the name)" value={form.tagline || ""} onChange={set("tagline")} placeholder="Parent Portal" />
            <Field labelText="Logo image URL (optional)" value={form.logo_url || ""} onChange={set("logo_url")} placeholder="https://…/logo.png" />
            <p style={{ fontSize: 12, color: C.mut, marginTop: -4 }}>Tip: upload your logo somewhere public (e.g. your website) and paste its link here. Leave blank to use the graduation-cap icon.</p>
          </div>

          <div style={card}>
            <SectionLabel icon={Palette}>Colors</SectionLabel>
            <div style={{ display: "flex", gap: 16 }}>
              <ColorField labelText="Primary (headers, sidebar)" value={form.primary_color} onChange={set("primary_color")} />
              <ColorField labelText="Accent (highlights, buttons)" value={form.accent_color} onChange={set("accent_color")} />
            </div>
            <div style={{ marginTop: 14 }}>
              <Field labelText="Currency symbol" value={form.currency_symbol || ""} onChange={set("currency_symbol")} placeholder="₵" />
            </div>
          </div>

          <div style={card}>
            <SectionLabel icon={ExternalLink}>Staff tools link</SectionLabel>
            <p style={{ fontSize: 13, color: C.mut, marginTop: 0 }}>Link to your existing staff platform (quizzes, registry, attendance). Staff will see a button that opens it.</p>
            <Field labelText="Staff platform web address" value={form.staff_platform_url || ""} onChange={set("staff_platform_url")} placeholder="https://your-staff-app.netlify.app" />
            <Field labelText="Button label" value={form.staff_platform_label || ""} onChange={set("staff_platform_label")} placeholder="Staff Tools" />
            <Field labelText="Contact email (shown to parents, optional)" value={form.contact_email || ""} onChange={set("contact_email")} placeholder="office@yourschool.edu.gh" />
          </div>

          <button style={{ ...btn, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save changes
          </button>
        </div>

        {/* Live preview */}
        <div>
          <div style={{ ...card, position: "sticky", top: 20 }}>
            <SectionLabel>Live preview</SectionLabel>
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.line}` }}>
              <div style={{ background: form.primary_color, color: "#fff", padding: 18, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: form.accent_color, display: "grid", placeItems: "center", overflow: "hidden" }}>
                  {form.logo_url
                    ? <img src={form.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
                    : <GraduationCap size={22} color={form.primary_color} strokeWidth={2.4} />}
                </div>
                <div>
                  <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, lineHeight: 1.1 }}>{form.school_name || "Your School"}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.7)", letterSpacing: 1, textTransform: "uppercase", marginTop: 3 }}>{form.tagline || "Parent Portal"}</div>
                </div>
              </div>
              <div style={{ padding: 18, background: C.paper }}>
                <div style={{ fontSize: 13, color: C.mut, marginBottom: 10 }}>Sample button:</div>
                <span style={{ background: form.accent_color, color: form.primary_color, padding: "9px 16px", borderRadius: 9, fontSize: 13, fontWeight: 700 }}>Message a teacher</span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: C.mut, marginTop: 12 }}>This is how your header and buttons will look. Save to apply everywhere.</p>
          </div>
        </div>
      </div>
      <Toast msg={toast} />
    </>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      {Icon && <Icon size={16} color={C.gold} />}
      <span style={{ fontFamily: font.display, fontSize: 16, fontWeight: 600, color: C.ink }}>{children}</span>
    </div>
  );
}

function ColorField({ labelText, value, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={label}>{labelText}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="color" value={value || "#000000"} onChange={onChange} style={{ width: 42, height: 40, border: `1px solid ${C.line}`, borderRadius: 8, cursor: "pointer", background: "#fff" }} />
        <input value={value || ""} onChange={onChange} style={{ ...input, fontFamily: "monospace" }} />
      </div>
    </div>
  );
}

/* ========================= MANAGE STUDENTS ========================= */
export function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [house, setHouse] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setStudents(await API.getAllStudents());
    setClasses(await API.getClassLevels());
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await API.createStudent({ full_name: name, class_level_id: classId || null, house: house || null });
    setBusy(false);
    if (error) { setToast("Error: " + error.message); }
    else { setName(""); setHouse(""); await load(); setToast("Student added."); }
    setTimeout(() => setToast(""), 2600);
  }

  return (
    <>
      <Head eyebrow="Registry" title="Students" sub="Add pupils and place them in a class. Parents are linked to them on the next screen." />
      <div style={card}>
        <SectionLabel icon={UserPlus}>Add a student</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div><label style={label}>Full name</label><input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ama Mensah" /></div>
          <div>
            <label style={label}>Class</label>
            <select style={input} value={classId} onChange={e => setClassId(e.target.value)}>
              <option value="">Select class…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label style={label}>House (optional)</label><input style={input} value={house} onChange={e => setHouse(e.target.value)} placeholder="Kente" /></div>
          <button style={{ ...btn, opacity: busy ? 0.7 : 1 }} onClick={add} disabled={busy}><Plus size={16} /> Add</button>
        </div>
        {classes.length === 0 && <p style={{ fontSize: 12.5, color: C.clay, marginTop: 12 }}>No classes yet — add one under “Classes & subjects” first, or students can be added without a class for now.</p>}
      </div>

      <div style={{ ...card, padding: 0 }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.line}`, fontFamily: font.display, fontWeight: 600, color: C.ink }}>
          All students ({students.length})
        </div>
        {students.length === 0
          ? <div style={{ padding: 22, color: C.mut, fontSize: 14 }}>No students yet. Add your first one above.</div>
          : students.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 22px", borderBottom: i < students.length - 1 ? `1px solid ${C.line}` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.ink, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>{s.avatar_initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s.full_name}</div>
                <div style={{ fontSize: 12, color: C.mut }}>{s.class_levels?.name || "No class"}{s.house ? ` · ${s.house}` : ""}</div>
              </div>
            </div>
          ))}
      </div>
      <Toast msg={toast} />
    </>
  );
}

/* ========================= LINK PARENTS ========================= */
export function LinkParents() {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [links, setLinks] = useState([]);
  const [parentId, setParentId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setParents(await API.getParents());
    setStudents(await API.getAllStudents());
    setLinks(await API.getGuardianships());
  }
  useEffect(() => { load(); }, []);

  async function link() {
    if (!parentId || !studentId) return;
    setBusy(true);
    const { error } = await API.linkParentToStudent(parentId, studentId);
    setBusy(false);
    if (error) { setToast(error.message.includes("duplicate") ? "That parent is already linked to this student." : "Error: " + error.message); }
    else { setStudentId(""); await load(); setToast("Parent linked to student."); }
    setTimeout(() => setToast(""), 2800);
  }

  return (
    <>
      <Head eyebrow="Registry" title="Link parents to children"
        sub="Connect a parent's account to their child so they see only their own ward's records." />
      <div style={card}>
        <SectionLabel icon={Link2}>Create a link</SectionLabel>
        {parents.length === 0
          ? <p style={{ fontSize: 13.5, color: C.mut }}>No parent accounts yet. Parents first sign up on the login screen; once they do, they'll appear here to be linked.</p>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={label}>Parent</label>
                <select style={input} value={parentId} onChange={e => setParentId(e.target.value)}>
                  <option value="">Select parent…</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Student (their child)</label>
                <select style={input} value={studentId} onChange={e => setStudentId(e.target.value)}>
                  <option value="">Select student…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <button style={{ ...btn, opacity: busy ? 0.7 : 1 }} onClick={link} disabled={busy}><Link2 size={16} /> Link</button>
            </div>
          )}
      </div>

      <div style={{ ...card, padding: 0 }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.line}`, fontFamily: font.display, fontWeight: 600 }}>Existing links ({links.length})</div>
        {links.length === 0
          ? <div style={{ padding: 22, color: C.mut, fontSize: 14 }}>No links yet.</div>
          : links.map((l, i) => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 22px", borderBottom: i < links.length - 1 ? `1px solid ${C.line}` : "none", fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>{l.parent?.full_name}</span>
              <span style={{ color: C.mut }}>is guardian of</span>
              <span style={{ fontWeight: 600 }}>{l.student?.full_name}</span>
            </div>
          ))}
      </div>
      <Toast msg={toast} />
    </>
  );
}

/* ========================= CLASSES & SUBJECTS ========================= */
export function ClassesSubjects() {
  const [classes, setClasses] = useState([]);
  const [cname, setCname] = useState("");
  const [stage, setStage] = useState("Primary");
  const [sname, setSname] = useState("");
  const [sclass, setSclass] = useState("");
  const [toast, setToast] = useState("");

  async function load() { setClasses(await API.getClassLevels()); }
  useEffect(() => { load(); }, []);

  async function addClass() {
    if (!cname.trim()) return;
    const { error } = await API.createClassLevel({ name: cname, stage });
    if (error) setToast("Error: " + error.message);
    else { setCname(""); await load(); setToast("Class added."); }
    setTimeout(() => setToast(""), 2400);
  }
  async function addSubject() {
    if (!sname.trim() || !sclass) return;
    const { error } = await API.createSubject({ name: sname, class_level_id: sclass });
    if (error) setToast("Error: " + error.message);
    else { setSname(""); setToast("Subject added."); }
    setTimeout(() => setToast(""), 2400);
  }

  return (
    <>
      <Head eyebrow="Academics" title="Classes & subjects" sub="Set up the classes in your school and the subjects taught in each." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={card}>
          <SectionLabel icon={Users}>Add a class</SectionLabel>
          <Field labelText="Class name" value={cname} onChange={e => setCname(e.target.value)} placeholder="e.g. Basic 5 - Gold" />
          <div style={{ marginBottom: 14 }}>
            <label style={label}>Stage</label>
            <select style={input} value={stage} onChange={e => setStage(e.target.value)}>
              <option>KG</option><option>Primary</option><option>JHS</option>
            </select>
          </div>
          <button style={btn} onClick={addClass}><Plus size={16} /> Add class</button>
        </div>
        <div style={card}>
          <SectionLabel icon={GraduationCap}>Add a subject</SectionLabel>
          <Field labelText="Subject name" value={sname} onChange={e => setSname(e.target.value)} placeholder="e.g. Mathematics" />
          <div style={{ marginBottom: 14 }}>
            <label style={label}>For class</label>
            <select style={input} value={sclass} onChange={e => setSclass(e.target.value)}>
              <option value="">Select class…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button style={btn} onClick={addSubject}><Plus size={16} /> Add subject</button>
        </div>
      </div>
      <div style={{ ...card, padding: 0, marginTop: 16 }}>
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.line}`, fontFamily: font.display, fontWeight: 600 }}>Classes ({classes.length})</div>
        {classes.length === 0
          ? <div style={{ padding: 22, color: C.mut, fontSize: 14 }}>No classes yet.</div>
          : classes.map((c, i) => (
            <div key={c.id} style={{ display: "flex", gap: 10, padding: "12px 22px", borderBottom: i < classes.length - 1 ? `1px solid ${C.line}` : "none", fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>{c.name}</span><span style={{ color: C.mut }}>· {c.stage}</span>
            </div>
          ))}
      </div>
      <Toast msg={toast} />
    </>
  );
}

/* ========================= TEACHER: ENTER GRADES ========================= */
export function EnterGrades() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [classScore, setClassScore] = useState("");
  const [examScore, setExamScore] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setStudents(await API.getAllStudents());
      setSubjects(await API.getSubjects());
      const t = await API.getTerms();
      setTerms(t);
      const cur = t.find(x => x.is_current);
      if (cur) setTermId(cur.id);
    })();
  }, []);

  const total = (Number(classScore) || 0) + (Number(examScore) || 0);
  const letter = total >= 80 ? "A" : total >= 70 ? "B" : total >= 60 ? "C" : total >= 50 ? "D" : "E";

  async function save() {
    if (!studentId || !subjectId || !termId) { setToast("Pick a student, subject and term first."); setTimeout(() => setToast(""), 2400); return; }
    setBusy(true);
    const { error } = await API.upsertGrade({
      student_id: studentId, subject_id: subjectId, term_id: termId,
      class_score: Number(classScore) || 0, exam_score: Number(examScore) || 0,
    });
    setBusy(false);
    if (error) setToast("Error: " + error.message);
    else { setClassScore(""); setExamScore(""); setToast("Grade saved."); }
    setTimeout(() => setToast(""), 2600);
  }

  return (
    <>
      <Head eyebrow="Academics" title="Enter grades" sub="Record continuous assessment and exam scores. The total and letter grade are worked out for you." />
      <div style={card}>
        <SectionLabel icon={PenSquare}>New grade entry</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={label}>Student</label>
            <select style={input} value={studentId} onChange={e => setStudentId(e.target.value)}>
              <option value="">Select…</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Subject</label>
            <select style={input} value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">Select…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Term</label>
            <select style={input} value={termId} onChange={e => setTermId(e.target.value)}>
              <option value="">Select…</option>
              {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div><label style={label}>Class score (out of 50)</label><input type="number" min="0" max="50" style={input} value={classScore} onChange={e => setClassScore(e.target.value)} /></div>
          <div><label style={label}>Exam score (out of 50)</label><input type="number" min="0" max="50" style={input} value={examScore} onChange={e => setExamScore(e.target.value)} /></div>
          <div style={{ textAlign: "center", padding: "0 8px" }}>
            <div style={{ fontSize: 11, color: C.mut }}>Total</div>
            <div style={{ fontFamily: font.display, fontSize: 24, fontWeight: 700, color: C.ink }}>{total}<span style={{ fontSize: 14, color: C.mut }}> · {letter}</span></div>
          </div>
        </div>
        <button style={{ ...btn, marginTop: 16, opacity: busy ? 0.7 : 1 }} onClick={save} disabled={busy}>
          {busy ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save grade
        </button>
      </div>
      <Toast msg={toast} />
    </>
  );
}
