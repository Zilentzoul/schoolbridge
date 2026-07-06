// ─────────────────────────────────────────────────────────────
//  Student record export — builds a single, self-contained HTML
//  document with a child's grades, quiz results, and attendance,
//  then triggers a download. The file opens on any device and
//  prints cleanly to PDF (browser → Print → Save as PDF).
//
//  Everything is passed in already-fetched, so this file does no
//  network calls of its own — the page gathers the data, this turns
//  it into a document.
// ─────────────────────────────────────────────────────────────

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function gradesTable(grades) {
  if (!grades || !grades.length) return `<p class="empty">No grades recorded yet.</p>`;
  const rows = grades.map((g) => {
    const subject = g.subjects?.name || g.subject || "";
    const cls = g.class_score != null ? g.class_score : (g.class ?? "");
    const exam = g.exam_score != null ? g.exam_score : (g.exam ?? "");
    const total = g.total != null ? g.total : "";
    const letter = g.letter || "";
    return `<tr><td>${esc(subject)}</td><td>${esc(cls)}</td><td>${esc(exam)}</td><td class="num">${esc(total)}</td><td>${esc(letter)}</td></tr>`;
  }).join("");
  return `<table>
    <thead><tr><th>Subject</th><th>Class (/50)</th><th>Exam (/50)</th><th>Total (/100)</th><th>Grade</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function quizTable(quizzes) {
  if (!quizzes || !quizzes.length) return `<p class="empty">No quiz results yet.</p>`;
  const rows = quizzes.map((q) =>
    `<tr><td>${esc(q.quiz)}</td><td>${esc(q.score)}</td><td class="num">${esc(q.pct)}%</td><td>${esc(q.date)}</td></tr>`
  ).join("");
  return `<table>
    <thead><tr><th>Quiz</th><th>Score</th><th>Percentage</th><th>Date</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function attendanceSection(att) {
  if (!att || (!att.summary && (!att.history || !att.history.length))) {
    return `<p class="empty">No attendance recorded yet.</p>`;
  }
  const s = att.summary;
  const cards = s ? `<div class="stats">
    <div class="stat"><div class="k">Attendance rate</div><div class="v">${s.pct != null ? s.pct + "%" : "—"}</div></div>
    <div class="stat"><div class="k">Days present</div><div class="v">${esc(s.present)}</div></div>
    <div class="stat"><div class="k">Days absent</div><div class="v">${esc(s.absent)}</div></div>
    <div class="stat"><div class="k">School days</div><div class="v">${esc(s.total)}</div></div>
  </div>` : "";
  const hist = (att.history && att.history.length)
    ? `<table><thead><tr><th>Date</th><th>Status</th><th>Note</th></tr></thead><tbody>${
        att.history.map((h) => `<tr><td>${esc(h.date)}</td><td>${esc(h.status)}</td><td>${esc(h.reason)}</td></tr>`).join("")
      }</tbody></table>`
    : "";
  return cards + hist;
}

// Build the full HTML document string.
export function buildRecordHtml({ school, student, term, grades, quizzes, attendance }) {
  const primary = (school && school.primary_color) || "#12233B";
  const accent = (school && school.accent_color) || "#C69A3C";
  const schoolName = (school && school.school_name) || "School";
  const generated = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(student.name)} — Student Record</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1a2433; margin: 0; background: #f4f5f7; }
  .page { max-width: 820px; margin: 0 auto; background: #fff; padding: 40px 44px; }
  header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid ${accent}; padding-bottom: 18px; margin-bottom: 26px; }
  .logo { width: 54px; height: 54px; border-radius: 12px; background: ${primary}; color: ${accent}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 22px; overflow: hidden; }
  .logo img { width: 100%; height: 100%; object-fit: contain; }
  h1 { font-size: 22px; margin: 0; color: ${primary}; }
  .sub { color: #6b7789; font-size: 13px; margin-top: 3px; }
  .meta { margin: 0 0 28px; padding: 14px 16px; background: #f7f6f2; border-radius: 10px; font-size: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
  .meta b { color: ${primary}; }
  h2 { font-size: 16px; color: ${primary}; border-left: 4px solid ${accent}; padding-left: 10px; margin: 30px 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-bottom: 8px; }
  th { text-align: left; background: ${primary}; color: #fff; padding: 9px 12px; font-weight: 600; font-size: 12px; }
  td { padding: 9px 12px; border-bottom: 1px solid #eceae2; }
  td.num, th.num { text-align: right; }
  .stats { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
  .stat { flex: 1; min-width: 120px; background: #f7f6f2; border-radius: 10px; padding: 12px 14px; }
  .stat .k { font-size: 11px; text-transform: uppercase; letter-spacing: .5px; color: #6b7789; }
  .stat .v { font-size: 24px; font-weight: 700; color: ${primary}; margin-top: 4px; }
  .empty { color: #6b7789; font-style: italic; font-size: 14px; }
  footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #eceae2; font-size: 12px; color: #9aa4b2; text-align: center; }
  .actions { max-width: 820px; margin: 16px auto 0; padding: 0 44px; }
  .actions button { background: ${primary}; color: #fff; border: none; border-radius: 9px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; }
  @media print { body { background: #fff; } .actions { display: none; } .page { padding: 0; max-width: none; } }
</style></head>
<body>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
<div class="page">
  <header>
    <div class="logo">${school && school.logo_url ? `<img src="${esc(school.logo_url)}" alt="">` : esc((schoolName[0] || "S"))}</div>
    <div><h1>${esc(schoolName)}</h1><div class="sub">Student Record</div></div>
  </header>

  <div class="meta">
    <div><b>Student:</b> ${esc(student.name)}</div>
    <div><b>Class:</b> ${esc(student.grade || "")}</div>
    <div><b>Term:</b> ${esc(term || "")}</div>
    <div><b>Generated:</b> ${esc(generated)}</div>
  </div>

  <h2>Grades &amp; report</h2>
  ${gradesTable(grades)}

  <h2>Quiz results</h2>
  ${quizTable(quizzes)}

  <h2>Attendance</h2>
  ${attendanceSection(attendance)}

  <footer>This record was generated from ${esc(schoolName)}'s parent portal. Figures are drawn from the school's own registers.</footer>
</div>
</body></html>`;
}

// Trigger a browser download of the built HTML as a .html file.
export function downloadRecord({ school, student, term, grades, quizzes, attendance }) {
  const html = buildRecordHtml({ school, student, term, grades, quizzes, attendance });
  const safeName = String(student.name || "student").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${safeName}_record.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
