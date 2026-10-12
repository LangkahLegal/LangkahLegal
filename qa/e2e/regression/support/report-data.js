/**
 * Pengumpul data laporan E2E & Regression — dipakai bersama oleh
 * generate-report.js (Markdown) dan generate-report-html.js (HTML).
 *
 * Sumber: e2e/results/regression-results.json (JSON reporter Playwright),
 * anotasi test dari helper tc()/knownDefect(), dan findings.js.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../../..");
const RESULTS = path.join(ROOT, "e2e/results/regression-results.json");

const FEATURES = {
  F01: ["Landing Page", "Publik"], F02: ["Halaman Informasi Publik (About/Privacy/Terms/Compliance)", "Publik"],
  F03: ["Login Email & Password", "Semua"], F04: ["Login Google (OAuth)", "Semua"], F05: ["Pemilihan Role", "Tamu"],
  F06: ["Registrasi (Signup)", "Tamu"], F07: ["Verifikasi OTP Email", "Tamu"], F08: ["Lupa Password", "Semua"],
  F09: ["Reset Password via Link", "Semua"], F10: ["Buat Password (akun OAuth)", "Semua"], F11: ["OAuth Callback", "Semua"],
  F12: ["Proteksi Route & Role Guard", "Semua"], F13: ["Dashboard Client", "Client"], F14: ["Katalog Konsultan (Explore)", "Client/Tamu"],
  F15: ["Detail Konsultan & Booking", "Client"], F16: ["Pembayaran (Midtrans Snap)", "Client"], F17: ["Riwayat Konsultasi Client", "Client"],
  F18: ["Detail Konsultasi (Zoom & Ulasan)", "Client/Konsultan"], F19: ["Posting Kasus Anonim (Bursa)", "Client"],
  F20: ["Dashboard Konsultan", "Konsultan"], F21: ["Detail Permintaan Konsultasi (Terima/Tolak/Jadwalkan)", "Konsultan"],
  F22: ["Daftar Klien Aktif", "Konsultan"], F23: ["Kelola Jadwal Ketersediaan", "Konsultan"], F24: ["Bursa Kasus (Klaim)", "Konsultan"],
  F25: ["Riwayat Sesi Konsultan", "Konsultan"], F26: ["Tanya AI (Chatbot Hukum RAG)", "Semua"], F27: ["Pengaturan Akun (Tema & Logout)", "Semua"],
  F28: ["Edit Profil (Client & Konsultan)", "Semua"], F29: ["Keamanan & Ganti Kata Sandi", "Semua"], F30: ["Pengaturan Bahasa", "Semua"],
  F31: ["Tentang Aplikasi", "Semua"], F32: ["Dashboard Admin", "Admin"], F33: ["Verifikasi Konsultan", "Admin"],
  F34: ["Knowledge Base Dokumen Hukum", "Admin"], F35: ["Manajemen Sesi & Refresh Token", "Semua"], F36: ["Kontrak & Keamanan API Backend (Live)", "Sistem"],
};

const SEV_ORDER = ["Critical", "High", "Medium", "Low"];
const VER_LABEL = { "UI-E2E": "Test UI E2E", "LIVE-API": "Live API", CODE: "Code review" };
const PROJ_SHORT = { "desktop-chromium": "Desktop", "mobile-chromium": "Mobile", "live-api": "Live API" };

const stripAnsi = (s = "") => s.replace(/\u001b\[[0-9;]*m/g, "");
const sh = (cmd) => { try { return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return "n/a"; } };

/** Kategori hasil satu eksekusi: pass | known | fail | fixed | flaky | skip */
function runKind(run) {
  if (run.status === "skipped") return "skip";
  if (run.outcome === "flaky") return "flaky";
  if (run.expectedStatus === "failed" && run.outcome === "expected") return "known";
  if (run.expectedStatus === "failed" && run.outcome === "unexpected") return "fixed";
  if (run.outcome === "unexpected") return "fail";
  return "pass";
}
const RUN_LABEL = { pass: "✅ PASS", known: "❌ FAIL (known defect)", fail: "❌ FAIL", fixed: "⚠️ LULUS (defect diperbaiki?)", flaky: "⚠️ FLAKY", skip: "⏭️ SKIP" };
const runLabel = (run) => RUN_LABEL[runKind(run)];

/** Status gabungan satu test case lintas project: pass | known | fail | skip */
function caseStatus(c) {
  const kinds = c.runs.map(runKind);
  if (kinds.includes("known")) return "known";
  if (kinds.some((k) => k === "fail" || k === "fixed" || k === "flaky")) return "fail";
  if (kinds.every((k) => k === "skip")) return "skip";
  return "pass";
}

function summarizeError(msg) {
  if (!msg) return "";
  const lines = msg.split("\n").map((l) => l.trim()).filter(Boolean);
  const custom = lines[0].startsWith("Error: ") && !/expect\(/.test(lines[0]) ? lines[0].replace(/^Error: /, "") : null;
  const pick = lines.filter((l) => /^(Expected|Received|Locator)/.test(l)).slice(0, 3).join(" · ");
  return (custom ? `${custom}${pick ? " · " + pick : ""}` : pick || lines[0]).slice(0, 260);
}

/** Actual output satu test case → { text, assert } (assert = ringkasan pesan assertion bila gagal). */
function actualParts(c, findings) {
  const run = c.runs.find((r) => r.expectedStatus === "failed" || r.outcome === "unexpected") || c.runs[0];
  const kind = runKind(run);
  const finding = c.bug && findings.find((f) => f.id === c.bug);
  if (kind === "pass") return { text: `Sesuai expected${run.actualAnn ? ` — ${run.actualAnn}` : ""}`, assert: "" };
  if (kind === "skip") return { text: `Tidak dijalankan: ${run.skipReason || "prasyarat tidak terpenuhi"}`, assert: "" };
  const err = summarizeError(run.error);
  if (finding) return { text: finding.actual, assert: err };
  return { text: run.actualAnn || err || "Gagal", assert: "" };
}

const featureCode = (feature) => (feature.match(/F\d{2}/) || [])[0] || "";
const matchesFeature = (c, code) => c.feature.startsWith(code + " ") || c.feature.includes(code + "/") || c.feature === code;
const featureKey = (f) => { const m = f.match(/F(\d+)/); return m ? Number(m[1]) : 999; };

function buildReportData() {
  const findings = require("./findings.js");
  const report = JSON.parse(fs.readFileSync(RESULTS, "utf8"));

  // ─── Hasil per test case (gabung lintas project) ─────────────────────────
  const cases = new Map();
  const walk = (suite, file) => {
    const f = suite.file || file;
    (suite.specs || []).forEach((spec) => {
      const id = spec.title.split(" ")[0];
      spec.tests.forEach((t) => {
        const r = t.results[t.results.length - 1] || {};
        const ann = [...(t.annotations || []), ...(r.annotations || [])];
        const get = (type) => ann.find((a) => a.type === type)?.description;
        if (!cases.has(id)) {
          cases.set(id, {
            id, title: spec.title.replace(/^\S+\s/, "").replace(/\s@\S+/g, "").trim(), file: f,
            feature: get("feature") || "-", category: get("category") || "-", input: get("input") || "-",
            expected: get("expected") || "-", bug: get("bug"), runs: [],
          });
        }
        const c = cases.get(id);
        c.bug = c.bug || get("bug");
        c.runs.push({
          project: t.projectName, status: r.status, expectedStatus: t.expectedStatus, outcome: t.status,
          duration: r.duration || 0, error: stripAnsi(r.error?.message || ""),
          actualAnn: [...new Set(ann.filter((a) => a.type === "actual").map((a) => a.description))].join("; "),
          skipReason: ann.find((a) => a.type === "skip")?.description,
        });
      });
    });
    (suite.suites || []).forEach((s) => walk(s, f));
  };
  report.suites.forEach((s) => walk(s, s.file));

  const all = [...cases.values()].sort((a, b) => featureKey(a.feature) - featureKey(b.feature) || a.id.localeCompare(b.id, undefined, { numeric: true }));
  for (const c of all) {
    c.status = caseStatus(c);
    c.actual = actualParts(c, findings);
    c.featureCode = featureCode(c.feature);
  }

  // ─── Statistik ───────────────────────────────────────────────────────────
  const runs = all.flatMap((c) => c.runs);
  const countKind = (k) => runs.filter((r) => runKind(r) === k).length;
  const stat = {
    cases: all.length, runs: runs.length,
    pass: countKind("pass"), known: countKind("known"), fail: countKind("fail"),
    fixed: countKind("fixed"), flaky: countKind("flaky"), skip: countKind("skip"),
    casePass: all.filter((c) => c.status === "pass").length,
    caseKnown: all.filter((c) => c.status === "known").length,
    caseSkip: all.filter((c) => c.status === "skip").length,
    caseFail: all.filter((c) => c.status === "fail").length,
  };
  stat.passRate = stat.runs - stat.skip ? (stat.pass / (stat.runs - stat.skip)) * 100 : 0;

  const byProject = {};
  for (const r of runs) {
    const p = (byProject[r.project] ||= { total: 0, pass: 0, known: 0, fail: 0, skip: 0, dur: 0 });
    p.total++; p.dur += r.duration;
    const k = runKind(r);
    if (k === "pass") p.pass++; else if (k === "known") p.known++; else if (k === "skip") p.skip++; else p.fail++;
  }

  const features = Object.entries(FEATURES).map(([code, [name, role]]) => {
    const cs = all.filter((c) => matchesFeature(c, code));
    const n = (s) => cs.filter((c) => c.status === s).length;
    return { code, name, role, total: cs.length, pass: n("pass"), known: n("known"), skip: n("skip"), fail: n("fail") };
  });

  const sevCount = Object.fromEntries(SEV_ORDER.map((s) => [s, findings.filter((f) => f.severity === s).length]));
  const sortedFindings = [...findings].sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity) || a.id.localeCompare(b.id));
  const catCount = all.reduce((m, c) => ((m[c.category] = (m[c.category] || 0) + 1), m), {});

  // ─── Environment ─────────────────────────────────────────────────────────
  const ver = (p) => { try { return require(path.join(ROOT, "node_modules", p, "package.json")).version; } catch { return "n/a"; } };
  const started = new Date(report.stats?.startTime || Date.now());
  const env = {
    os: `${os.type()} ${os.release()} (${os.arch()}), ${os.cpus().length} CPU, RAM ${(os.totalmem() / 1024 ** 3).toFixed(1)} GB`,
    node: process.version,
    next: ver("next"), react: ver("react"), tanstack: ver("@tanstack/react-query"),
    playwright: report.config?.version || ver("@playwright/test"),
    python: sh("python --version"),
    fastapi: sh('python -c "import fastapi;print(fastapi.__version__)"'),
    browser: (() => { try { const b = require(path.join(ROOT, "node_modules/playwright-core/browsers.json")).browsers.find((x) => x.name === "chromium-headless-shell" || x.name === "chromium"); return `Chromium ${b.browserVersion} (headless shell, revisi ${b.revision})`; } catch { return "Chromium"; } })(),
    started,
    startedText: started.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full", timeStyle: "short" }) + " WIB",
    durationMin: ((report.stats?.duration || 0) / 60000).toFixed(1),
  };

  return { ROOT, FEATURES, SEV_ORDER, VER_LABEL, PROJ_SHORT, findings: sortedFindings, all, runs, stat, byProject, features, sevCount, catCount, env };
}

module.exports = { buildReportData, runKind, runLabel, RUN_LABEL };
