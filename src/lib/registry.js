// ─────────────────────────────────────────────────────────────
//  Registry bridge — read-only link to the school's EXISTING
//  quiz/registry system (Google Apps Script web app).
//
//  This does NOT change or write to that system. It only READS a
//  student's quiz results using the endpoint the Registry already
//  exposes:
//
//    GET <registry_api_url>?action=getStudentSubmissions
//        &cls=<class name>&name=<lowercased student name>
//    -> { status: "ok", results: [ { quiz, score, pct, date, tabs, flag } ] }
//
//  The join key is the same one both systems already share: the
//  class name (e.g. "Basic 6A") plus the student's name. Nothing is
//  duplicated; the Registry stays the single source of truth.
// ─────────────────────────────────────────────────────────────

// Normalise a class label so "Basic 6 - Blue", "Basic 6", "basic 6a"
// all have a chance of matching the Registry's "Basic 6A" style keys.
// We keep it forgiving but never guess wildly.
export function classQueryVariants(className) {
  if (!className) return [];
  const raw = String(className).trim();
  const variants = new Set([raw]);
  // Strip a trailing " - House" descriptor: "Basic 6 - Blue" -> "Basic 6"
  const noHouse = raw.replace(/\s*[-–—].*$/, "").trim();
  if (noHouse) variants.add(noHouse);
  // If it ends in a bare stage with no stream letter, offer A and B too,
  // since the Registry splits classes into streams (6A/6B).
  if (/\d$/.test(noHouse)) {
    variants.add(noHouse + "A");
    variants.add(noHouse + "B");
  }
  return [...variants];
}

// Fetch quiz results for one student from the Registry web app.
// Returns { ok, results, error }. Never throws.
export async function getQuizResults(registryUrl, className, studentName) {
  if (!registryUrl) return { ok: false, results: [], error: "not_configured" };
  const name = String(studentName || "").toLowerCase().trim();
  if (!name) return { ok: true, results: [] };

  const tries = classQueryVariants(className);
  // Gather across every likely class spelling (a student's custom quizzes
  // may be stored under "Basic 6" while standard ones sit under "Basic 6A"),
  // then de-duplicate so parents see the full set without repeats.
  const collected = [];
  let matchedClass = null;
  for (const cls of tries) {
    try {
      const u = new URL(registryUrl);
      u.searchParams.set("action", "getStudentSubmissions");
      u.searchParams.set("cls", cls);
      u.searchParams.set("name", name);
      const res = await fetch(u.toString(), { method: "GET" });
      if (!res.ok) continue;
      const json = await res.json();
      const results = (json && json.results) || [];
      if (results.length) {
        if (!matchedClass) matchedClass = cls;
        results.forEach((r) => collected.push(normalizeResult(r)));
      }
    } catch {
      /* try next variant */
    }
  }
  // De-duplicate on quiz + date + score (same row seen under two class spellings).
  const seen = new Set();
  const deduped = collected.filter((r) => {
    const kkey = `${r.quiz}|${r.date}|${r.score}`;
    if (seen.has(kkey)) return false;
    seen.add(kkey);
    return true;
  });
  return { ok: true, results: deduped, matchedClass };
}

// The two class scripts return slightly different field names across
// versions (pct as "90%" string or a number, flag in col 6 or 7).
// Normalise to one shape the UI can rely on.
function normalizeResult(r) {
  const pctRaw = r.pct != null ? r.pct : r.percentage;
  let pct = 0;
  if (typeof pctRaw === "number") {
    pct = pctRaw <= 1 ? Math.round(pctRaw * 100) : Math.round(pctRaw);
  } else if (typeof pctRaw === "string") {
    const n = parseFloat(pctRaw.replace("%", ""));
    if (!isNaN(n)) pct = n <= 1 ? Math.round(n * 100) : Math.round(n);
  }
  return {
    quiz: r.quiz || r.tab || "Quiz",
    score: r.score != null ? String(r.score) : "",
    pct,
    date: r.date || r.timestamp || "",
    tabs: r.tabs != null ? r.tabs : r.tabSwitches || 0,
    flag: r.flag || "",
  };
}

// ─────────────────────────────────────────────────────────────
//  ADMIN — registry management (writes to the Google Sheets live)
//
//  These call the SAME doPost actions the school's own admin portal
//  already uses: add / rename / remove / move students, plus reading
//  the full roster. The Registry propagates renames and class moves
//  into the score sheets and attendance automatically — exactly as it
//  does for the existing portal.
//
//  A shared admin key (adminKey) is sent with every write so that only
//  people who know it can change live records. If the Registry doesn't
//  check a key, this is simply ignored and harmless.
// ─────────────────────────────────────────────────────────────

// Read the whole registry: { ok, classes: { "Basic 4A": ["NAME", ...], ... } }
export async function getRegistry(registryUrl) {
  if (!registryUrl) return { ok: false, classes: {}, error: "not_configured" };
  try {
    const u = new URL(registryUrl);
    u.searchParams.set("action", "getAll");
    const res = await fetch(u.toString());
    if (!res.ok) return { ok: false, classes: {}, error: "http_" + res.status };
    const json = await res.json();
    // The Registry's getAll returns { status:'ok', students:{ "Basic 4A":[...] } }.
    // Also tolerate a couple of other shapes just in case.
    if (json.students && typeof json.students === "object") {
      const map = {};
      Object.keys(json.students).forEach((cls) => {
        map[cls] = (json.students[cls] || []).map((n) => String(n).toUpperCase());
      });
      return { ok: true, classes: map };
    }
    if (json.classes) return { ok: true, classes: json.classes };
    const map = {};
    const rows = json.data || json.rows || json.results || [];
    rows.forEach((r) => {
      const cls = (Array.isArray(r) ? r[0] : r.cls || r.class) || "";
      const name = (Array.isArray(r) ? r[1] : r.name) || "";
      if (!cls || !name) return;
      (map[cls] = map[cls] || []).push(String(name).toUpperCase());
    });
    return { ok: true, classes: map };
  } catch (e) {
    return { ok: false, classes: {}, error: String(e) };
  }
}

// Low-level POST to the Registry web app. Apps Script web apps don't send
// CORS headers, so we post as text/plain (a "simple request") which the
// browser allows without a preflight. Returns parsed JSON or {status:'error'}.
async function registryPost(registryUrl, payload) {
  try {
    const res = await fetch(registryUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { status: res.ok ? "ok" : "error", raw: text }; }
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

export function addStudent(url, key, cls, name) {
  return registryPost(url, { action: "add", adminKey: key, cls, name });
}
export function renameStudent(url, key, cls, oldName, newName) {
  return registryPost(url, { action: "rename", adminKey: key, cls, oldName, newName });
}
export function removeStudent(url, key, cls, name) {
  return registryPost(url, { action: "remove", adminKey: key, cls, name });
}
export function moveStudent(url, key, name, fromClass, toClass) {
  return registryPost(url, { action: "move", adminKey: key, name, fromClass, toClass });
}

// ─────────────────────────────────────────────────────────────
//  ATTENDANCE — read-only, live from the central attendance sheet
//
//  Two endpoints your Registry already exposes:
//    getAttendanceSummary&cls=<class>  -> per-student present/absent/total
//    getAttendance&cls=<class>         -> every dated record + special days
//
//  We fetch by class, then filter to the one student by name (the summary
//  is per class, so we pick the matching row). This mirrors the quiz path.
// ─────────────────────────────────────────────────────────────

// Match a student's summary + day-by-day history. Returns:
// { ok, summary: {present, absent, total, pct} | null, history: [{date,status,reason}], error }
export async function getAttendanceForStudent(registryUrl, className, studentName) {
  if (!registryUrl) return { ok: false, summary: null, history: [], error: "not_configured" };
  const name = String(studentName || "").toLowerCase().trim();
  if (!name) return { ok: true, summary: null, history: [] };

  const tries = classQueryVariants(className);
  let summary = null;
  let history = [];
  let matched = false;

  for (const cls of tries) {
    try {
      // Summary first (fast, gives the headline numbers).
      const su = new URL(registryUrl);
      su.searchParams.set("action", "getAttendanceSummary");
      su.searchParams.set("cls", cls);
      const sres = await fetch(su.toString());
      if (sres.ok) {
        const sjson = await sres.json();
        const rows = (sjson && sjson.summary) || [];
        const mine = rows.find((r) => String(r.name || "").toLowerCase().trim() === name
          || firstLastMatch(r.name, name));
        if (mine) {
          const present = Number(mine.present) || 0;
          const total = Number(mine.total) || 0;
          summary = {
            present,
            absent: Number(mine.absent) || Math.max(0, total - present),
            total,
            pct: total > 0 ? Math.round((present / total) * 100) : null,
          };
          matched = true;
        }
      }

      // History (day-by-day) for this class, filtered to the student.
      const hu = new URL(registryUrl);
      hu.searchParams.set("action", "getAttendance");
      hu.searchParams.set("cls", cls);
      const hres = await fetch(hu.toString());
      if (hres.ok) {
        const hjson = await hres.json();
        const recs = (hjson && hjson.attendance) || [];
        recs.forEach((r) => {
          const rn = String(r.name || "").toLowerCase().trim();
          if (rn === name || firstLastMatch(r.name, name)) {
            history.push({ date: r.date || "", status: r.status || "", reason: r.reason || "" });
          }
        });
      }

      if (matched && history.length) break;
    } catch {
      /* try next class variant */
    }
  }

  // De-duplicate history on date+status and sort newest first.
  const seen = new Set();
  history = history
    .filter((h) => { const k = h.date + "|" + h.status; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return { ok: true, summary, history };
}

// First-name + last-name token match, matching the class scripts' logic.
function firstLastMatch(stored, wanted) {
  const a = String(stored || "").toLowerCase().trim().split(/\s+/);
  const b = String(wanted || "").toLowerCase().trim().split(/\s+/);
  return a.length && b.length && a[0] === b[0] && a[a.length - 1] === b[b.length - 1];
}
