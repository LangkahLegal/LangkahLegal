import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { QA_DIR } from "./env.js";

const PAGES_DIR = path.resolve(process.argv[2] ?? path.join(QA_DIR, "pages"));
const FORBIDDEN = /\.(locator|getByRole|getByText|getByLabel|getByPlaceholder|getByAltText|getByTitle|\$\$?)\(/;
const ALLOWED = [/\.locator\("html"\)/, /getByText\(\/Application error/];

const files = readdirSync(PAGES_DIR, { recursive: true })
  .filter((file) => file.endsWith(".page.js"))
  .map((file) => path.join(PAGES_DIR, file));

const violations = files.flatMap((file) =>
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line, i) => ({ file, line: i + 1, text: line.trim() }))
    .filter(({ text }) => FORBIDDEN.test(text) && !ALLOWED.some((rule) => rule.test(text))),
);

for (const v of violations) {
  console.log(`${path.relative(QA_DIR, v.file).replaceAll("\\", "/")}:${v.line}  ${v.text}`);
}
console.log(`\n${files.length} page object, ${violations.length} selector di luar data-testid.`);
process.exit(violations.length ? 1 : 0);
