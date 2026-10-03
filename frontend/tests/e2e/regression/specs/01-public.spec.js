/**
 * F01–F02 — Landing Page & Halaman Informasi Publik
 */
import { test, expect, tc, expectNoCrash, seedSession } from "../support/fixtures.js";

const F01 = "F01 Landing Page";
const F02 = "F02 Halaman Informasi Publik";

test.describe("Landing Page @public", () => {
  test(...tc("PUB-001", "Landing page tampil lengkap (hero, fitur, CTA, FAQ, footer)", {
    feature: F01, type: "E2E",
    input: "Buka / tanpa sesi login",
    expected: "Judul hero, section Fitur/Editorial, CTA 'Buat Akun Gratis', FAQ, dan footer copyright tahun berjalan tampil",
    tags: ["@mobile"],
  }), async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LangkahLegal/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Akses Keadilan");
    await expect(page.locator("#features")).toBeAttached();
    await expect(page.locator("#about")).toBeAttached();
    await expect(page.getByRole("button", { name: "Buat Akun Gratis" })).toBeVisible();
    await expect(page.getByText("Tanya jawab (FAQ) LangkahLegal")).toBeVisible();
    await expect(page.getByText(`© ${new Date().getFullYear()} LangkahLegal`)).toBeVisible();
    await expectNoCrash(page);
  });

  test(...tc("PUB-002", "Tombol 'Mulai Sekarang' mengarah ke pemilihan role", {
    feature: F01, type: "E2E",
    input: "Klik 'Mulai Sekarang' pada hero",
    expected: "Redirect ke /auth/role",
  }), async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Mulai Sekarang" }).click();
    await expect(page).toHaveURL(/\/auth\/role$/);
  });

  test(...tc("PUB-003", "CTA navbar 'Mulai' untuk tamu mengarah ke login", {
    feature: F01, type: "E2E",
    input: "Klik tombol 'Mulai' di navbar tanpa sesi",
    expected: "Redirect ke /auth/login",
  }), async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation").getByRole("button", { name: "Mulai" }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test(...tc("PUB-004", "CTA navbar berubah jadi 'Dashboard' saat sudah login (konsultan)", {
    feature: F01, type: "Regression",
    input: "Sesi konsultan tersimpan, klik 'Dashboard' di navbar",
    expected: "Label tombol 'Dashboard' dan redirect ke /dashboard/consultant",
  }), async ({ page, loginAs }) => {
    await loginAs("konsultan");
    await page.goto("/");
    const cta = page.getByRole("navigation").getByRole("button", { name: "Dashboard" });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/dashboard\/consultant$/);
  });

  test(...tc("PUB-005", "Sesi tanpa role diarahkan ke pemilihan role dari CTA navbar", {
    feature: F01, type: "Edge Case",
    input: "localStorage berisi token tetapi tanpa role, klik 'Dashboard'",
    expected: "Redirect ke /auth/role",
  }), async ({ page, api }) => {
    api.asClient();
    await seedSession(page, "client", { withRole: false });
    await page.goto("/");
    await page.getByRole("navigation").getByRole("button", { name: "Dashboard" }).click();
    await expect(page).toHaveURL(/\/auth\/role$/);
  });

  test(...tc("PUB-006", "FAQ accordion membuka & menutup jawaban", {
    feature: F01, type: "E2E",
    input: "Klik pertanyaan FAQ pertama dua kali",
    expected: "Jawaban tampil setelah klik pertama dan tersembunyi setelah klik kedua",
  }), async ({ page }) => {
    await page.goto("/");
    const q = page.getByRole("button", { name: /Apa itu LangkahLegal dan apa fungsinya/ });
    const answer = page.getByText(/platform digital yang menjembatani masyarakat/);
    await expect(answer).toHaveCount(0);
    await q.click();
    await expect(answer).toBeVisible();
    await q.click();
    await expect(answer).toHaveCount(0);
  });

  test(...tc("PUB-007", "Link navigasi 'Services' melakukan scroll ke section fitur", {
    feature: F01, type: "E2E",
    input: "Klik link 'Services' di navbar (desktop)",
    expected: "URL tetap '/', section #features masuk viewport",
  }), async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Services" }).click();
    await expect(page.locator("#features")).toBeInViewport();
    await expect(page).toHaveURL(/\/$/);
  });

  test(...tc("PUB-008", "Tidak ada horizontal overflow pada landing page (mobile)", {
    feature: F01, type: "Regression",
    input: "Buka / pada viewport Pixel 7",
    expected: "document.scrollWidth <= window.innerWidth (tidak ada scroll horizontal)",
    tags: ["@mobile"],
  }), async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("Halaman Informasi @public", () => {
  for (const [id, path, heading] of [
    ["PUB-009", "/about", "Mendigitalisasi"],
    ["PUB-010", "/privacy", "Kebijakan Privasi"],
    ["PUB-011", "/terms", "Syarat & Ketentuan"],
    ["PUB-012", "/compliance", "Kepatuhan Hukum"],
  ]) {
    test(...tc(id, `Halaman ${path} dapat diakses publik`, {
      feature: F02, type: "E2E",
      input: `Buka ${path} tanpa login`,
      expected: `Heading '${heading}' tampil tanpa error`,
    }), async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
      await expectNoCrash(page);
    });
  }

  test(...tc("PUB-013", "Route tidak dikenal menampilkan halaman 404", {
    feature: F02, type: "Negative",
    input: "Buka /halaman-yang-tidak-ada",
    expected: "HTTP 404 dan teks 'This page could not be found'",
  }), async ({ page }) => {
    const res = await page.goto("/halaman-yang-tidak-ada");
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/could not be found/i)).toBeVisible();
  });
});
