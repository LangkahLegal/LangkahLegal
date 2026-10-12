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
const path = require("path");
const { buildReportData, runLabel } = require("./report-data.js");

const D = buildReportData();
const { ROOT, FEATURES, findings, all, stat, byProject, features, sevCount, catCount, env, PROJ_SHORT: projShort } = D;
const OUT = path.resolve(process.argv[2] || path.join(ROOT, "..", "E2E_REGRESSION_REPORT.md"));
const sevOrder = D.SEV_ORDER;
const verLabel = D.VER_LABEL;
const esc = (s = "") => String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
const nextVer = env.next, pwVer = env.playwright, reactVer = env.react, tqVer = env.tanstack;
const pyVer = env.python, fastapiVer = env.fastapi, chromiumDir = env.browser, durMin = env.durationMin;
const actualOutput = (c) => `${c.actual.text}${c.actual.assert ? ` _(assert: ${c.actual.assert})_` : ""}`;
const statusCell = (c) => c.runs.map((r) => `${c.runs.length > 1 ? projShort[r.project] + ": " : ""}${runLabel(r)}${r.expectedStatus === "failed" && c.bug ? ` [${c.bug}](#${c.bug.toLowerCase()})` : ""}`).join("<br>");

// ─── Susun Markdown ────────────────────────────────────────────────────────
const L = [];
const p = (...x) => L.push(...x);

p(`# Laporan E2E & Regression Testing — LangkahLegal`, "");
p(`| | |`, `|---|---|`,
  `| **Aplikasi** | LangkahLegal — platform konsultasi hukum (Next.js ${nextVer} + FastAPI + Supabase) |`,
  `| **Jenis pengujian** | End-to-End (UI) · Regression · Edge case · Negative · Security · Accessibility · Live API |`,
  `| **Tanggal eksekusi** | ${env.startedText} |`,
  `| **Durasi eksekusi** | ${durMin} menit (${stat.runs} eksekusi test) |`,
  `| **Tool** | Playwright ${pwVer} (Chromium) |`,
  `| **Status akhir** | ${stat.fail === 0 ? "Suite regression hijau — semua kegagalan adalah defect yang sudah tercatat" : `${stat.fail} kegagalan baru perlu ditinjau`} |`, "");

p(`## 1. Ringkasan Eksekutif`, "");
p(`Seluruh fitur aplikasi (${Object.keys(FEATURES).length} fitur, 3 role + publik) diuji melalui **${stat.cases} test case** ` +
  `yang dieksekusi **${stat.runs} kali** pada 3 project (Desktop Chromium, Mobile Chromium/Pixel 7, Live API).`, "");
p(`| Metrik | Jumlah |`, `|---|---:|`,
  `| Test case unik | ${stat.cases} (✅ ${stat.casePass} lulus · ❌ ${stat.caseKnown} known defect · ⏭️ ${stat.caseSkip} skip) |`, `| Total eksekusi (desktop + mobile + live) | ${stat.runs} |`,
  `| ✅ Lulus | ${stat.pass} |`, `| ❌ Gagal — defect terkonfirmasi (known defect) | ${stat.known} |`,
  `| ❌ Gagal — tidak terduga | ${stat.fail} |`, `| ⚠️ Flaky | ${stat.flaky} |`, `| ⚠️ Defect tampak sudah diperbaiki | ${stat.fixed} |`,
  `| ⏭️ Dilewati (butuh kredensial akun uji) | ${stat.skip} |`,
  `| **Pass rate eksekusi (tanpa skip)** | **${stat.passRate.toFixed(1)}%** — seluruh kegagalan adalah defect aplikasi yang terdokumentasi di Bagian 6 |`, "");
p(`**Temuan:** ${findings.length} defect — ` + sevOrder.map((s) => `**${sevCount[s]} ${s}**`).join(", ") + ".", "");
p(`Temuan paling kritis:`, "");
findings.filter((f) => ["Critical", "High"].includes(f.severity)).forEach((f) => p(`- **[${f.id}](#${f.id.toLowerCase()}) (${f.severity})** — ${f.title}.`));
p("");

p(`## 2. Lingkup & Daftar Fitur`, "");
p(`Status dihitung per test case (gabungan semua project): sebuah TC dihitung "Known defect" bila gagal sesuai temuan di salah satu project, "Skip" bila tidak dijalankan di project mana pun.`, "");
p(`| Kode | Fitur | Role | Jumlah TC | ✅ Lulus | ❌ Known defect | ⏭️ Skip |`, `|---|---|---|---:|---:|---:|---:|`);
const tot = { tc: 0, pass: 0, known: 0, skip: 0 };
for (const f of features) {
  tot.tc += f.total; tot.pass += f.pass; tot.known += f.known; tot.skip += f.skip;
  p(`| ${f.code} | ${f.name} | ${f.role} | ${f.total} | ${f.pass} | ${f.known} | ${f.skip} |`);
}
p(`| **Total** | | | **${tot.tc}** | **${tot.pass}** | **${tot.known}** | **${tot.skip}** |`);
p("", `Distribusi kategori test case: ` + Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} (${v})`).join(", ") + ".", "");

p(`## 3. Test Environment`, "");
p(`| Komponen | Detail |`, `|---|---|`,
  `| Sistem operasi | ${env.os} |`,
  `| Node.js | ${env.node} |`,
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
for (const f of findings) {
  p(`| [${f.id}](#${f.id.toLowerCase()}) | ${f.severity} | ${f.component} | ${esc(f.feature)} | ${esc(f.title)} | ${verLabel[f.verification]} | ${f.tests.join(", ") || "—"} |`);
}
p("");
for (const f of findings) {
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
for (const feat of Object.keys(groups)) {
  p(`### ${feat}`, "");
  p(`| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |`, `|---|---|---|---|---|---|---|`);
  for (const c of groups[feat]) {
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
p(`Artefak: \`E2E_REGRESSION_REPORT.html\` (versi interaktif laporan ini), \`frontend/tests/e2e/results/regression-html/\` (HTML report Playwright + trace/screenshot kegagalan), \`frontend/tests/e2e/results/regression-results.json\`.`, "");
p(`---`, `_Laporan dibuat otomatis oleh \`tests/e2e/regression/support/generate-report.js\` dari hasil eksekusi Playwright._`);

fs.writeFileSync(OUT, L.join("\n"), "utf8");
console.log(`Laporan ditulis ke ${OUT}`);
console.log({ ...stat, findings: findings.length, severity: sevCount });
