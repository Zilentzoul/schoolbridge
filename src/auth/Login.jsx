import React, { useState } from "react";
import { GraduationCap, Shield, Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { hasSupabaseConfig } from "../lib/supabase";

const C = {
  ink: "#12233B", inkSoft: "#243B57", paper: "#FBFAF6", gold: "#C69A3C",
  goldSoft: "#EFE3C4", line: "#E7E3D8", mut: "#6B7789", clay: "#B4553D",
};
const font = { display: "'Fraunces', Georgia, serif", body: "'Inter', system-ui, sans-serif" };

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("parent");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr(""); setMsg(""); setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) setErr(error.message);
      } else {
        const { error } = await signUp(email, password, fullName, role);
        if (error) setErr(error.message);
        else setMsg("Account created. Check your email to confirm, then sign in.");
      }
    } finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: font.body }}>
      {/* Left brand panel */}
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
            Follow your ward's grades, attendance and homework, and reach teachers directly — all through the school, never a personal number.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#8FA0B5", fontSize: 13 }}>
          <Shield size={16} color={C.gold} /> Every message routed and logged by the school.
        </div>
      </div>

      {/* Right form */}
      <div style={{ background: C.paper, display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontFamily: font.display, fontSize: 26, fontWeight: 600, color: C.ink, margin: "0 0 4px" }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p style={{ color: C.mut, fontSize: 14, margin: "0 0 24px" }}>
            {mode === "signin" ? "Sign in to your school portal." : "Register to access the portal."}
          </p>

          {!hasSupabaseConfig && (
            <div style={{ background: "#F3E0DA", color: C.clay, padding: 12, borderRadius: 10, fontSize: 12.5, marginBottom: 16 }}>
              Backend not configured yet. Add your Supabase URL and anon key to environment variables to enable login.
            </div>
          )}

          <form onSubmit={submit}>
            {mode === "signup" && (
              <>
                <Field label="Full name" value={fullName} onChange={setFullName} placeholder="e.g. Yaa Mensah" />
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>I am a</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["parent", "teacher", "admin"].map(r => (
                      <button type="button" key={r} onClick={() => setRole(r)} style={{
                        flex: 1, padding: "9px", borderRadius: 9, cursor: "pointer", textTransform: "capitalize",
                        border: `1px solid ${role === r ? C.gold : C.line}`,
                        background: role === r ? C.goldSoft : "#fff",
                        color: role === r ? "#8A6A1F" : C.mut, fontWeight: 600, fontSize: 13,
                      }}>{r}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@school.edu.gh" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            {err && <div style={{ color: C.clay, fontSize: 13, marginBottom: 12 }}>{err}</div>}
            {msg && <div style={{ color: "#4C7A6A", fontSize: 13, marginBottom: 12 }}>{msg}</div>}

            <button type="submit" disabled={busy} style={{
              width: "100%", background: C.ink, color: "#fff", border: "none", borderRadius: 11,
              padding: "13px", fontSize: 14.5, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: busy ? 0.7 : 1,
            }}>
              {busy && <Loader2 size={16} className="spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 18, fontSize: 13.5, color: C.mut }}>
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); setMsg(""); }}
              style={{ background: "none", border: "none", color: C.gold, fontWeight: 600, cursor: "pointer", fontSize: 13.5 }}>
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:820px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr !important}
        div[style*="56px 48px"]{padding:32px 24px !important}}`}</style>
    </div>
  );
}

const lbl = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#12233B", marginBottom: 6 };
function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required
        style={{ width: "100%", padding: "11px 13px", borderRadius: 9, border: `1px solid ${C.line}`, fontSize: 14, outline: "none" }} />
    </div>
  );
}
