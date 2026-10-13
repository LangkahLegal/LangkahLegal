import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { readSessionStorage } from "../../support/browser.js";
import { defineCases } from "../../support/parameter-types.js";
import { account } from "../../test_data/accounts.js";
import {
  INVALID_EMAILS,
  LOGIN_LINKS,
  SAMPLE_PASSWORD,
  SQL_INJECTION_PASSWORD,
  WRONG_PASSWORD,
  XSS_MESSAGE,
} from "../../test_data/login.data.js";

defineCases("emailTidakValid", INVALID_EMAILS);
defineCases("tautanLogin", Object.fromEntries(Object.entries(LOGIN_LINKS).map(([name, locator]) => [name, { locator }])));

const klien = () => account("klien");

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna login sebagai {akun}", async ({ loginPage, world }, akun) => {
  world.account = account(akun);
  await loginPage.open();
  await loginPage.login(world.account);
});

When("pengguna login dengan email yang {emailTidakValid}", async ({ loginPage }, kasus) => {
  await loginPage.open();
  await loginPage.login({ email: kasus.email, password: SAMPLE_PASSWORD });
});

When("pengguna memilih tautan {tautanLogin}", async ({ loginPage }, tautan) => {
  await loginPage[tautan.locator].click();
});

When("pengguna memilih masuk dengan Google", async ({ loginPage }) => {
  await loginPage.googleButton.click();
});

Then("pesan galat login adalah {string}", async ({ loginPage }, pesan) => {
  await expect(loginPage.errorMessage).toHaveText(pesan);
});

Then("pengguna dapat mencoba login kembali", async ({ loginPage }) => {
  await expect(loginPage.submitButton).toBeEnabled();
  await expect(loginPage.submitButton).toHaveText("Masuk");
});

Then("kolom email login ditandai {emailTidakValid}", async ({ loginPage }, kasus) => {
  expect(await loginPage.emailValidity(kasus.validity)).toBe(true);
});

// ── AUTH-001 · Klien berhasil login
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-002 · Konsultan berhasil login
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-003 · Admin berhasil login
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-004 · Akun yang belum punya peran diminta memilih peran
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-005 · Kata sandi yang salah ditolak

When("pengguna login dengan kata sandi yang salah", async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.login({ email: klien().email, password: WRONG_PASSWORD });
});

// ── AUTH-006 · Login tanpa kata sandi ditolak sebelum dikirim

When("pengguna login tanpa mengisi kata sandi", async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.login({ email: klien().email });
});

// ── AUTH-007 · Login tanpa email ditolak peramban
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-007 · Login dengan email salah format ditolak peramban
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-008 · Gangguan server saat login diberitahukan ke pengguna

Then("pesan galat login tampil", async ({ loginPage }) => {
  await expect(loginPage.errorMessage).toBeVisible();
});

// ── AUTH-008 · Koneksi terputus saat login diberitahukan ke pengguna

Then("pesan galat login memuat {string}", async ({ loginPage }, pesan) => {
  await expect(loginPage.errorMessage).toContainText(pesan);
});

// ── AUTH-009 · Login yang sedang diproses tidak bisa dikirim dua kali

Then("tombol masuk terkunci selama login diproses", async ({ loginPage }) => {
  await expect(loginPage.submitButton).toBeDisabled();
  await expect(loginPage.submitButton).toHaveText("Memverifikasi...");
});

When("pengguna menekan tombol masuk sekali lagi", async ({ loginPage }) => {
  await loginPage.submitButton.click({ force: true }).catch(() => {});
});

// ── AUTH-010 · Kata sandi dapat ditampilkan dan disembunyikan

When("pengguna mengetik kata sandi login", async ({ loginPage }) => {
  await loginPage.passwordInput.fill(SAMPLE_PASSWORD);
});

Then("kata sandi login tersembunyi", async ({ loginPage }) => {
  await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
});

When("pengguna memilih menampilkan kata sandi", async ({ loginPage }) => {
  await loginPage.showPasswordButton.click();
});

Then("kata sandi login terlihat", async ({ loginPage }) => {
  await expect(loginPage.passwordInput).toHaveAttribute("type", "text");
});

When("pengguna memilih menyembunyikan kata sandi", async ({ loginPage }) => {
  await loginPage.hidePasswordButton.click();
});

// ── AUTH-011 · Pesan galat berisi skrip tidak dijalankan browser

Given("layanan {layanan} menolak dengan pesan berisi skrip", async ({ network }, layanan) => {
  await network.fail(layanan, { status: 400, detail: XSS_MESSAGE });
});

When("pengguna login dengan kata sandi berisi perintah SQL", async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.login({ email: klien().email, password: SQL_INJECTION_PASSWORD });
});

Then("pesan galat login menampilkan skrip itu sebagai teks biasa", async ({ loginPage }) => {
  await expect(loginPage.errorMessage).toHaveText(XSS_MESSAGE);
});

// ── AUTH-012 · Pengguna yang lupa kata sandi menuju halaman pemulihan dari login
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-012 · Pengunjung yang belum punya akun menuju pendaftaran dari login
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-013 · Pengguna yang sudah login tidak perlu melihat halaman login lagi
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-014 · Login Google membawa pengguna ke halaman persetujuan Google

Then("browser berpindah ke penyedia login Google", async ({ page }) => {
  await page.waitForURL(/accounts\.google\.com|\/auth\/v1\/authorize/);
});

Then("Google diminta mengembalikan pengguna ke halaman callback", async ({ network }) => {
  const [request] = network.calls("login Google");
  expect(request.body.redirectTo).toMatch(/\/auth\/callback$/);
});

Then("kode verifikasi OAuth tersimpan di browser", async ({ page, loginPage }) => {
  await loginPage.open();
  expect(await readSessionStorage(page, "pending_oauth_verifier")).toBeTruthy();
});

// ── AUTH-015 · Login Google yang gagal disiapkan diberitahukan ke pengguna

Given("layanan {layanan} tidak memberikan alamat tujuan", async ({ network }, layanan) => {
  await network.reply(layanan, { json: { data: {} } });
});
