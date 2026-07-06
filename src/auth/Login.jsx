import React, { useState, useEffect, useRef } from "react";
import { GraduationCap, Shield, Loader2, Check, X, Plus, UserPlus } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { hasSupabaseConfig, supabase } from "../lib/supabase";
import { getSchoolSettings, findOrCreateStudentByName, linkMyselfToStudent } from "../lib/api";
import { getClassList, getClassRoster, suggestNames, autoCorrectName } from "../lib/registry";

const C = {
  ink: "#12233B", inkSoft: "#243B57", paper: "#FBFAF6", gold: "#C69A3C",
  goldSoft: "#EFE3C4", line: "#E7E3D8", mut: "#6B7789", clay: "#B4553D", sage: "#4C7A6A",
};
const font = { display: "'Fraunces', Georgia, serif", body: "'Inter', system-ui, sans-serif" };

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin");     // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Parent signup: collected wards (each {name, classLabel})
  const [wards, setWards] = useState([]);
  const [signupStep, setSignupStep] = useState("account"); // account | wards | done

  // Registry connection for ward matching
  const [registryUrl, setRegistryUrl] = useState(null);
  const [classList, setClassList] = useState([]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    (async () => {
      try {
        const s = await getSchoolSettings();
        if (s?.registry_api_url) {
          setRegistryUrl(s.registry_api_url);
          const cl = await getClassList(s.registry_api_url);
          if (cl.ok) setClassList(cl.classes);
        }
      } catch { /* registry optional */ }
    })();
  }, []);

  async function submitSignin(e) {
    e.preventDefault();
    setErr(""); setMsg(""); setBusy(true);
    try {
      const { error } = await signIn(email, password);
      if (error) setErr(error.message);
    } finally { setBusy(false); }
  }

  // Step 1 of parent signup: create the account, then move to ward step.
  async function submitAccount(e) {
    e.preventDefault();
    setErr(""); setMsg(""); setBusy(true);
    try {
      const { error } = await signUp(email, password, fullName, "parent");
      if (error) { setErr(error.message); setBusy(false); return; }
      // If email confirmation is OFF, a session exists now and we can link wards.
      // If it's ON, we still collect wards and link after they confirm+first login.
      const { data: sess } = await supabase.auth.getSession();
      if (sess?.session) {
        setSignupStep("wards");
      } else {
        setMsg("Account created. Please check your email to confirm, then sign in to add your ward(s).");
        setMode("signin"); setSignupStep("account");
      }
    } finally { setBusy(false); }
  }

  // Final: persist collected wards as students + link parent to them.
  async function finishWithWards() {
    setErr(""); setBusy(true);
    try {
      for (const w of wards) {
        const student = await findOrCreateStudentByName(w.name, w.classLabel);
        if (student?.id) { try { await linkMyselfToStudent(student.id); } catch { /* may already be linked */ } }
      }
      setSignupStep("done");
      setMsg("All set! Your portal is ready.");
    } catch (e) {
      setErr("Couldn't link a ward: " + (e.message || "please try again."));
    } finally { setBusy(false); }
  }

  const brandPanel = (
    <div style={{ background: C.ink, color: "#fff", padding: "56px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: C.gold, display: "grid", placeItems: "center" }}>
          <GraduationCap size={24} color={C.ink} strokeWidth={2.4} />
        </div>
        <span style={{ fontFamily: font.display, fontSize: 22, fontWeight: 600 }}>SchoolBridge</span>
      </div>
      <div>
        <h1 style={{ fontFamily: font.display, fontSize: 40, fontWeight: 600, lineHeight: 1.15, letterSpacing: -0.5, margin: 0 }}>
          One trusted line between home and school.
        </h1>
        <p style={{ color: "#B8C4D4", fontSize: 15.5, lineHeight: 1.6, marginTop: 18, maxWidth: 420 }}>
          Follow your ward's grades, attendance and quizzes, and reach teachers directly — all through the school, never a personal number.
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#8FA0B5", fontSize: 13 }}>
        <Shield size={16} color={C.gold} /> Every message routed and logged by the school.
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: font.body }}>
      {brandPanel}
      <div style={{ background: C.paper, display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {!hasSupabaseConfig && (
            <div style={{ background: "#F3E0DA", color: C.clay, padding: 12, borderRadius: 10, fontSize: 12.5, marginBottom: 16 }}>
              Backend not configured yet. Add your Supabase URL and anon key to enable login.
            </div>
          )}

          {/* ---------- SIGN IN ---------- */}
          {mode === "signin" && (
            <>
              <h2 style={h2Style}>Welcome back</h2>
              <p style={subStyle}>Sign in to your school portal.</p>
              <form onSubmit={submitSignin}>
                <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
                {err && <Note tone="err">{err}</Note>}
                {msg && <Note tone="ok">{msg}</Note>}
                <PrimaryBtn busy={busy}>Sign in</PrimaryBtn>
              </form>
              <Switcher>
                New parent?{" "}
                <LinkBtn onClick={() => { setMode("signup"); setSignupStep("account"); setErr(""); setMsg(""); setWards([]); }}>
                  Create a parent account
                </LinkBtn>
              </Switcher>
            </>
          )}

          {/* ---------- PARENT SIGNUP: ACCOUNT ---------- */}
          {mode === "signup" && signupStep === "account" && (
            <>
              <h2 style={h2Style}>Create your parent account</h2>
              <p style={subStyle}>Step 1 of 2 — your details. Next you'll add your ward(s).</p>
              <form onSubmit={submitAccount}>
                <Field label="Your full name" value={fullName} onChange={setFullName} placeholder="e.g. Yaa Mensah" />
                <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Choose a password" />
                {err && <Note tone="err">{err}</Note>}
                {msg && <Note tone="ok">{msg}</Note>}
                <PrimaryBtn busy={busy}>Continue</PrimaryBtn>
              </form>
              <Switcher>
                Already have an account?{" "}
                <LinkBtn onClick={() => { setMode("signin"); setErr(""); setMsg(""); }}>Sign in</LinkBtn>
              </Switcher>
            </>
          )}

          {/* ---------- PARENT SIGNUP: WARDS ---------- */}
          {mode === "signup" && signupStep === "wards" && (
            <WardStep
              registryUrl={registryUrl}
              classList={classList}
              wards={wards}
              setWards={setWards}
              busy={busy}
              err={err}
              onFinish={finishWithWards}
            />
          )}

          {/* ---------- DONE ---------- */}
          {mode === "signup" && signupStep === "done" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: C.goldSoft, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <Check size={28} color={C.sage} />
              </div>
              <h2 style={{ ...h2Style, textAlign: "center" }}>You're all set</h2>
              <p style={subStyle}>Your account and ward(s) are ready. Loading your portal…</p>
              {msg && <Note tone="ok">{msg}</Note>}
              <PrimaryBtn busy={false} onClick={() => window.location.reload()}>Go to my portal</PrimaryBtn>
            </div>
          )}
        </div>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:820px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr !important}
        div[style*="56px 48px"]{padding:32px 24px !important}}`}</style>
    </div>
  );
}

// ---------- Ward step: class picker + type-ahead name + auto-correct ----------
function WardStep({ registryUrl, classList, wards, setWards, busy, err, onFinish }) {
  const [classLabel, setClassLabel] = useState("");
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [typed, setTyped] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [chosen, setChosen] = useState(null);     // the registry-official name
  const [showList, setShowList] = useState(false);
  const boxRef = useRef(null);

  // Load the roster when a class is picked.
  useEffect(() => {
    if (!classLabel || !registryUrl) { setRoster([]); return; }
    setLoadingRoster(true); setChosen(null); setTyped(""); setSuggestions([]);
    getClassRoster(registryUrl, classLabel).then((r) => {
      setRoster(r.names || []);
      setLoadingRoster(false);
    });
  }, [classLabel, registryUrl]);

  // Update suggestions as they type.
  useEffect(() => {
    if (!typed) { setSuggestions([]); return; }
    setSuggestions(suggestNames(typed, roster, 6));
  }, [typed, roster]);

  function pick(name) {
    setChosen(name); setTyped(name); setShowList(false); setSuggestions([]);
  }

  function addWard() {
    // Auto-correct whatever they typed to the registry's spelling.
    const official = chosen || autoCorrectName(typed, roster);
    if (!classLabel) return;
    if (!official) return;
    setWards([...wards, { name: official, classLabel }]);
    setClassLabel(""); setTyped(""); setChosen(null); setRoster([]); setSuggestions([]);
  }

  const canAdd = classLabel && (chosen || autoCorrectName(typed, roster));
  const correctionPreview = (!chosen && typed) ? autoCorrectName(typed, roster) : null;

  return (
    <>
      <h2 style={h2Style}>Add your ward(s)</h2>
      <p style={subStyle}>Step 2 of 2 — pick the class, then start typing the name. We'll match it to the school register.</p>

      {!registryUrl && (
        <Note tone="err">The school hasn't connected its class register yet. You can finish and add wards later, or contact the school office.</Note>
      )}

      {/* Added wards */}
      {wards.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {wards.map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: C.ink, color: C.gold, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>
                {w.name.split(" ").map(x => x[0]).slice(0, 2).join("")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: C.ink, fontSize: 14 }}>{w.name}</div>
                <div style={{ color: C.mut, fontSize: 12 }}>{w.classLabel}</div>
              </div>
              <button onClick={() => setWards(wards.filter((_, j) => j !== i))}
                style={{ background: "none", border: "none", color: C.mut, cursor: "pointer" }}><X size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Class picker */}
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Class</label>
        <select value={classLabel} onChange={(e) => setClassLabel(e.target.value)}
          style={{ ...inputStyle, appearance: "auto" }}>
          <option value="">Select a class…</option>
          {classList.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Name type-ahead */}
      {classLabel && (
        <div style={{ marginBottom: 14, position: "relative" }} ref={boxRef}>
          <label style={lbl}>Ward's name {loadingRoster && <span style={{ color: C.mut, fontWeight: 400 }}>· loading register…</span>}</label>
          <input
            value={typed}
            onChange={(e) => { setTyped(e.target.value); setChosen(null); setShowList(true); }}
            onFocus={() => setShowList(true)}
            placeholder="Start typing the name…"
            style={inputStyle}
            autoComplete="off"
          />
          {/* Suggestions dropdown */}
          {showList && suggestions.length > 0 && !chosen && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10, marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,.10)", zIndex: 20, overflow: "hidden" }}>
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => pick(s)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 13px", border: "none", background: "#fff", cursor: "pointer", fontSize: 14, color: C.ink }}
                  onMouseDown={(e) => e.preventDefault()}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {/* Confirmed / correction hints */}
          {chosen && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.sage, fontSize: 12.5, marginTop: 6 }}>
              <Check size={14} /> Matched to register: <strong>{chosen}</strong>
            </div>
          )}
          {!chosen && correctionPreview && correctionPreview.toLowerCase() !== typed.trim().toLowerCase() && (
            <div style={{ color: C.mut, fontSize: 12.5, marginTop: 6 }}>
              Did you mean <button type="button" onClick={() => pick(correctionPreview)}
                style={{ background: "none", border: "none", color: C.gold, fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 12.5 }}>{correctionPreview}</button>?
            </div>
          )}
          {!chosen && typed && !correctionPreview && roster.length > 0 && (
            <div style={{ color: C.clay, fontSize: 12.5, marginTop: 6 }}>
              No close match in {classLabel}. Check the spelling or class.
            </div>
          )}
        </div>
      )}

      <button type="button" onClick={addWard} disabled={!canAdd}
        style={{ ...ghostBtnStyle, opacity: canAdd ? 1 : 0.5, cursor: canAdd ? "pointer" : "default", marginBottom: 18 }}>
        <Plus size={16} /> Add this ward
      </button>

      {err && <Note tone="err">{err}</Note>}

      <PrimaryBtn busy={busy} onClick={onFinish} disabled={wards.length === 0}>
        {wards.length === 0 ? "Add at least one ward" : `Finish — ${wards.length} ward${wards.length > 1 ? "s" : ""} linked`}
      </PrimaryBtn>
    </>
  );
}

// ---------- Small shared UI ----------
const h2Style = { fontFamily: font.display, fontSize: 26, fontWeight: 600, color: C.ink, margin: "0 0 4px" };
const subStyle = { color: C.mut, fontSize: 14, margin: "0 0 24px" };
const lbl = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#12233B", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "11px 13px", borderRadius: 9, border: `1px solid ${C.line}`, fontSize: 14, outline: "none", background: "#fff" };
const ghostBtnStyle = { width: "100%", background: "#fff", color: C.ink, border: `1px solid ${C.line}`, borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required style={inputStyle} />
    </div>
  );
}
function PrimaryBtn({ children, busy, onClick, disabled }) {
  return (
    <button type={onClick ? "button" : "submit"} onClick={onClick} disabled={busy || disabled} style={{
      width: "100%", background: C.ink, color: "#fff", border: "none", borderRadius: 11,
      padding: "13px", fontSize: 14.5, fontWeight: 600, cursor: (busy || disabled) ? "default" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: (busy || disabled) ? 0.7 : 1,
    }}>
      {busy && <Loader2 size={16} className="spin" />}
      {children}
    </button>
  );
}
function Note({ children, tone }) {
  const col = tone === "err" ? C.clay : C.sage;
  return <div style={{ color: col, fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>{children}</div>;
}
function Switcher({ children }) {
  return <div style={{ textAlign: "center", marginTop: 18, fontSize: 13.5, color: C.mut }}>{children}</div>;
}
function LinkBtn({ children, onClick }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", color: C.gold, fontWeight: 600, cursor: "pointer", fontSize: 13.5 }}>{children}</button>;
}
