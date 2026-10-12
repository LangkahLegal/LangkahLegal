import { expect } from "@playwright/test";
import { Given, Then } from "../../hooks/bdd.js";
import { readLocalStorage } from "../../support/browser.js";
import { account } from "../../test_data/accounts.js";
import { INVALID_REFRESH_TOKEN, INVALID_TOKEN } from "../../test_data/auth.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

Given("pengguna sudah login sebagai {akun}", async ({ auth }, akun) => {
  await auth.signIn(akun);
});

Given("pengguna sudah login sebagai {akun} tanpa peran tersimpan di browser", async ({ auth }, akun) => {
  await auth.signIn(akun, { withRole: false });
});

Given("token akses {akun} sudah kedaluwarsa", async ({ auth }, akun) => {
  await auth.signIn(akun, { fresh: true, override: { access_token: INVALID_TOKEN } });
});

Then("sesi {akun} tersimpan di browser", async ({ page }, akun) => {
  expect(await readLocalStorage(page, "ll_token")).toBeTruthy();
  expect(await readLocalStorage(page, "ll_role")).toBe(account(akun).role);
});

Then("tidak ada sesi yang tersimpan di browser", async ({ page }) => {
  await expect.poll(() => readLocalStorage(page, "ll_token")).toBeNull();
});

Then("dashboard menampilkan nama pengguna", async ({ page, world }) => {
  await expect(page.getByText(world.account.name).first()).toBeVisible();
});

// ── SES-001 · Token akses kedaluwarsa diperbarui otomatis

Then("token akses di browser sudah diganti dengan yang baru", async ({ page }) => {
  const token = await readLocalStorage(page, "ll_token");
  expect(token).toBeTruthy();
  expect(token).not.toBe(INVALID_TOKEN);
});

// ── SES-004 · Setelah token diperbarui, setiap permintaan memakai token yang baru

Then("semua permintaan ke backend membawa token akses pengguna", async ({ network, world }) => {
  expect(network.requests.length).toBeGreaterThan(0);
  for (const request of network.requests) {
    expect(request.headers.authorization, `${request.method} ${request.path}`).toBe(
      `Bearer ${world.session.access_token}`,
    );
  }
});

// ── SES-002 · Sesi yang tidak bisa diperbarui dibersihkan dan pengguna diminta login

Given("token akses dan token pembaruan {akun} sudah tidak berlaku", async ({ auth }, akun) => {
  await auth.signIn(akun, { override: { access_token: INVALID_TOKEN, refresh_token: INVALID_REFRESH_TOKEN } });
});

// ── SES-003 · Beberapa permintaan yang ditolak bersamaan hanya memicu satu pembaruan sesi

Then("dashboard konsultan selesai dimuat", async ({ page }) => {
  await expect(page.getByText("Jadwal Terdekat")).toBeVisible();
});
