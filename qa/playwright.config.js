import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import { BACKEND_DIR, FRONTEND_DIR, env } from "./support/env.js";

const testDir = defineBddConfig({
  features: "features/**/*.feature",
  steps: ["hooks/*.js", "specs/**/*.spec.js"],
  outputDir: ".features-gen",
});

const { port: frontendPort } = new URL(env.baseUrl);
const { port: backendPort } = new URL(env.apiUrl);

export default defineConfig({
  testDir,
  globalSetup: "./support/global-setup.js",
  // Semua skenario memakai akun uji dan database yang sama, jadi dijalankan berurutan.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: "reports/artifacts",
  reporter: [["list"], ["html", { outputFolder: "reports/html", open: "never" }]],

  use: {
    baseURL: env.baseUrl,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    launchOptions: { slowMo: env.slowMo },
  },

  projects: [
    {
      name: "desktop",
      grepInvert: /@khusus-mobile/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      grep: /@mobile/,
      use: { ...devices["Pixel 7"] },
    },
  ],

  webServer: [
    {
      command: process.env.SIT_BACKEND_COMMAND || `python -m uvicorn main:app --port ${backendPort}`,
      cwd: BACKEND_DIR,
      url: `${env.apiUrl}/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      // Memakai hasil `npm run build:frontend`; binary Next dipanggil langsung karena
      // pembungkus npx di Windows dapat membuat server berhenti merespons.
      command: process.env.SIT_FRONTEND_COMMAND || `node node_modules/next/dist/bin/next start -p ${frontendPort}`,
      cwd: FRONTEND_DIR,
      url: env.baseUrl,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
