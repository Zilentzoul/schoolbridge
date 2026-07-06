import React, { useState, useEffect } from "react";
import {
  Building2, Users, Link2, PenSquare, Plus, Check, Loader2, Palette,
  ExternalLink, GraduationCap, Save, UserPlus, Award, Upload as UploadIcon,
  AlertTriangle, RefreshCw, Trash2, ArrowRightLeft, Pencil, X as XIcon
} from "lucide-react";
import * as API from "./lib/api";
import { useSettings } from "./lib/SettingsProvider";
import { getRegistry, addStudent, renameStudent, removeStudent, moveStudent } from "./lib/registry";

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

  // ---- Logo upload from device ----
  // Reads a chosen image, downscales it to a max 320px square via canvas,
  // and stores it as a compact data URL directly in settings. No external
  // image host needed — it travels with the school's branding row.
  const [logoErr, setLogoErr] = useState("");
  function onLogoFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLogoErr("");
    if (!file.type.startsWith("image/")) { setLogoErr("Please choose an image file (PNG, JPG, or SVG)."); return; }
    if (file.size > 3 * 1024 * 1024) { setLogoErr("That image is large — please use one under 3 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      // SVGs can be stored as-is (they're small and scale perfectly).
      if (file.type === "image/svg+xml") { setForm(f => ({ ...f, logo_url: reader.result })); return; }
      const img = new Image();
      img.onload = () => {
        const max = 320;
        let { width, height } = img;
        if (width > height && width > max) { height = Math.round(height * max / width); width = max; }
        else if (height > max) { width = Math.round(width * max / height); height = max; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        // PNG preserves transparency for logos on the navy sidebar.
        setForm(f => ({ ...f, logo_url: canvas.toDataURL("image/png") }));
      };
      img.onerror = () => setLogoErr("Couldn't read that image. Try a different file.");
      img.src = reader.result;
    };
    reader.onerror = () => setLogoErr("Couldn't read that file. Try again.");
    reader.readAsDataURL(file);
  }

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
      registry_api_url: form.registry_api_url || null,
      registry_admin_key: form.registry_admin_key || null,
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

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8 }}>School logo</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 12, flexShrink: 0,
                  background: form.logo_url ? "#fff" : C.ink, border: `1px solid ${C.line}`,
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {form.logo_url
                    ? <img src={form.logo_url} alt="Logo preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    : <GraduationCap size={26} color={C.gold} />}
                </div>
                <div>
                  <label style={{ ...btn, display: "inline-flex", cursor: "pointer", padding: "8px 14px", fontSize: 13 }}>
                    <UploadIcon size={15} /> Choose from device
                    <input type="file" accept="image/*" onChange={onLogoFile} style={{ display: "none" }} />
                  </label>
                  {form.logo_url && (
                    <button onClick={() => setForm(f => ({ ...f, logo_url: null }))}
                      style={{ marginLeft: 8, background: "none", border: "none", color: C.clay, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {logoErr && <p style={{ fontSize: 12, color: C.clay, margin: "0 0 8px" }}>{logoErr}</p>}
              <Field labelText="…or paste an image link" value={typeof form.logo_url === "string" && form.logo_url.startsWith("http") ? form.logo_url : ""} onChange={set("logo_url")} placeholder="https://…/logo.png" />
              <p style={{ fontSize: 12, color: C.mut, marginTop: -4 }}>Upload straight from your phone or computer — it's saved with your branding. Or paste a link. Leave blank for the graduation-cap icon.</p>
            </div>
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

          <div style={card}>
            <SectionLabel icon={Award}>Quiz results for parents</SectionLabel>
            <p style={{ fontSize: 13, color: C.mut, marginTop: 0 }}>
              Optional. Paste your Registry web-app address to let parents see their
              child's quiz scores inside this portal — read-only, pulled live from your
              existing system. Leave blank to keep quiz results staff-only.
            </p>
            <Field labelText="Registry web-app address" value={form.registry_api_url || ""} onChange={set("registry_api_url")} placeholder="https://script.google.com/macros/s/…/exec" />
            <Field labelText="Admin write key (optional, for registry edits)" value={form.registry_admin_key || ""} onChange={set("registry_admin_key")} placeholder="a secret word only staff know" />
            <p style={{ fontSize: 12, color: C.mut, marginTop: -4 }}>
              The write key is sent when an admin adds, renames, moves, or removes a
              student, so only staff who know it can change live records.
            </p>
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

/* ========================= REGISTRY MANAGER (writes to Google Sheets live) ========================= */

export function RegistryManager() {
  const { settings } = useSettings();
  const url = settings?.registry_api_url;
  const key = settings?.registry_admin_key || "";

  const [classes, setClasses] = useState({});     // { "Basic 4A": ["NAME", ...] }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState("");        // selected class
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);    // { kind, ... } | null

  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);    // { name, draft } | null

  async function load() {
    if (!url) return;
    setLoading(true); setError("");
    const r = await getRegistry(url);
    setLoading(false);
    if (!r.ok) { setError("Couldn't reach the registry. Check the web-app address and that its access is set to \"Anyone\"."); return; }
    setClasses(r.classes || {});
    const names = Object.keys(r.classes || {});
    if (names.length && !active) setActive(names[0]);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [url]);

  function flash(m) { setToast(m); setTimeout(() => setToast(""), 3000); }

  const classNames = Object.keys(classes).sort();
  const roster = (classes[active] || []);

  async function doAdd() {
    const nm = newName.trim();
    if (!nm || !active) return;
    setBusy(true);
    const res = await addStudent(url, key, active, nm);
    setBusy(false);
    if (res.status === "ok" || res.ok) {
      setClasses(c => ({ ...c, [active]: [...(c[active] || []), nm.toUpperCase()] }));
      setNewName(""); flash(`Added ${nm.toUpperCase()} to ${active}.`);
    } else { flash("Add failed — " + (res.message || "please try again.")); }
  }

  async function doRename(oldName, draft) {
    const nn = draft.trim();
    if (!nn || nn.toUpperCase() === oldName.toUpperCase()) { setEditing(null); return; }
    setBusy(true);
    const res = await renameStudent(url, key, active, oldName, nn);
    setBusy(false);
    setEditing(null);
    if (res.ok || res.status === "ok") {
      setClasses(c => ({ ...c, [active]: (c[active] || []).map(n => n === oldName ? nn.toUpperCase() : n) }));
      flash(`Renamed to ${nn.toUpperCase()} — updated in the score sheets too.`);
    } else { flash("Rename failed — " + (res.message || "please try again.")); }
  }

  async function doRemove(name) {
    setBusy(true);
    const res = await removeStudent(url, key, active, name);
    setBusy(false); setConfirm(null);
    if (res.status === "ok" || res.ok) {
      setClasses(c => ({ ...c, [active]: (c[active] || []).filter(n => n !== name) }));
      flash(`Removed ${name} from ${active}.`);
    } else { flash("Remove failed — " + (res.message || "please try again.")); }
  }

  async function doMove(name, toClass) {
    setBusy(true);
    const res = await moveStudent(url, key, name, active, toClass);
    setBusy(false); setConfirm(null);
    if (res.ok || res.status === "ok") {
      setClasses(c => ({
        ...c,
        [active]: (c[active] || []).filter(n => n !== name),
        [toClass]: [...(c[toClass] || []), name],
      }));
      flash(`Moved ${name} to ${toClass} — records followed.`);
    } else { flash("Move failed — " + (res.message || "please try again.")); }
  }

  if (!url) {
    return (
      <>
        <Head eyebrow="Registry" title="Registry management"
          sub="Add, rename, move, or remove students — changes write to your Google Sheets live." />
        <div style={{ ...card, borderLeft: `4px solid ${C.gold}` }}>
          <SectionLabel icon={AlertTriangle}>Not connected yet</SectionLabel>
          <p style={{ color: C.mut, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            To manage the registry from here, add your Registry web-app address under
            <strong> School Identity → Quiz results for parents</strong>. Once it's set, this
            page lets you edit the live registry — the same one your quiz system uses.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head eyebrow="Registry" title="Registry management"
        sub="Changes here write to your Google Sheets in real time — the same registry your quiz system uses." />

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <button style={{ ...btnGhost, opacity: loading ? 0.6 : 1 }} onClick={load} disabled={loading}>
          {loading ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />} Refresh from sheets
        </button>
        <span style={{ fontSize: 12.5, color: C.mut }}>
          {classNames.length} classes · {Object.values(classes).reduce((a, v) => a + v.length, 0)} students
        </span>
      </div>

      {error && (
        <div style={{ ...card, borderLeft: `4px solid ${C.clay}` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertTriangle size={18} color={C.clay} style={{ marginTop: 2 }} />
            <p style={{ margin: 0, color: C.inkSoft, fontSize: 14, lineHeight: 1.6 }}>{error}</p>
          </div>
        </div>
      )}

      {classNames.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
          {/* Class list */}
          <div style={card}>
            <SectionLabel icon={Users}>Classes</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {classNames.map(cn => (
                <button key={cn} onClick={() => { setActive(cn); setEditing(null); }}
                  style={{
                    textAlign: "left", padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                    background: active === cn ? C.ink : "transparent", color: active === cn ? "#fff" : C.inkSoft,
                    fontSize: 13.5, fontWeight: active === cn ? 600 : 500, display: "flex", justifyContent: "space-between",
                  }}>
                  <span>{cn}</span>
                  <span style={{ opacity: 0.7, fontSize: 12 }}>{(classes[cn] || []).length}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Roster of the active class */}
          <div style={card}>
            <SectionLabel icon={GraduationCap}>{active || "Select a class"}</SectionLabel>

            {/* Add student */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input style={{ ...input, marginBottom: 0 }} placeholder="New student's full name"
                value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") doAdd(); }} />
              <button style={{ ...btn, opacity: busy || !newName.trim() ? 0.6 : 1 }} onClick={doAdd} disabled={busy || !newName.trim()}>
                <Plus size={15} /> Add
              </button>
            </div>

            {/* Roster */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {roster.length === 0 && <p style={{ color: C.mut, fontSize: 14 }}>No students in this class yet.</p>}
              {roster.map((name, i) => (
                <div key={name + i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "9px 4px",
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                }}>
                  {editing && editing.name === name ? (
                    <>
                      <input style={{ ...input, marginBottom: 0, flex: 1 }} value={editing.draft}
                        autoFocus onChange={e => setEditing({ name, draft: e.target.value })}
                        onKeyDown={e => { if (e.key === "Enter") doRename(name, editing.draft); if (e.key === "Escape") setEditing(null); }} />
                      <button style={{ ...btn, padding: "8px 12px" }} onClick={() => doRename(name, editing.draft)} disabled={busy}>Save</button>
                      <button style={iconBtn} onClick={() => setEditing(null)} aria-label="Cancel"><XIcon size={16} /></button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontSize: 13.5, color: C.ink }}>{name}</span>
                      <button style={iconBtn} title="Rename" onClick={() => setEditing({ name, draft: name })}><Pencil size={15} /></button>
                      <button style={iconBtn} title="Move to another class"
                        onClick={() => setConfirm({ kind: "move", name, toClass: classNames.find(c => c !== active) || active })}>
                        <ArrowRightLeft size={15} />
                      </button>
                      <button style={{ ...iconBtn, color: C.clay }} title="Remove"
                        onClick={() => setConfirm({ kind: "remove", name })}>
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal for destructive / consequential actions */}
      {confirm && (
        <ConfirmModal
          confirm={confirm}
          classNames={classNames}
          active={active}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onChangeTarget={(toClass) => setConfirm({ ...confirm, toClass })}
          onProceed={() => confirm.kind === "remove"
            ? doRemove(confirm.name)
            : doMove(confirm.name, confirm.toClass)}
        />
      )}

      <Toast msg={toast} />
    </>
  );
}

const iconBtn = {
  background: "none", border: `1px solid ${C.line}`, borderRadius: 8,
  padding: "6px 8px", cursor: "pointer", color: C.inkSoft, display: "inline-flex",
};

function ConfirmModal({ confirm, classNames, active, busy, onCancel, onChangeTarget, onProceed }) {
  const isRemove = confirm.kind === "remove";
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(18,35,59,.45)", zIndex: 90,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onCancel}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 440, width: "100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ background: isRemove ? "#F7E4DF" : C.goldSoft, borderRadius: 10, padding: 8 }}>
            {isRemove ? <Trash2 size={20} color={C.clay} /> : <ArrowRightLeft size={20} color={C.ink} />}
          </div>
          <h3 style={{ margin: 0, fontFamily: font.display, fontSize: 20, color: C.ink }}>
            {isRemove ? "Remove student?" : "Move student?"}
          </h3>
        </div>

        {isRemove ? (
          <p style={{ color: C.inkSoft, fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
            This removes <strong>{confirm.name}</strong> from <strong>{active}</strong> in the live
            registry. This writes to your Google Sheets and can't be undone from here.
          </p>
        ) : (
          <>
            <p style={{ color: C.inkSoft, fontSize: 14, lineHeight: 1.6, margin: "0 0 12px" }}>
              Move <strong>{confirm.name}</strong> from <strong>{active}</strong> to:
            </p>
            <select style={{ ...input, marginBottom: 20 }} value={confirm.toClass}
              onChange={e => onChangeTarget(e.target.value)}>
              {classNames.filter(c => c !== active).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <p style={{ color: C.mut, fontSize: 12.5, lineHeight: 1.5, margin: "0 0 20px" }}>
              Their existing scores and attendance follow them, just like in your current portal.
            </p>
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button style={btnGhost} onClick={onCancel} disabled={busy}>Cancel</button>
          <button style={{
            ...btn, background: isRemove ? C.clay : C.ink, opacity: busy ? 0.7 : 1,
          }} onClick={onProceed} disabled={busy}>
            {busy ? <Loader2 size={15} className="spin" /> : (isRemove ? <Trash2 size={15} /> : <ArrowRightLeft size={15} />)}
            {isRemove ? "Remove" : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
}
