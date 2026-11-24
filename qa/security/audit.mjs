import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const failOnFindings = !process.argv.includes("--no-fail");
const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
const outDir = path.join(here, "reports", stamp);
mkdirSync(outDir, { recursive: true });

const SEVERITIES = ["critical", "high", "medium", "low"];
const SEMGREP_RULESETS = ["p/owasp-top-ten", "p/python", "p/javascript", "p/react", "p/secrets"];
const SCAN_EXCLUDES = ["node_modules", ".next", ".features-gen", "reports", "evals"];

const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^npm_/i.test(key)));
const quote = (s) => (s.includes(" ") && !s.startsWith('"') ? `"${s}"` : s);

const run = (cmd, args, cwd = root) =>
  spawnSync([cmd, ...args].map(quote).join(" "), {
    cwd,
    env,
    shell: true,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });

const firstAvailable = (candidates, versionArgs) =>
  candidates.find((c) => existsSync(c) || run(c, versionArgs).status === 0);

const versionOf = (output) =>
  (output ?? "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^\S*\s*v?\d+\.\d+/.test(line)) ?? "";

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const gitleaksBin = firstAvailable(
  ["gitleaks", path.join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WinGet", "Links", "gitleaks.exe")],
  ["version"],
);
const gitleaksReport = path.join(outDir, "gitleaks.json");

const tools = [
  {
    id: "npm-frontend",
    name: "npm audit (frontend)",
    bin: "npm",
    args: ["audit", "--json"],
    cwd: path.join(root, "frontend"),
    versionArgs: ["--version"],
    install: "bawaan Node.js",
    parse: parseNpm,
  },
  {
    id: "npm-qa",
    name: "npm audit (qa)",
    bin: "npm",
    args: ["audit", "--json"],
    cwd: path.join(root, "qa"),
    versionArgs: ["--version"],
    install: "bawaan Node.js",
    parse: parseNpm,
  },
  {
    id: "pip-audit",
    name: "pip-audit (backend)",
    bin: "pip-audit",
    args: ["-r", "backend/requirements.txt", "-f", "json", "--progress-spinner", "off"],
    versionArgs: ["--version"],
    install: "pip install pip-audit",
    parse: parsePipAudit,
  },
  {
    id: "bandit",
    name: "bandit (backend)",
    bin: "bandit",
    args: ["-r", "backend", "-x", "./backend/evals", "-f", "json", "-q"],
    versionArgs: ["--version"],
    install: "pip install bandit",
    parse: parseBandit,
  },
  {
    id: "semgrep",
    name: "semgrep (backend, frontend, qa)",
    bin: "semgrep",
    args: [
      "scan",
      ...SEMGREP_RULESETS.flatMap((r) => ["--config", r]),
      ...SCAN_EXCLUDES.flatMap((e) => ["--exclude", e]),
      "--metrics=off",
      "--json",
      "--timeout",
      "60",
      "backend",
      "frontend/src",
      "qa",
    ],
    versionArgs: ["--version"],
    install: "pip install semgrep",
    parse: parseSemgrep,
  },
  {
    id: "gitleaks",
    name: "gitleaks (riwayat git)",
    bin: gitleaksBin ?? "gitleaks",
    args: [
      "detect",
      "--source",
      ".",
      "--redact",
      "--config",
      "qa/security/gitleaks.toml",
      "--report-format",
      "json",
      "--report-path",
      gitleaksReport,
      "--exit-code",
      "0",
    ],
    versionArgs: ["version"],
    install: "winget install Gitleaks.Gitleaks",
    parse: () => parseGitleaks(gitleaksReport),
  },
];

function parseNpm(stdout) {
  const data = parseJson(stdout);
  if (!data) return null;
  if (data.error) return { error: data.error.summary || data.error.code };
  const findings = Object.values(data.vulnerabilities ?? {}).map((v) => {
    const advisory = v.via.find((x) => typeof x === "object");
    const fix = v.fixAvailable === true ? "npm audit fix" : v.fixAvailable ? `${v.fixAvailable.name}@${v.fixAvailable.version}` : "belum ada";
    return {
      severity: v.severity === "moderate" ? "medium" : v.severity,
      where: `${v.name} (${v.isDirect ? "langsung" : "transitif"})`,
      title: advisory?.title ?? `lewat ${v.via.filter((x) => typeof x === "string").join(", ")}`,
      fix,
    };
  });
  return { findings };
}

function parsePipAudit(stdout) {
  const data = parseJson(stdout);
  if (!data) return null;
  const findings = [];
  for (const dep of data.dependencies ?? []) {
    for (const vuln of dep.vulns ?? []) {
      findings.push({
        severity: "high",
        where: `${dep.name} ${dep.version}`,
        title: `${vuln.id}: ${(vuln.description ?? "").split(/\.\s/)[0].slice(0, 90)}`,
        fix: vuln.fix_versions?.length ? `>= ${vuln.fix_versions.at(-1)}` : "belum ada",
      });
    }
  }
  return { findings };
}

function parseBandit(stdout) {
  const data = parseJson(stdout);
  if (!data) return null;
  const findings = (data.results ?? []).map((r) => ({
    severity: r.issue_severity.toLowerCase(),
    where: `${path.relative(root, r.filename).replaceAll("\\", "/")}:${r.line_number}`,
    title: `${r.test_id} ${r.issue_text}`,
    fix: r.more_info,
  }));
  return { findings };
}

function parseSemgrep(stdout) {
  const data = parseJson(stdout);
  if (!data) return null;
  const level = { ERROR: "high", WARNING: "medium", INFO: "low" };
  const findings = (data.results ?? []).map((r) => ({
    severity: level[r.extra.severity] ?? "low",
    where: `${r.path.replaceAll("\\", "/")}:${r.start.line}`,
    title: r.check_id.split(".").at(-1),
    fix: r.extra.message.split("\n")[0].slice(0, 120),
  }));
  return { findings };
}

function parseGitleaks(reportPath) {
  if (!existsSync(reportPath)) return { findings: [] };
  const data = parseJson(readFileSync(reportPath, "utf8")) ?? [];
  const findings = data.map((x) => ({
    severity: "high",
    where: `${x.File}:${x.StartLine} @ ${x.Commit.slice(0, 7)} (${x.Date.slice(0, 10)})`,
    title: `${x.RuleID}: ${x.Description}`,
    fix: "rotasi kredensial, lalu bersihkan riwayat atau allowlist commit-nya di gitleaks.toml",
  }));
  return { findings };
}

function manualFindings() {
  const register = path.join(here, "VULNERABILITIES.md");
  if (!existsSync(register)) return [];
  return readFileSync(register, "utf8")
    .split("\n")
    .filter((line) => /^\| M-\d+ \|/.test(line))
    .map((line) => {
      const [id, title, severity, priority, status] = line.split("|").slice(1).map((cell) => cell.trim());
      return { id, title, severity, priority, status };
    });
}

const results = [];
for (const tool of tools) {
  const version = run(tool.bin, tool.versionArgs);
  if (version.status !== 0) {
    results.push({ ...tool, status: "tidak terpasang", version: null, findings: [] });
    console.log(`SKIP  ${tool.name}: tidak terpasang (${tool.install})`);
    continue;
  }
  process.stdout.write(`RUN   ${tool.name} ... `);
  const proc = run(tool.bin, tool.args, tool.cwd);
  const parsed = tool.parse(proc.stdout ?? "");
  const rawFile = path.join(outDir, `${tool.id}.${parsed ? "json" : "txt"}`);
  writeFileSync(rawFile, parsed ? (tool.id === "gitleaks" ? JSON.stringify(parsed.findings, null, 2) : proc.stdout) : `${proc.stdout}\n${proc.stderr}`);
  if (!parsed || parsed.error) {
    const reason = parsed?.error ?? (proc.stderr || "keluaran bukan JSON").trim().split("\n").at(-1);
    results.push({ ...tool, status: `gagal: ${reason}`, version: versionOf(version.stdout), findings: [] });
    console.log("gagal");
    continue;
  }
  results.push({ ...tool, status: "ok", version: versionOf(version.stdout), findings: parsed.findings });
  console.log(`${parsed.findings.length} temuan`);
}

const count = (findings) => Object.fromEntries(SEVERITIES.map((s) => [s, findings.filter((f) => f.severity === s).length]));
const order = (f) => SEVERITIES.indexOf(f.severity);

const lines = [
  `# Hasil audit keamanan — ${stamp.replace("_", " ")}`,
  "",
  "| Alat | Versi | Status | Critical | High | Medium | Low |",
  "|---|---|---|---|---|---|---|",
];
for (const r of results) {
  const c = count(r.findings);
  lines.push(`| ${r.name} | ${r.version ?? "-"} | ${r.status} | ${c.critical} | ${c.high} | ${c.medium} | ${c.low} |`);
}
for (const r of results.filter((r) => r.findings.length)) {
  lines.push("", `## ${r.name}`, "", "| Severity | Lokasi | Temuan | Perbaikan |", "|---|---|---|---|");
  for (const f of [...r.findings].sort((a, b) => order(a) - order(b)).slice(0, 40)) {
    lines.push(`| ${f.severity} | ${f.where} | ${f.title.replaceAll("|", "\\|")} | ${String(f.fix).replaceAll("|", "\\|")} |`);
  }
  if (r.findings.length > 40) lines.push("", `… ${r.findings.length - 40} temuan lain di berkas mentah.`);
}
const manual = manualFindings();
if (manual.length) {
  const open = manual.filter((m) => !/^(Diperbaiki|Diterima)/.test(m.status));
  const tally = (status) => manual.filter((m) => m.status.startsWith(status)).length;
  lines.push(
    "",
    "## Audit manual (dari VULNERABILITIES.md)",
    "",
    `${manual.length} temuan: ${open.length} terbuka, ${tally("Diterima")} diterima.`,
    "",
    "| ID | Prioritas | Severity | Status | Temuan |",
    "|---|---|---|---|---|",
  );
  const rank = (p) => (/P(\d)/.exec(p)?.[1] ?? "9");
  for (const m of [...open].sort((a, b) => rank(a.priority) - rank(b.priority))) {
    lines.push(`| ${m.id} | ${m.priority} | ${m.severity} | ${m.status} | ${m.title} |`);
  }
}

lines.push("", `Berkas mentah: \`${path.relative(root, outDir).replaceAll("\\", "/")}/\``);
writeFileSync(path.join(outDir, "summary.md"), lines.join("\n") + "\n");

console.log("");
console.log(lines.slice(2, 4 + results.length).join("\n"));
console.log(`\nLaporan: ${path.relative(root, path.join(outDir, "summary.md")).replaceAll("\\", "/")}`);

const blocking = results.flatMap((r) => r.findings).filter((f) => f.severity === "critical" || f.severity === "high").length;
if (blocking && failOnFindings) {
  console.log(`\n${blocking} temuan critical/high. Tinjau di VULNERABILITIES.md; jalankan dengan --no-fail untuk mengabaikan kode keluar.`);
  process.exit(1);
}
