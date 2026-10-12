import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { env } from "../../support/env.js";
import { sessions } from "../../support/sessions.js";
import { PASSWORD_CHANGE } from "../../test_data/pengaturan.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna mengganti kata sandinya", async ({ pengaturanKeamananPage }) => {
  await pengaturanKeamananPage.change({
    current: env.accountPassword,
    password: PASSWORD_CHANGE.newPassword,
    confirmation: PASSWORD_CHANGE.newPassword,
  });
});

// ── SEC-001 · Pengguna mengganti kata sandi lalu diminta login ulang

Then("kata sandi baru pengguna itu dapat dipakai untuk login", async ({ world }) => {
  const session = await sessions.loginWith({ email: world.tempUser.email, password: PASSWORD_CHANGE.newPassword });
  expect(session.access_token).toBeTruthy();
});

// ── SEC-002 · Konfirmasi kata sandi yang tidak cocok ditolak

When("pengguna mengganti kata sandi dengan konfirmasi yang tidak cocok", async ({ pengaturanKeamananPage }) => {
  await pengaturanKeamananPage.change({
    current: env.accountPassword,
    password: PASSWORD_CHANGE.newPassword,
    confirmation: PASSWORD_CHANGE.mismatch,
  });
});

// ── SEC-003 · Aturan panjang minimal kata sandi konsisten

Then(
  "petunjuk dan validasi kata sandi memakai panjang minimal yang sama",
  async ({ pengaturanKeamananPage }) => {
    const input = pengaturanKeamananPage.newPasswordInput;
    const minLength = await input.getAttribute("minlength");
    expect(await input.getAttribute("placeholder")).toContain(minLength);

    await pengaturanKeamananPage.fill({
      password: PASSWORD_CHANGE.sixCharacters,
      confirmation: PASSWORD_CHANGE.sixCharacters,
    });
    const acceptedByBrowser = await input.evaluate((element) => element.checkValidity());
    expect(acceptedByBrowser, "enam karakter lolos pesan validasi tetapi ditolak atribut minlength").toBe(true);
  },
);

// ── SEC-004 · Mengganti kata sandi mensyaratkan kata sandi saat ini

Then("pengguna diminta mengisi kata sandi saat ini", async ({ pengaturanKeamananPage }) => {
  await expect(pengaturanKeamananPage.currentPasswordInput).toBeVisible({ timeout: 3_000 });
});

// ── SEC-005 · Kata sandi baru yang sama dengan yang lama ditolak

When("pengguna mengganti kata sandi dengan kata sandi lamanya", async ({ pengaturanKeamananPage }) => {
  await pengaturanKeamananPage.change({
    current: env.accountPassword,
    password: env.accountPassword,
    confirmation: env.accountPassword,
  });
});

// ── SEC-006 · Sesi di browser dihapus setelah kata sandi diganti
// Seluruh langkahnya memakai langkah bersama.
