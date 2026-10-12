// @ts-check
/**
 * Playwright config — Full E2E & Regression Suite LangkahLegal
 *
 * Project:
 *  - desktop-chromium : seluruh skenario E2E/regression UI (API backend di-mock di level jaringan)
 *  - mobile-chromium  : subset skenario bertag @mobile pada viewport Pixel 7
 *  - live-api         : uji non-destruktif langsung ke backend FastAPI (butuh backend berjalan)
 *
 * Jalankan:
 *   (di ../frontend) npm run build   # sekali, suite memakai `next start`
 *   npm run test:regression       # UI suite (desktop + mobile)
 *   npm run test:live-api         # live API suite (backend harus jalan di :8000)
 */
const path = require("path");
const { defineConfig, devices } = require("@playwright/test");
require("dotenv").config({ path: ".env.e2e" });

const PORT = Number(process.env.E2E_REGRESSION_PORT || 3100);
const FRONTEND_DIR = path.resolve(__dirname, "../frontend");
const BASE_URL = process.env.E2E_REGRESSION_BASE_URL || `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Di Windows, >2 browser Chromium paralel membuat request aset statis /_next/static
  // menggantung pada navigasi pertama (terverifikasi). Override dengan --workers bila mesin kuat.
  workers: Number(process.env.E2E_WORKERS || 2),
  timeout: 45_000,
  expect: { timeout: 10_000 },
  globalSetup: require.resolve("./e2e/regression/support/global-setup.js"),
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e/results/regression-html", open: "never" }],
    ["json", { outputFile: "e2e/results/regression-results.json" }],
  ],
  outputDir: "e2e/results/regression-artifacts",

  use: {
    baseURL: BASE_URL,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "desktop-chromium",
      testMatch: "regression/specs/**/*.spec.js",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium",
      testMatch: "regression/specs/**/*.spec.js",
      grep: /@mobile/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "live-api",
      testMatch: "live/**/*.spec.js",
      use: { baseURL: process.env.PLAYWRIGHT_API_ORIGIN || "http://127.0.0.1:8000" },
    },
  ],

  webServer: process.env.E2E_REGRESSION_BASE_URL
    ? undefined
    : {
        // Panggil binary Next langsung (bukan via npx/cmd.exe) — di Windows wrapper npx
        // dapat membuat server berhenti merespons ketika dijalankan sebagai child process.
        command: process.env.E2E_REGRESSION_SERVER_COMMAND || `node node_modules/next/dist/bin/next start -p ${PORT}`,
        cwd: FRONTEND_DIR,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
