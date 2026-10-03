/**
 * Generator laporan Markdown E2E & Regression Testing LangkahLegal.
 *
 * Pemakaian:
 *   npx playwright test -c playwright.regression.config.js      # menghasilkan results JSON
 *   node tests/e2e/regression/support/generate-report.js [output.md]
 *
 * Sumber data:
 *   - tests/e2e/results/regression-results.json (JSON reporter Playwright)
 *   - anotasi test (feature, category, input, expected, bug, actual) via helper tc()
 *   - findings.js (daftar defect + severity)
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../../../..");
const RESULTS = path.join(ROOT, "tests/e2e/results/regression-results.json");
const OUT = path.resolve(process.argv[2] || path.join(ROOT, "..", "E2E_REGRESSION_REPORT.md"));
const findings = require("./findings.js");
const report = JSON.parse(fs.readFileSync(RESULTS, "utf8"));

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

const esc = (s = "") => String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
const stripAnsi = (s = "") => s.replace(/\u001b\[[0-9;]*m/g, "");
const sh = (cmd) => { try { return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return "n/a"; } };

// ─── Kumpulkan hasil per test case (gabung lintas project) ─────────────────
const cases = new Map();
const walk = (suite, file) => {
  const f = suite.file || file;
  (suite.specs || []).forEach((spec) => {
    const id = spec.title.split(" ")[0];
    spec.tests.forEach((t) => {
      const ann = [...(t.annotations || []), ...((t.results[t.results.length - 1] || {}).annotations || [])];
      const get = (type) => ann.find((a) => a.type === type)?.description;
      const r = t.results[t.results.length - 1] || {};
      if (!cases.has(id)) {
        cases.set(id, {
          id, title: spec.title.replace(/^\S+\s/, "").replace(/\s@\S+/g, "").trim(), file: f,
          feature: get("feature") || "-", category: get("category") || "-", input: get("input") || "-",
          expected: get("expected") || "-", bug: get("bug"), runs: [],
        });
      }
      const c = cases.get(id);
      c.bug = c.bug || get("bug");
      const actualAnn = [...new Set(ann.filter((a) => a.type === "actual").map((a) => a.description))].join("; ");
      const skipReason = ann.find((a) => a.type === "skip")?.description;
      c.runs.push({
        project: t.projectName, status: r.status, expectedStatus: t.expectedStatus, outcome: t.status,
        duration: r.duration || 0, error: stripAnsi(r.error?.message || ""), actualAnn, skipReason,
      });
    });
  });
  (suite.suites || []).forEach((s) => walk(s, f));
};
report.suites.forEach((s) => walk(s, s.file));

const runLabel = (run) => {
  if (run.status === "skipped") return "⏭️ SKIP";
  if (run.outcome === "flaky") return "⚠️ FLAKY";
  if (run.expectedStatus === "failed" && run.outcome === "expected") return "❌ FAIL (known defect)";
  if (run.expectedStatus === "failed" && run.outcome === "unexpected") return "⚠️ LULUS (defect diperbaiki?)";
  if (run.outcome === "unexpected") return "❌ FAIL";
  return "✅ PASS";
};
const caseStatus = (c) => {
  const labels = c.runs.map(runLabel);
  if (labels.some((l) => l === "❌ FAIL (known defect)")) return "known";
  if (labels.some((l) => l === "❌ FAIL" || l.startsWith("⚠️"))) return "fail";
  if (labels.every((l) => l.startsWith("⏭️"))) return "skip";
  return "pass";
};
const projShort = { "desktop-chromium": "Desktop", "mobile-chromium": "Mobile", "live-api": "Live API" };

function summarizeError(msg) {
  if (!msg) return "";
  const lines = msg.split("\n").map((l) => l.trim()).filter(Boolean);
  const custom = lines[0].startsWith("Error: ") && !/expect\(/.test(lines[0]) ? lines[0].replace(/^Error: /, "") : null;
  const pick = lines.filter((l) => /^(Expected|Received|Locator)/.test(l)).slice(0, 3).join(" · ");
  return (custom ? `${custom}${pick ? " · " + pick : ""}` : pick || lines[0]).slice(0, 260);
}

function actualOutput(c) {
  const run = c.runs.find((r) => r.expectedStatus === "failed" || r.outcome === "unexpected") || c.runs[0];
  const label = runLabel(run);
  const finding = c.bug && findings.find((f) => f.id === c.bug);
  if (label.startsWith("✅")) return `Sesuai expected${run.actualAnn ? ` — ${run.actualAnn}` : ""}`;
  if (label.startsWith("⏭️")) return `Tidak dijalankan: ${run.skipReason || "prasyarat tidak terpenuhi"}`;
  const err = summarizeError(run.error);
  if (finding) return `${finding.actual}${err ? ` _(assert: ${err})_` : ""}`;
  return run.actualAnn || err || "Gagal";
}

const statusCell = (c) => c.runs.map((r) => `${c.runs.length > 1 ? projShort[r.project] + ": " : ""}${runLabel(r)}${r.expectedStatus === "failed" && c.bug ? ` [${c.bug}](#${c.bug.toLowerCase()})` : ""}`).join("<br>");

// ─── Statistik ─────────────────────────────────────────────────────────────
const all = [...cases.values()];
const runs = all.flatMap((c) => c.runs);
const count = (pred) => runs.filter(pred).length;
const stat = {
  cases: all.length,
  runs: runs.length,
  pass: count((r) => runLabel(r).startsWith("✅")),
  known: count((r) => runLabel(r) === "❌ FAIL (known defect)"),
  fail: count((r) => runLabel(r) === "❌ FAIL"),
  fixed: count((r) => runLabel(r).startsWith("⚠️ LULUS")),
  flaky: count((r) => runLabel(r) === "⚠️ FLAKY"),
  skip: count((r) => r.status === "skipped"),
};
const byProject = {};
for (const r of runs) {
  const p = (byProject[r.project] ||= { total: 0, pass: 0, known: 0, fail: 0, skip: 0, dur: 0 });
  p.total++; p.dur += r.duration;
  const l = runLabel(r);
  if (l.startsWith("✅")) p.pass++; else if (l === "❌ FAIL (known defect)") p.known++; else if (r.status === "skipped") p.skip++; else p.fail++;
}
const sevOrder = ["Critical", "High", "Medium", "Low"];
const sevCount = Object.fromEntries(sevOrder.map((s) => [s, findings.filter((f) => f.severity === s).length]));
const catCount = all.reduce((m, c) => ((m[c.category] = (m[c.category] || 0) + 1), m), {});

// ─── Environment ───────────────────────────────────────────────────────────
const pkg = require(path.join(ROOT, "package.json"));
const nextVer = require(path.join(ROOT, "node_modules/next/package.json")).version;
const pwVer = report.config?.version || require(path.join(ROOT, "node_modules/@playwright/test/package.json")).version;
const reactVer = require(path.join(ROOT, "node_modules/react/package.json")).version;
const tqVer = require(path.join(ROOT, "node_modules/@tanstack/react-query/package.json")).version;
const pyVer = sh("python --version");
const fastapiVer = sh('python -c "import fastapi;print(fastapi.__version__)"');
const chromiumDir = (() => { try { const b = require(path.join(ROOT, "node_modules/playwright-core/browsers.json")).browsers.find((x) => x.name === "chromium-headless-shell" || x.name === "chromium"); return `Chromium ${b.browserVersion} (headless shell, revisi ${b.revision})`; } catch { return "Chromium"; } })();
const started = new Date(report.stats?.startTime || Date.now());
const durMin = ((report.stats?.duration || 0) / 60000).toFixed(1);
const fmtDate = (d) => d.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full", timeStyle: "short" }) + " WIB";

// ─── Susun Markdown ────────────────────────────────────────────────────────
const L = [];
const p = (...x) => L.push(...x);

p(`# Laporan E2E & Regression Testing — LangkahLegal`, "");
p(`| | |`, `|---|---|`,
  `| **Aplikasi** | LangkahLegal — platform konsultasi hukum (Next.js ${nextVer} + FastAPI + Supabase) |`,
  `| **Jenis pengujian** | End-to-End (UI) · Regression · Edge case · Negative · Security · Accessibility · Live API |`,
  `| **Tanggal eksekusi** | ${fmtDate(started)} |`,
  `| **Durasi eksekusi** | ${durMin} menit (${stat.runs} eksekusi test) |`,
  `| **Tool** | Playwright ${pwVer} (Chromium) |`,
  `| **Status akhir** | ${stat.fail === 0 ? "Suite regression hijau — semua kegagalan adalah defect yang sudah tercatat" : `${stat.fail} kegagalan baru perlu ditinjau`} |`, "");

p(`## 1. Ringkasan Eksekutif`, "");
p(`Seluruh fitur aplikasi (${Object.keys(FEATURES).length} fitur, 3 role + publik) diuji melalui **${stat.cases} test case** ` +
  `yang dieksekusi **${stat.runs} kali** pada 3 project (Desktop Chromium, Mobile Chromium/Pixel 7, Live API).`, "");
p(`| Metrik | Jumlah |`, `|---|---:|`,
  `| Test case unik | ${stat.cases} (✅ ${all.filter((c) => caseStatus(c) === "pass").length} lulus · ❌ ${all.filter((c) => caseStatus(c) === "known").length} known defect · ⏭️ ${all.filter((c) => caseStatus(c) === "skip").length} skip) |`, `| Total eksekusi (desktop + mobile + live) | ${stat.runs} |`,
  `| ✅ Lulus | ${stat.pass} |`, `| ❌ Gagal — defect terkonfirmasi (known defect) | ${stat.known} |`,
  `| ❌ Gagal — tidak terduga | ${stat.fail} |`, `| ⚠️ Flaky | ${stat.flaky} |`, `| ⚠️ Defect tampak sudah diperbaiki | ${stat.fixed} |`,
  `| ⏭️ Dilewati (butuh kredensial akun uji) | ${stat.skip} |`,
  `| **Pass rate eksekusi (tanpa skip)** | **${((stat.pass / (stat.runs - stat.skip)) * 100).toFixed(1)}%** — seluruh kegagalan adalah defect aplikasi yang terdokumentasi di Bagian 6 |`, "");
p(`**Temuan:** ${findings.length} defect — ` + sevOrder.map((s) => `**${sevCount[s]} ${s}**`).join(", ") + ".", "");
p(`Temuan paling kritis:`, "");
findings.filter((f) => ["Critical", "High"].includes(f.severity)).forEach((f) => p(`- **[${f.id}](#${f.id.toLowerCase()}) (${f.severity})** — ${f.title}.`));
p("");

p(`## 2. Lingkup & Daftar Fitur`, "");
p(`Status dihitung per test case (gabungan semua project): sebuah TC dihitung "Known defect" bila gagal sesuai temuan di salah satu project, "Skip" bila tidak dijalankan di project mana pun.`, "");
p(`| Kode | Fitur | Role | Jumlah TC | ✅ Lulus | ❌ Known defect | ⏭️ Skip |`, `|---|---|---|---:|---:|---:|---:|`);
const tot = { tc: 0, pass: 0, known: 0, skip: 0, fail: 0 };
for (const [code, [name, role]] of Object.entries(FEATURES)) {
  const cs = all.filter((c) => c.feature.startsWith(code + " ") || c.feature.includes(code + "/") || c.feature === code);
  const st = cs.map(caseStatus);
  const n = (k) => st.filter((x) => x === k).length;
  tot.tc += cs.length; tot.pass += n("pass"); tot.known += n("known"); tot.skip += n("skip"); tot.fail += n("fail");
  p(`| ${code} | ${name} | ${role} | ${cs.length} | ${n("pass")} | ${n("known")} | ${n("skip")} |`);
}
p(`| **Total** | | | **${tot.tc}** | **${tot.pass}** | **${tot.known}** | **${tot.skip}** |`);
p("", `Distribusi kategori test case: ` + Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} (${v})`).join(", ") + ".", "");

p(`## 3. Test Environment`, "");
p(`| Komponen | Detail |`, `|---|---|`,
  `| Sistem operasi | ${os.type()} ${os.release()} (${os.arch()}), ${os.cpus().length} CPU, RAM ${(os.totalmem() / 1024 ** 3).toFixed(1)} GB |`,
  `| Node.js | ${process.version} |`,
  `| Frontend | Next.js ${nextVer} (build produksi \`next build\` + \`next start\` port 3100), React ${reactVer}, TanStack Query ${tqVer} |`,
  `| Backend (live API) | ${pyVer}, FastAPI ${fastapiVer}, Uvicorn — \`http://127.0.0.1:8000\`, APP_ENV=development, Supabase project development |`,
  `| Test runner | @playwright/test ${pwVer} |`,
  `| Browser | ${chromiumDir} |`,
  `| Project / viewport | desktop-chromium 1440×900 · mobile-chromium Pixel 7 (412×915, touch) · live-api (HTTP request) |`,
  `| Locale / zona waktu | id-ID / Asia/Jakarta |`,
  `| Workers | 2 paralel (batas stabil di mesin Windows ini) |`,
  `| Data uji | API backend di-mock di level jaringan (\`page.route\`) dengan data realistis yang meniru response FastAPI; tanggal dihitung relatif ke hari eksekusi |`,
  `| Isolasi | Request eksternal (ui-avatars, Midtrans Snap, ImgBB) dilayani stub lokal; font ikon Google dimuat dari jaringan |`, "");

p(`## 4. Strategi & Metodologi`, "");
p(`1. **Inventaris fitur** dari kode sumber (\`src/app\`, \`src/services\`, \`backend/routers\`) → 36 fitur (lihat Bagian 2).`,
  `2. **E2E UI (mocked backend)** — frontend asli (build produksi) dijalankan di browser; seluruh panggilan \`/api/v1/*\` dicegat oleh lapisan \`MockApi\` sehingga skenario sukses, error 4xx/5xx, data kosong, data rusak, dan race condition dapat direproduksi secara deterministik. Setiap test memverifikasi **UI** sekaligus **payload request** yang dikirim ke backend (kontrak API).`,
  `3. **Regression** — suite dapat dijalankan ulang setiap perubahan (\`npm run test:regression\`). Defect yang sudah dikonfirmasi ditandai \`knownDefect()\` (\`test.fail\`) sehingga suite tetap hijau namun **otomatis memberi peringatan bila defect sudah diperbaiki** (status "LULUS (defect diperbaiki?)"). Mode \`E2E_STRICT=1\` menonaktifkan penanda ini.`,
  `4. **Edge case & negative** — input kosong/ekstrem (500 karakter, emoji, payload XSS & SQL), file terlalu besar / tipe berbahaya, klik ganda, token kedaluwarsa, data null, localStorage rusak, perubahan tanggal (clock mocking 31 Jan, jam 14:10), layanan pihak ketiga gagal.`,
  `5. **Live API** — pengujian **non-destruktif** langsung ke backend FastAPI + Supabase (endpoint publik, validasi, akses tanpa token/token palsu, CORS, webhook palsu, ID yang tidak ada). Tidak ada data produksi yang diubah.`,
  `6. **Code review terarah** untuk logika backend yang berisiko tetapi tidak aman dieksploitasi pada database bersama (ditandai verifikasi "Code review").`, "");
p(`**Definisi severity**`, "", `| Severity | Kriteria |`, `|---|---|`,
  `| Critical | Kompromi keamanan/akses penuh atau kehilangan data; harus diperbaiki sebelum rilis. |`,
  `| High | Fitur inti tidak berfungsi atau celah keamanan signifikan tanpa workaround. |`,
  `| Medium | Fungsi terganggu / risiko keamanan terbatas, ada workaround. |`,
  `| Low | Masalah UX, konsistensi, aksesibilitas, atau validasi minor. |`, "");

p(`## 5. Ringkasan Hasil per Project`, "");
p(`| Project | Eksekusi | ✅ Lulus | ❌ Known defect | ❌ Gagal baru | ⏭️ Skip | Durasi |`, `|---|---:|---:|---:|---:|---:|---:|`);
for (const [proj, s] of Object.entries(byProject)) p(`| ${proj} | ${s.total} | ${s.pass} | ${s.known} | ${s.fail} | ${s.skip} | ${(s.dur / 1000).toFixed(0)} dtk |`);
p("");

p(`## 6. Findings (Temuan Defect)`, "");
p(`| ID | Severity | Komponen | Fitur | Judul | Verifikasi | Test terkait |`, `|---|---|---|---|---|---|---|`);
const verLabel = { "UI-E2E": "Test UI E2E", "LIVE-API": "Live API", CODE: "Code review" };
for (const f of [...findings].sort((a, b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity) || a.id.localeCompare(b.id))) {
  p(`| [${f.id}](#${f.id.toLowerCase()}) | ${f.severity} | ${f.component} | ${esc(f.feature)} | ${esc(f.title)} | ${verLabel[f.verification]} | ${f.tests.join(", ") || "—"} |`);
}
p("");
for (const f of [...findings].sort((a, b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity) || a.id.localeCompare(b.id))) {
  p(`### ${f.id}`, "", `**${f.title}**`, "");
  p(`| Atribut | Detail |`, `|---|---|`,
    `| Severity | **${f.severity}** |`, `| Komponen | ${f.component} |`, `| Fitur | ${esc(f.feature)} |`,
    `| Lokasi | \`${esc(f.location)}\` |`, `| Verifikasi | ${verLabel[f.verification]}${f.verification === "CODE" ? " (tidak dieksploitasi agar data Supabase tidak berubah)" : ""} |`,
    `| Input | ${esc(f.input)} |`, `| Expected output | ${esc(f.expected)} |`, `| Actual output | ${esc(f.actual)} |`,
    `| Dampak | ${esc(f.impact)} |`, `| Rekomendasi | ${esc(f.recommendation)} |`,
    `| Test terkait | ${f.tests.length ? f.tests.map((t) => `[${t}](#tc-${t.toLowerCase()})`).join(", ") : "—"} |`, "");
  p(`Langkah reproduksi:`, ...f.steps.map((s, i) => `${i + 1}. ${s}`), "");
}

p(`## 7. Detail Test Case`, "");
p(`Kolom **Status** menampilkan hasil per project bila test dijalankan di lebih dari satu viewport. ` +
  `"FAIL (known defect)" berarti test gagal **sesuai temuan** yang tercatat di Bagian 6.`, "");
const groups = {};
for (const c of all) (groups[c.feature] ||= []).push(c);
const featureKey = (f) => { const m = f.match(/F(\d+)/); return m ? Number(m[1]) : 999; };
for (const feat of Object.keys(groups).sort((a, b) => featureKey(a) - featureKey(b) || a.localeCompare(b))) {
  p(`### ${feat}`, "");
  p(`| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |`, `|---|---|---|---|---|---|---|`);
  for (const c of groups[feat].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))) {
    p(`| <a id="tc-${c.id.toLowerCase()}"></a>${c.id} | ${esc(c.title)} | ${esc(c.category)} | ${esc(c.input)} | ${esc(c.expected)} | ${esc(actualOutput(c))} | ${statusCell(c)} |`);
  }
  p("");
}

p(`## 8. Batasan Pengujian`, "");
p(`- **Akun uji sungguhan tidak tersedia** (\`.env.e2e\` belum diisi): alur login/booking/pembayaran end-to-end terhadap Supabase asli tidak dijalankan; test LIVE-020/021 dilewati. Alur tersebut diuji penuh terhadap backend yang di-mock dengan kontrak response asli.`,
  `- **Eksploitasi destruktif tidak dilakukan** pada database bersama (BUG-01 & BUG-04 diverifikasi via code review; BUG-03 diverifikasi live memakai ID yang tidak ada).`,
  `- Pembayaran Midtrans memakai stub Snap (sukses/pending/gagal); integrasi sandbox Midtrans nyata, pengiriman email OTP, dan kualitas jawaban AI (RAG) berada di luar cakupan.`,
  `- Hanya engine Chromium yang terpasang; Firefox/WebKit (project lama \`playwright.config.js\`) belum dijalankan.`,
  `- Pada mesin Windows ini, lebih dari 2 worker paralel membuat aset \`/_next/static\` menggantung pada navigasi pertama (masalah environment, bukan aplikasi) sehingga workers dibatasi 2.`, "");

p(`## 9. Rekomendasi Prioritas`, "");
p(`1. **Segera (sebelum rilis):** BUG-01 (whitelist role & larang eskalasi admin), BUG-03 (auth pada toggle jadwal), BUG-04 (state machine status konsultasi), BUG-02 (create password).`,
  `2. **Sprint berikutnya:** BUG-05/06 (role guard terpusat), BUG-07 (validasi \`next\`), BUG-08, BUG-09, BUG-10, BUG-11, BUG-12, BUG-13, BUG-15, BUG-16, BUG-20, BUG-22.`,
  `3. **Backlog perbaikan kualitas:** seluruh temuan Low (UX, konsistensi validasi, aksesibilitas, performa aset).`,
  `4. Jalankan \`npm run test:regression\` di CI (GitHub Actions) pada setiap PR; isi \`.env.e2e\` dengan akun uji khusus agar suite live terautentikasi ikut berjalan.`, "");

p(`## 10. Cara Menjalankan Ulang`, "", "```bash",
  "cd frontend",
  "npm install && npx playwright install chromium",
  "npm run build                      # suite memakai build produksi (next start :3100)",
  "npm run test:regression            # E2E + regression UI (desktop + mobile)",
  "npm run test:regression:smoke      # subset @smoke",
  "# backend: cd backend && python -m uvicorn main:app --port 8000",
  "npm run test:live-api              # uji live API non-destruktif",
  "npm run test:all                   # semua project",
  "npm run test:regression:report     # regenerasi laporan ini",
  "npm run test:regression:html       # laporan HTML Playwright (trace & screenshot)",
  "# E2E_STRICT=1 → nonaktifkan penanda known defect (lihat kegagalan apa adanya)",
  "```", "");
p(`Artefak: \`frontend/tests/e2e/results/regression-html/\` (HTML report + trace/screenshot kegagalan), \`frontend/tests/e2e/results/regression-results.json\`.`, "");
p(`---`, `_Laporan dibuat otomatis oleh \`tests/e2e/regression/support/generate-report.js\` dari hasil eksekusi Playwright._`);

fs.writeFileSync(OUT, L.join("\n"), "utf8");
console.log(`Laporan ditulis ke ${OUT}`);
console.log({ ...stat, findings: findings.length, severity: sevCount });
