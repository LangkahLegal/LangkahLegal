/**
 * Generator laporan HTML interaktif E2E & Regression Testing LangkahLegal.
 * Satu file mandiri (CSS/JS inline, tanpa dependensi eksternal) — bisa dibuka offline.
 *
 * Pemakaian:
 *   node e2e/regression/support/generate-report-html.js [output.html]
 */
const fs = require("fs");
const path = require("path");
const { buildReportData, runKind } = require("./report-data.js");

const D = buildReportData();
const { ROOT, findings, all, stat, byProject, features, sevCount, catCount, env, SEV_ORDER, VER_LABEL, PROJ_SHORT } = D;
const OUT = path.resolve(process.argv[2] || path.join(ROOT, "reports", "E2E_REGRESSION_REPORT.html"));

const h = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pct = (a, b) => (b ? (a / b) * 100 : 0);

const STATUS = {
  pass: ["Lulus", "s-pass"], known: ["Known defect", "s-known"], fail: ["Gagal baru", "s-fail"],
  fixed: ["Defect diperbaiki?", "s-fail"], flaky: ["Flaky", "s-fail"], skip: ["Skip", "s-skip"],
};
const sevClass = (s) => `sev-${s.toLowerCase()}`;
const badge = (kind) => `<span class="badge ${STATUS[kind][1]}">${STATUS[kind][0]}</span>`;

// ─── Bagian-bagian ─────────────────────────────────────────────────────────
const kpis = [
  ["Test case", stat.cases, `${stat.casePass} lulus · ${stat.caseKnown} defect · ${stat.caseSkip} skip`],
  ["Eksekusi", stat.runs, "Desktop · Mobile · Live API"],
  ["Lulus", stat.pass, "eksekusi sesuai expected", "tone-pass"],
  ["Known defect", stat.known, "gagal sesuai temuan", "tone-known"],
  ["Gagal baru", stat.fail + stat.fixed + stat.flaky, stat.fail + stat.fixed + stat.flaky ? "perlu ditinjau" : "suite hijau", stat.fail ? "tone-fail" : ""],
  ["Pass rate", `${stat.passRate.toFixed(1)}%`, "tanpa eksekusi skip"],
];
const kpiHtml = kpis.map(([l, v, sub, tone = ""]) => `<div class="kpi ${tone}"><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${h(sub)}</div></div>`).join("");

const bar = (segments, total) => `<div class="bar" role="img" aria-label="${h(segments.map((s) => `${s.label} ${s.value}`).join(", "))}">${segments.filter((s) => s.value).map((s) => `<span class="${s.cls}" style="width:${pct(s.value, total).toFixed(2)}%" title="${h(s.label)}: ${s.value}"></span>`).join("")}</div>
<div class="legend">${segments.map((s) => `<span><i class="${s.cls}"></i>${h(s.label)} <b>${s.value}</b></span>`).join("")}</div>`;

const runBar = bar([
  { label: "Lulus", value: stat.pass, cls: "s-pass" },
  { label: "Known defect", value: stat.known, cls: "s-known" },
  { label: "Gagal baru", value: stat.fail + stat.fixed + stat.flaky, cls: "s-fail" },
  { label: "Skip", value: stat.skip, cls: "s-skip" },
], stat.runs);
const sevBar = bar(SEV_ORDER.map((s) => ({ label: s, value: sevCount[s], cls: sevClass(s) })), findings.length);

const topFindings = findings.filter((f) => ["Critical", "High"].includes(f.severity))
  .map((f) => `<li><a href="#${f.id.toLowerCase()}" class="fid">${f.id}</a><span class="sev ${sevClass(f.severity)}">${f.severity}</span>${h(f.title)}</li>`).join("");

const projectRows = Object.entries(byProject).map(([p, s]) => `<tr><td>${PROJ_SHORT[p] || p} <span class="muted">(${p})</span></td><td class="num">${s.total}</td><td class="num">${s.pass}</td><td class="num">${s.known}</td><td class="num">${s.fail}</td><td class="num">${s.skip}</td><td class="num">${Math.round(s.dur / 1000)} dtk</td></tr>`).join("");

const featureRows = features.map((f) => {
  const seg = (v, cls) => (v ? `<span class="${cls}" style="width:${pct(v, f.total).toFixed(2)}%"></span>` : "");
  return `<tr class="clickable" data-feature="${f.code}" tabindex="0" title="Tampilkan test case ${f.code}">
<td class="mono">${f.code}</td><td>${h(f.name)}</td><td class="muted">${h(f.role)}</td><td class="num">${f.total}</td>
<td class="num">${f.pass}</td><td class="num">${f.known || ""}</td><td class="num">${f.skip || ""}</td>
<td><div class="minibar">${seg(f.pass, "s-pass")}${seg(f.known, "s-known")}${seg(f.fail, "s-fail")}${seg(f.skip, "s-skip")}</div></td></tr>`;
}).join("");

const catText = Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span class="chip static">${h(k)} <b>${v}</b></span>`).join("");

const findingCards = findings.map((f) => `<details class="finding" id="${f.id.toLowerCase()}" data-sev="${f.severity}">
<summary><span class="fid">${f.id}</span><span class="sev ${sevClass(f.severity)}">${f.severity}</span><span class="ftitle">${h(f.title)}</span>
<span class="fmeta">${h(f.component)} · ${VER_LABEL[f.verification]}</span></summary>
<div class="fbody">
<dl>
<dt>Fitur</dt><dd>${h(f.feature)}</dd>
<dt>Lokasi</dt><dd><code>${h(f.location)}</code></dd>
<dt>Verifikasi</dt><dd>${VER_LABEL[f.verification]}${f.verification === "CODE" ? " — tidak dieksploitasi agar data Supabase tidak berubah" : ""}</dd>
<dt>Input</dt><dd>${h(f.input)}</dd>
<dt>Expected</dt><dd>${h(f.expected)}</dd>
<dt>Actual</dt><dd class="actual-bad">${h(f.actual)}</dd>
<dt>Dampak</dt><dd>${h(f.impact)}</dd>
<dt>Rekomendasi</dt><dd>${h(f.recommendation)}</dd>
<dt>Langkah reproduksi</dt><dd><ol>${f.steps.map((s) => `<li>${h(s)}</li>`).join("")}</ol></dd>
<dt>Test terkait</dt><dd>${f.tests.length ? f.tests.map((t) => `<a class="chip" href="#tc-${t.toLowerCase()}" data-goto="${t}">${t}</a>`).join(" ") : '<span class="muted">—</span>'}</dd>
</dl></div></details>`).join("");

const caseRows = all.map((c) => {
  const runs = c.runs.map((r) => `<span class="run">${c.runs.length > 1 ? `<span class="muted">${PROJ_SHORT[r.project]}</span> ` : ""}${badge(runKind(r))}</span>`).join("");
  const bug = c.bug ? `<a class="chip bug" href="#${c.bug.toLowerCase()}">${c.bug}</a>` : "";
  const search = [c.id, c.title, c.category, c.feature, c.input, c.expected, c.actual.text, c.bug || ""].join(" ").toLowerCase();
  return `<tr class="case" id="tc-${c.id.toLowerCase()}" data-status="${c.status}" data-cat="${h(c.category)}" data-feature="${c.featureCode}" data-search="${h(search)}" tabindex="0" aria-expanded="false">
<td class="mono nowrap">${c.id}</td><td>${h(c.title)}<div class="muted small">${h(c.feature)}</div></td><td><span class="chip static">${h(c.category)}</span></td><td class="runs">${runs} ${bug}</td></tr>
<tr class="detail" hidden><td colspan="4"><div class="io">
<div><h4>Input</h4><p>${h(c.input)}</p></div>
<div><h4>Expected output</h4><p>${h(c.expected)}</p></div>
<div><h4>Actual output</h4><p class="${c.status === "known" || c.status === "fail" ? "actual-bad" : ""}">${h(c.actual.text)}</p>${c.actual.assert ? `<p class="assert"><span>assert</span> ${h(c.actual.assert)}</p>` : ""}</div>
</div><div class="muted small">File: <code>${h(c.file)}</code></div></td></tr>`;
}).join("");

const featureOptions = features.filter((f) => f.total).map((f) => `<option value="${f.code}">${f.code} — ${h(f.name)}</option>`).join("");
const catOptions = Object.keys(catCount).sort().map((c) => `<option>${h(c)}</option>`).join("");

const envRows = [
  ["Sistem operasi", env.os], ["Node.js", env.node],
  ["Frontend", `Next.js ${env.next} — build produksi (next build + next start :3100), React ${env.react}, TanStack Query ${env.tanstack}`],
  ["Backend (live API)", `${env.python}, FastAPI ${env.fastapi}, Uvicorn — http://127.0.0.1:8000, Supabase project development`],
  ["Test runner", `@playwright/test ${env.playwright}`], ["Browser", env.browser],
  ["Project / viewport", "desktop-chromium 1440×900 · mobile-chromium Pixel 7 (412×915, touch) · live-api (HTTP)"],
  ["Locale / zona waktu", "id-ID / Asia/Jakarta"], ["Workers", "2 paralel (batas stabil di mesin Windows ini)"],
  ["Data uji", "API backend di-mock di level jaringan (page.route) dengan data realistis yang meniru response FastAPI; tanggal relatif ke hari eksekusi"],
  ["Isolasi", "ui-avatars, Midtrans Snap, ImgBB dilayani stub lokal; font ikon Google dimuat dari jaringan"],
].map(([k, v]) => `<tr><th>${k}</th><td>${h(v)}</td></tr>`).join("");

const finalOk = stat.fail + stat.fixed + stat.flaky === 0;

const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Laporan Regression LangkahLegal</title>
<meta name="description" content="Laporan E2E & Regression Testing LangkahLegal — ${stat.cases} test case, ${findings.length} temuan">
<style>
:root{
  --bg:#f6f7f9; --surface:#ffffff; --surface-2:#f0f2f5; --text:#16181d; --muted:#5f6673; --border:#dfe3e8;
  --accent:#d9731f; --accent-soft:#fdf0e4; --link:#1d5fbf;
  --pass:#1f8a4c; --pass-soft:#e3f4ea; --known:#c2372e; --known-soft:#fbe7e5; --fail:#8e2bb4; --fail-soft:#f3e6f9; --skip:#8a919c; --skip-soft:#eceef1;
  --critical:#8f1d1d; --high:#d1452b; --medium:#c98a0b; --low:#4f6d8f;
  --radius:12px; --shadow:0 1px 2px rgba(16,24,40,.06),0 1px 3px rgba(16,24,40,.08);
  color-scheme: light;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#0f1115; --surface:#171a21; --surface-2:#1e222b; --text:#e7e9ee; --muted:#9aa3b2; --border:#2a2f3a;
    --accent:#f0954a; --accent-soft:#2f2216; --link:#79a8ff;
    --pass:#4cc38a; --pass-soft:#16291f; --known:#f0675d; --known-soft:#33191a; --fail:#c98bf0; --fail-soft:#2a1d33; --skip:#7d8592; --skip-soft:#22262e;
    --critical:#ff6b6b; --high:#ff8a5c; --medium:#f2c14e; --low:#8fb3d9; --shadow:none; color-scheme: dark;
  }
}
:root[data-theme="dark"]{
  --bg:#0f1115; --surface:#171a21; --surface-2:#1e222b; --text:#e7e9ee; --muted:#9aa3b2; --border:#2a2f3a;
  --accent:#f0954a; --accent-soft:#2f2216; --link:#79a8ff;
  --pass:#4cc38a; --pass-soft:#16291f; --known:#f0675d; --known-soft:#33191a; --fail:#c98bf0; --fail-soft:#2a1d33; --skip:#7d8592; --skip-soft:#22262e;
  --critical:#ff6b6b; --high:#ff8a5c; --medium:#f2c14e; --low:#8fb3d9; --shadow:none; color-scheme: dark;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:72px}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 "Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--link);text-decoration:none} a:hover{text-decoration:underline}
code{font-family:ui-monospace,"Cascadia Code",Consolas,monospace;font-size:.86em;background:var(--surface-2);padding:.1em .35em;border-radius:5px;word-break:break-word}
.wrap{max-width:1200px;margin:0 auto;padding:0 16px}
header.top{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--border)}
header.top .wrap{display:flex;align-items:center;gap:16px;height:56px}
.brand{font-weight:700;white-space:nowrap} .brand span{color:var(--accent)}
nav.toc{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;flex:1;min-width:0}
header.top #theme{margin-left:auto}
nav.toc a{color:var(--muted);padding:6px 10px;border-radius:8px;font-size:13.5px;white-space:nowrap}
nav.toc a:hover{background:var(--surface-2);color:var(--text);text-decoration:none}
.icon-btn{flex:none;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:8px;height:34px;padding:0 10px;cursor:pointer;font:inherit;font-size:13px}
.hero{padding:40px 0 8px}
.eyebrow{color:var(--accent);font-weight:600;font-size:13px;letter-spacing:.06em;text-transform:uppercase}
h1{font-size:clamp(26px,4vw,36px);line-height:1.15;margin:6px 0 10px;letter-spacing:-.01em}
.lede{color:var(--muted);max-width:760px;margin:0}
.meta{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:16px;color:var(--muted);font-size:13.5px}
.meta b{color:var(--text);font-weight:600}
.pill{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;font-weight:600;font-size:13px}
.pill.ok{background:var(--pass-soft);color:var(--pass)} .pill.warn{background:var(--fail-soft);color:var(--fail)}
section{padding:28px 0}
section>h2{font-size:21px;margin:0 0 4px;letter-spacing:-.01em}
.section-sub{color:var(--muted);margin:0 0 16px;font-size:14px}
.card{min-width:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:18px}
.grid-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;box-shadow:var(--shadow)}
.kpi-label{color:var(--muted);font-size:13px} .kpi-value{font-size:28px;font-weight:700;letter-spacing:-.02em;margin:2px 0;font-variant-numeric:tabular-nums}
.kpi-sub{color:var(--muted);font-size:12.5px}
.kpi.tone-pass .kpi-value{color:var(--pass)} .kpi.tone-known .kpi-value{color:var(--known)} .kpi.tone-fail .kpi-value{color:var(--fail)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.card h3{margin:0 0 12px;font-size:15px}
.bar{display:flex;height:14px;border-radius:999px;overflow:hidden;background:var(--surface-2);gap:2px}
.bar span{display:block;height:100%}
.legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;font-size:13px;color:var(--muted)}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.legend b{color:var(--text)}
.s-pass{background:var(--pass)} .s-known{background:var(--known)} .s-fail{background:var(--fail)} .s-skip{background:var(--skip)}
.sev-critical{background:var(--critical)} .sev-high{background:var(--high)} .sev-medium{background:var(--medium)} .sev-low{background:var(--low)}
ul.top-list{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:8px}
ul.top-list li{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.fid{font-family:ui-monospace,Consolas,monospace;font-weight:600;font-size:13px}
.sev{display:inline-block;color:#fff;font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:6px;letter-spacing:.02em}
.sev-medium{color:#1d1600}
:root[data-theme="dark"] .sev,:root[data-theme="dark"] .sev-medium{color:#111}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .sev{color:#111}}
.table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--border);vertical-align:top}
thead th{font-size:12.5px;color:var(--muted);font-weight:600;background:var(--surface-2);position:sticky;top:0}
tbody tr:last-child td{border-bottom:0}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
.mono{font-family:ui-monospace,Consolas,monospace;font-size:13px} .nowrap{white-space:nowrap}
.muted{color:var(--muted)} .small{font-size:12.5px}
tr.clickable{cursor:pointer} tr.clickable:hover td,tr.case:hover td{background:var(--surface-2)}
.minibar{display:flex;height:8px;border-radius:999px;overflow:hidden;background:var(--surface-2);min-width:90px}
.chip{display:inline-block;border:1px solid var(--border);background:var(--surface);color:var(--text);padding:2px 9px;border-radius:999px;font-size:12.5px;cursor:pointer;white-space:nowrap;font:inherit;font-size:12.5px}
.chip.static{cursor:default;background:var(--surface-2);border-color:transparent}
.chip.bug{border-color:color-mix(in srgb,var(--known) 40%,transparent);color:var(--known);font-family:ui-monospace,Consolas,monospace}
.chip[aria-pressed="true"]{background:var(--text);color:var(--bg);border-color:var(--text)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.badge{display:inline-block;font-size:12px;font-weight:600;padding:2px 8px;border-radius:6px;white-space:nowrap}
.badge.s-pass{background:var(--pass-soft);color:var(--pass)} .badge.s-known{background:var(--known-soft);color:var(--known)}
.badge.s-fail{background:var(--fail-soft);color:var(--fail)} .badge.s-skip{background:var(--skip-soft);color:var(--skip)}
.runs{white-space:nowrap} .run{display:inline-flex;gap:4px;align-items:center;margin:2px 8px 2px 0;font-size:12.5px}
.toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.toolbar input,.toolbar select{height:36px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:8px;padding:0 10px;font:inherit;font-size:14px}
.toolbar input{flex:1 1 220px;min-width:0}
.toolbar select{flex:0 1 auto;min-width:0;max-width:100%}
.count{color:var(--muted);font-size:13px;margin-left:auto}
details.finding{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px;box-shadow:var(--shadow)}
details.finding>summary{list-style:none;cursor:pointer;padding:12px 16px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
details.finding>summary::-webkit-details-marker{display:none}
details.finding>summary::before{content:"›";color:var(--muted);transition:transform .15s;display:inline-block}
details.finding[open]>summary::before{transform:rotate(90deg)}
.ftitle{font-weight:600;flex:1;min-width:220px} .fmeta{color:var(--muted);font-size:13px}
.fbody{padding:0 16px 16px 36px}
dl{display:grid;grid-template-columns:170px 1fr;gap:8px 16px;margin:0}
dt{color:var(--muted);font-size:13px} dd{margin:0} dd ol{margin:0;padding-left:18px}
.actual-bad{color:var(--known)}
tr.detail td{background:var(--surface-2)}
.io{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:8px}
.io h4{margin:0 0 4px;font-size:12.5px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.io p{margin:0}
.assert{margin-top:6px!important;font-family:ui-monospace,Consolas,monospace;font-size:12px;color:var(--muted);word-break:break-word}
.assert span{background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:0 4px;margin-right:4px}
.prose ol,.prose ul{padding-left:20px;margin:0} .prose li{margin:6px 0}
pre{max-width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:14px;overflow:auto;font-size:13px}
pre code{background:none;padding:0}
.env th{width:200px;color:var(--muted);font-weight:500;background:none}
footer{color:var(--muted);font-size:13px;padding:24px 0 40px;border-top:1px solid var(--border);margin-top:16px}
.empty{padding:24px;text-align:center;color:var(--muted)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (max-width:860px){
  .two{grid-template-columns:1fr} .io{grid-template-columns:1fr} dl{grid-template-columns:1fr} dt{margin-top:6px}
  .fbody{padding-left:16px} nav.toc{display:none} .runs{white-space:normal}
  .toolbar input,.toolbar select{flex:1 1 100%} .count{margin-left:0}
  th:nth-child(3),td:nth-child(3){display:none}
}
@media print{
  header.top,.toolbar,.icon-btn{display:none} body{background:#fff}
  details.finding{break-inside:avoid} tr.detail{display:table-row!important} .table-wrap,.card,.kpi{box-shadow:none}
}
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <div class="brand">Langkah<span>Legal</span> · QA</div>
  <nav class="toc" aria-label="Navigasi bagian">
    <a href="#ringkasan">Ringkasan</a><a href="#fitur">Fitur</a><a href="#temuan">Temuan</a><a href="#testcase">Test case</a><a href="#environment">Environment</a><a href="#metodologi">Metodologi</a><a href="#rekomendasi">Rekomendasi</a>
  </nav>
  <button class="icon-btn" id="theme" type="button" aria-label="Ganti tema">Tema</button>
</div></header>

<main class="wrap">
<div class="hero">
  <div class="eyebrow">Laporan E2E &amp; Regression Testing</div>
  <h1>LangkahLegal — ${stat.cases} test case, ${findings.length} temuan</h1>
  <p class="lede">Pengujian end-to-end, regression, edge case, negative, security, aksesibilitas, dan live API terhadap ${features.length} fitur platform konsultasi hukum (Next.js ${env.next} + FastAPI + Supabase).</p>
  <div class="meta">
    <span><span class="pill ${finalOk ? "ok" : "warn"}">${finalOk ? "Suite hijau" : "Ada kegagalan baru"}</span></span>
    <span>Eksekusi <b>${h(env.startedText)}</b></span>
    <span>Durasi <b>${env.durationMin} menit</b></span>
    <span>Tool <b>Playwright ${env.playwright}</b></span>
  </div>
</div>

<section id="ringkasan">
  <h2>Ringkasan</h2>
  <p class="section-sub">${finalOk ? "Semua kegagalan adalah defect aplikasi yang sudah terdokumentasi; tidak ada kegagalan tak terduga." : "Ada kegagalan yang belum tercatat sebagai defect — tinjau test berstatus 'Gagal baru'."}</p>
  <div class="grid-kpi">${kpiHtml}</div>
  <div class="two">
    <div class="card"><h3>Hasil ${stat.runs} eksekusi</h3>${runBar}</div>
    <div class="card"><h3>${findings.length} temuan per severity</h3>${sevBar}</div>
  </div>
  <div class="card" style="margin-top:12px">
    <h3>Temuan paling kritis</h3>
    <ul class="top-list">${topFindings}</ul>
  </div>
  <div class="table-wrap" style="margin-top:12px">
    <table><thead><tr><th>Project</th><th class="num">Eksekusi</th><th class="num">Lulus</th><th class="num">Known defect</th><th class="num">Gagal baru</th><th class="num">Skip</th><th class="num">Durasi</th></tr></thead>
    <tbody>${projectRows}</tbody></table>
  </div>
</section>

<section id="fitur">
  <h2>Lingkup &amp; daftar fitur</h2>
  <p class="section-sub">Klik baris fitur untuk melihat test case-nya. Status dihitung per test case (gabungan semua project).</p>
  <div class="table-wrap">
    <table><thead><tr><th>Kode</th><th>Fitur</th><th>Role</th><th class="num">TC</th><th class="num">Lulus</th><th class="num">Defect</th><th class="num">Skip</th><th>Proporsi</th></tr></thead>
    <tbody>${featureRows}</tbody>
    <tfoot><tr><th></th><th>Total</th><th></th><th class="num">${stat.cases}</th><th class="num">${stat.casePass}</th><th class="num">${stat.caseKnown}</th><th class="num">${stat.caseSkip}</th><th></th></tr></tfoot></table>
  </div>
  <p class="section-sub" style="margin-top:12px">Kategori test case</p>
  <div class="chips">${catText}</div>
</section>

<section id="temuan">
  <h2>Temuan (findings)</h2>
  <p class="section-sub">${findings.length} defect — klik kartu untuk detail input, expected, actual, dampak, dan rekomendasi.</p>
  <div class="toolbar" role="group" aria-label="Filter severity">
    <button class="chip" type="button" data-sev="all" aria-pressed="true">Semua <b>${findings.length}</b></button>
    ${SEV_ORDER.map((s) => `<button class="chip" type="button" data-sev="${s}" aria-pressed="false">${s} <b>${sevCount[s]}</b></button>`).join("")}
    <button class="icon-btn" type="button" id="toggle-findings" style="margin-left:auto">Buka semua</button>
  </div>
  <div id="findings">${findingCards}</div>
</section>

<section id="testcase">
  <h2>Detail test case</h2>
  <p class="section-sub">Klik baris untuk melihat input, expected output, dan actual output.</p>
  <div class="toolbar">
    <input type="search" id="q" placeholder="Cari ID, skenario, input, bug…" aria-label="Cari test case">
    <select id="f-status" aria-label="Filter status"><option value="">Semua status</option><option value="pass">Lulus</option><option value="known">Known defect</option><option value="fail">Gagal baru</option><option value="skip">Skip</option></select>
    <select id="f-cat" aria-label="Filter kategori"><option value="">Semua kategori</option>${catOptions}</select>
    <select id="f-feature" aria-label="Filter fitur"><option value="">Semua fitur</option>${featureOptions}</select>
    <button class="icon-btn" type="button" id="reset">Reset</button>
    <button class="icon-btn" type="button" id="expand">Buka semua</button>
    <span class="count" id="count" aria-live="polite"></span>
  </div>
  <div class="table-wrap">
    <table id="cases"><thead><tr><th>ID</th><th>Skenario</th><th>Tipe</th><th>Status</th></tr></thead>
    <tbody>${caseRows}</tbody></table>
    <div class="empty" id="empty" hidden>Tidak ada test case yang cocok dengan filter.</div>
  </div>
</section>

<section id="environment">
  <h2>Test environment</h2>
  <p class="section-sub">Konfigurasi saat laporan ini dihasilkan.</p>
  <div class="table-wrap"><table class="env"><tbody>${envRows}</tbody></table></div>
</section>

<section id="metodologi">
  <h2>Strategi &amp; metodologi</h2>
  <div class="two">
    <div class="card prose"><ol>
      <li><b>Inventaris fitur</b> dari kode sumber (<code>src/app</code>, <code>src/services</code>, <code>backend/routers</code>) menjadi ${features.length} fitur.</li>
      <li><b>E2E UI (mocked backend)</b> — build produksi frontend dijalankan di browser; seluruh panggilan <code>/api/v1/*</code> dicegat <code>MockApi</code> sehingga skenario sukses, error 4xx/5xx, data kosong, data rusak, dan race condition dapat direproduksi. Setiap test memverifikasi UI dan payload request.</li>
      <li><b>Regression</b> — defect terkonfirmasi ditandai <code>knownDefect()</code>; suite tetap hijau dan otomatis memberi tahu bila defect sudah diperbaiki. <code>E2E_STRICT=1</code> menonaktifkan penanda ini.</li>
      <li><b>Edge case &amp; negative</b> — input ekstrem (500 karakter, emoji, XSS, SQL), file besar/berbahaya, klik ganda, token kedaluwarsa, data null, localStorage rusak, clock mocking.</li>
      <li><b>Live API non-destruktif</b> ke backend FastAPI + Supabase; <b>code review</b> untuk logika berisiko yang tidak aman dieksploitasi.</li>
    </ol></div>
    <div class="card">
      <h3>Definisi severity</h3>
      <table><tbody>
        <tr><td><span class="sev sev-critical">Critical</span></td><td>Kompromi keamanan/akses penuh atau kehilangan data; wajib diperbaiki sebelum rilis.</td></tr>
        <tr><td><span class="sev sev-high">High</span></td><td>Fitur inti tidak berfungsi atau celah keamanan signifikan tanpa workaround.</td></tr>
        <tr><td><span class="sev sev-medium">Medium</span></td><td>Fungsi terganggu / risiko keamanan terbatas, ada workaround.</td></tr>
        <tr><td><span class="sev sev-low">Low</span></td><td>Masalah UX, konsistensi, aksesibilitas, atau validasi minor.</td></tr>
      </tbody></table>
    </div>
  </div>
  <div class="card prose" style="margin-top:12px">
    <h3>Batasan pengujian</h3>
    <ul>
      <li>Akun uji sungguhan belum tersedia (<code>.env.e2e</code> kosong) — alur terautentikasi terhadap Supabase asli diuji lewat mock berkontrak response asli; LIVE-020/021 dilewati.</li>
      <li>Eksploitasi destruktif tidak dilakukan pada database bersama (BUG-01 &amp; BUG-04 via code review; BUG-03 diverifikasi live memakai ID yang tidak ada).</li>
      <li>Midtrans memakai stub Snap; email OTP dan kualitas jawaban AI di luar cakupan. Hanya Chromium yang terpasang.</li>
      <li>Di mesin Windows ini, lebih dari 2 worker paralel membuat aset <code>/_next/static</code> menggantung (masalah environment).</li>
    </ul>
  </div>
</section>

<section id="rekomendasi">
  <h2>Rekomendasi prioritas</h2>
  <div class="card prose"><ol>
    <li><b>Segera (sebelum rilis):</b> <a href="#bug-01">BUG-01</a> whitelist role &amp; larang eskalasi admin, <a href="#bug-03">BUG-03</a> autentikasi toggle jadwal, <a href="#bug-04">BUG-04</a> state machine status konsultasi, <a href="#bug-02">BUG-02</a> halaman buat password.</li>
    <li><b>Sprint berikutnya:</b> role guard terpusat (BUG-05/06), validasi <code>next</code> (BUG-07), serta seluruh temuan Medium lain.</li>
    <li><b>Backlog kualitas:</b> temuan Low — UX, konsistensi validasi, aksesibilitas, performa aset.</li>
    <li>Jalankan <code>npm run test:regression</code> di GitHub Actions pada setiap PR dan isi <code>.env.e2e</code> dengan akun uji khusus.</li>
  </ol>
  <h3 style="margin-top:16px">Cara menjalankan ulang</h3>
<pre><code>cd frontend
npm run build                   # suite memakai build produksi (next start :3100)
npm run test:regression         # E2E + regression UI (desktop + mobile)
npm run test:live-api           # live API (backend harus jalan di :8000)
npm run test:regression:report  # buat ulang laporan Markdown + HTML</code></pre>
  <p class="muted small">Trace &amp; screenshot kegagalan: <a href="../e2e/results/regression-html/index.html">HTML report Playwright</a> · Versi Markdown: <a href="E2E_REGRESSION_REPORT.md">E2E_REGRESSION_REPORT.md</a></p>
  </div>
</section>
</main>

<footer><div class="wrap">Dibuat otomatis oleh <code>generate-report-html.js</code> dari hasil eksekusi Playwright · ${h(env.startedText)}</div></footer>

<script>
(() => {
  const root = document.documentElement;
  const themeBtn = document.getElementById("theme");
  const stored = (() => { try { return localStorage.getItem("ll-report-theme"); } catch { return null; } })();
  if (stored) root.dataset.theme = stored;
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const label = () => { themeBtn.textContent = isDark() ? "Tema terang" : "Tema gelap"; };
  label();
  themeBtn.addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("ll-report-theme", root.dataset.theme); } catch {}
    label();
  });

  // Findings: filter severity & buka semua
  const cards = [...document.querySelectorAll("details.finding")];
  document.querySelectorAll("[data-sev]").forEach((btn) => {
    if (btn.tagName !== "BUTTON") return;
    btn.addEventListener("click", () => {
      document.querySelectorAll("button[data-sev]").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      const s = btn.dataset.sev;
      cards.forEach((c) => { c.hidden = s !== "all" && c.dataset.sev !== s; });
    });
  });
  const tf = document.getElementById("toggle-findings");
  tf.addEventListener("click", () => {
    const open = tf.textContent === "Buka semua";
    cards.forEach((c) => { if (!c.hidden) c.open = open; });
    tf.textContent = open ? "Tutup semua" : "Buka semua";
  });

  // Test case: filter, pencarian, expand
  const rows = [...document.querySelectorAll("tr.case")];
  const q = document.getElementById("q"), fs = document.getElementById("f-status"), fc = document.getElementById("f-cat"), ff = document.getElementById("f-feature");
  const count = document.getElementById("count"), empty = document.getElementById("empty");
  const toggleRow = (row, open) => {
    const d = row.nextElementSibling;
    const next = open ?? d.hidden;
    d.hidden = !next || row.hidden;
    row.setAttribute("aria-expanded", String(next));
  };
  function apply() {
    const term = q.value.trim().toLowerCase();
    let n = 0;
    rows.forEach((r) => {
      const ok = (!term || r.dataset.search.includes(term)) && (!fs.value || r.dataset.status === fs.value) && (!fc.value || r.dataset.cat === fc.value) && (!ff.value || r.dataset.feature === ff.value);
      r.hidden = !ok;
      r.nextElementSibling.hidden = !ok || r.getAttribute("aria-expanded") !== "true";
      if (ok) n++;
    });
    count.textContent = n + " dari " + rows.length + " test case";
    empty.hidden = n !== 0;
  }
  [q, fs, fc, ff].forEach((el) => el.addEventListener("input", apply));
  document.getElementById("reset").addEventListener("click", () => { q.value = fs.value = fc.value = ff.value = ""; apply(); });
  const ex = document.getElementById("expand");
  ex.addEventListener("click", () => {
    const open = ex.textContent === "Buka semua";
    rows.forEach((r) => { if (!r.hidden) toggleRow(r, open); });
    ex.textContent = open ? "Tutup semua" : "Buka semua";
  });
  rows.forEach((r) => {
    r.addEventListener("click", (e) => { if (!e.target.closest("a")) toggleRow(r); });
    r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleRow(r); } });
  });

  // Klik fitur → filter test case
  document.querySelectorAll("tr.clickable").forEach((tr) => {
    const go = () => { q.value = fs.value = fc.value = ""; ff.value = tr.dataset.feature; apply(); document.getElementById("testcase").scrollIntoView(); };
    tr.addEventListener("click", go);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  });

  // Lompat ke test case dari kartu temuan / hash
  function reveal(id) {
    const row = document.getElementById("tc-" + id.toLowerCase());
    if (!row) return;
    q.value = fs.value = fc.value = ff.value = ""; apply();
    toggleRow(row, true);
    row.scrollIntoView({ block: "center" });
    row.focus({ preventScroll: true });
  }
  document.querySelectorAll("a[data-goto]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); reveal(a.dataset.goto); }));
  function fromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id.startsWith("tc-")) reveal(id.slice(3));
    else if (id.startsWith("bug-")) { const c = document.getElementById(id); if (c) { c.hidden = false; c.open = true; } }
  }
  addEventListener("hashchange", fromHash);
  apply(); fromHash();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html, "utf8");
console.log(`Laporan HTML ditulis ke ${OUT} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
