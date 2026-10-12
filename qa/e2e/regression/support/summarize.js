/**
 * Ringkas hasil JSON reporter Playwright di terminal.
 * Pemakaian: node e2e/regression/support/summarize.js [path-json] [--failed]
 */
const fs = require("fs");
const path = require("path");

const file = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : path.join(__dirname, "../../results/regression-results.json");
const onlyFailed = process.argv.includes("--failed");
const report = JSON.parse(fs.readFileSync(file, "utf8"));

const rows = [];
const walk = (suite) => {
  (suite.specs || []).forEach((spec) => {
    spec.tests.forEach((t) => {
      const r = t.results[t.results.length - 1] || {};
      const bug = (t.annotations || []).find((a) => a.type === "bug")?.description || "";
      const err = (r.error?.message || "").replace(/\u001b\[[0-9;]*m/g, "").split("\n").filter(Boolean).slice(0, 2).join(" | ");
      rows.push({ id: spec.title.split(" ")[0], project: t.projectName, status: r.status, expected: t.expectedStatus, outcome: t.status, bug, err, title: spec.title });
    });
  });
  (suite.suites || []).forEach(walk);
};
report.suites.forEach(walk);

const counts = {};
for (const r of rows) {
  const key = r.outcome === "expected" && r.expected === "failed" ? "known-defect" : r.outcome;
  counts[key] = (counts[key] || 0) + 1;
  if (onlyFailed && r.outcome === "expected" && r.expected === "passed") continue;
  if (onlyFailed && r.status === "skipped") continue;
  console.log(`${r.outcome.padEnd(10)} ${r.status.padEnd(8)} ${r.project.padEnd(17)} ${r.id.padEnd(9)} ${r.bug.padEnd(7)} ${onlyFailed ? r.err.slice(0, 230) : r.title.slice(0, 90)}`);
}
console.log("\nTotal:", rows.length, counts);
