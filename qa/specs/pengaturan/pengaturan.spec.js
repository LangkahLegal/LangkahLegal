import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { routeOf, urlOf } from "../../pages/routes.js";
import { readLocalStorage } from "../../support/browser.js";
import {
  LOGOUT_CONFIRM,
  SESSION_KEYS,
  SETTINGS_DESTINATIONS,
  SETTINGS_MENU,
  THEMES,
} from "../../test_data/pengaturan.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna keluar dari aplikasi", async ({ pengaturanPage, dialogs }) => {
  await pengaturanPage.menu("Keluar").click();
  await dialogs.waitFor(LOGOUT_CONFIRM);
});

Then("aplikasi memakai tema gelap", async ({ pengaturanPage, page }) => {
  await expect(pengaturanPage.html).toHaveClass(THEMES.dark);
  await expect(page.getByText(THEMES.darkLabel)).toBeVisible();
  expect(await readLocalStorage(page, "user-pref-theme")).toBe(THEMES.darkStored);
});

Then("seluruh data sesi terhapus dari browser", async ({ page }) => {
  const remaining = await page.evaluate((keys) => keys.filter((key) => localStorage.getItem(key) !== null), SESSION_KEYS);
  expect(remaining).toEqual([]);
});

// ── SET-001 · Halaman pengaturan menampilkan akun dan seluruh menu

Then("pengaturan menampilkan nama, email, dan seluruh menu pengaturan", async ({ pengaturanPage, page, world }) => {
  await expect(pengaturanPage.heading(world.account.name)).toBeVisible();
  await expect(page.getByText(world.account.email)).toBeVisible();
  for (const label of SETTINGS_MENU) await expect(pengaturanPage.menuLabel(label)).toBeVisible();
});

// ── SET-002 · Konsultan terverifikasi melihat status verifikasinya

Then("pengaturan menampilkan status terverifikasi", async ({ pengaturanPage }) => {
  await expect(pengaturanPage.verifiedBadge).toBeVisible();
});

// ── SET-003 · Tema gelap tetap aktif setelah halaman dimuat ulang

When("pengguna mengganti tema aplikasi", async ({ pengaturanPage }) => {
  await expect(pengaturanPage.html).toHaveClass(THEMES.light);
  await pengaturanPage.menu("Tema Aplikasi").click();
});

// ── SET-004 · Pengguna keluar dari aplikasi
// Seluruh langkahnya memakai langkah bersama.

// ── SET-005 · Pengguna mengurungkan keluar dari aplikasi

When("pengguna mengurungkan keluar dari aplikasi", async ({ pengaturanPage, dialogs }) => {
  dialogs.acceptConfirm = false;
  await pengaturanPage.menu("Keluar").click();
  await dialogs.waitFor(LOGOUT_CONFIRM);
});

// ── SET-005 · Sesi tetap dibersihkan walau layanan logout bermasalah
// Seluruh langkahnya memakai langkah bersama.

// ── SET-006 · Tema tidak berubah saat area kosong diklik

When("pengguna mengklik area kosong halaman", async ({ pengaturanPage }) => {
  await pengaturanPage.clickEmptyArea();
});

Then("aplikasi tetap memakai tema terang", async ({ pengaturanPage }) => {
  await expect(pengaturanPage.html).toHaveClass(THEMES.light);
});

// ── SET-007 · Setiap menu pengaturan membuka halamannya

When("pengguna membuka setiap menu pengaturan", async ({ pengaturanPage, page, world }) => {
  world.visits = [];
  for (const destination of SETTINGS_DESTINATIONS) {
    await pengaturanPage.open();
    await pengaturanPage.menu(destination.menu).click();
    const expected = urlOf(routeOf(destination.page));
    const arrived = await page.waitForURL(expected, { timeout: 10_000 }).then(() => true, () => false);
    world.visits.push({ ...destination, arrived, url: page.url() });
  }
});

Then("setiap menu membuka halaman pengaturannya", async ({ world }) => {
  for (const visit of world.visits) {
    expect(visit.arrived, `menu "${visit.menu}" membuka ${visit.url}`).toBe(true);
  }
});
