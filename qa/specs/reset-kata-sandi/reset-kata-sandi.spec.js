import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { sessions } from "../../support/sessions.js";
import { EXPIRED_RESET_LINK, INVALID_PASSWORDS, NEW_PASSWORD } from "../../test_data/kata-sandi.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

Given("pengguna membuka tautan reset yang diterimanya", async ({ resetKataSandiPage, world }) => {
  await resetKataSandiPage.openWithToken({ token: world.tempUser.otp, email: world.tempUser.email });
  await resetKataSandiPage.confirmPasswordInput.waitFor();
});

// ── AUTH-031 · Halaman reset tanpa tautan yang sah ditolak

Then("tautan reset dinyatakan tidak valid", async ({ resetKataSandiPage }) => {
  await expect(resetKataSandiPage.invalidLinkTitle).toBeVisible();
});

Then("pengguna dapat meminta tautan reset baru", async ({ resetKataSandiPage }) => {
  await expect(resetKataSandiPage.requestNewLink).toHaveAttribute("href", "/auth/forgot-password");
});

// ── AUTH-032 · Tautan reset yang sudah tidak berlaku ditolak

When("pengguna membuka tautan reset yang sudah tidak berlaku", async ({ resetKataSandiPage }) => {
  await resetKataSandiPage.openWithToken(EXPIRED_RESET_LINK);
});

Then("pengguna diberi tahu tautan reset sudah kedaluwarsa", async ({ resetKataSandiPage }) => {
  await expect(resetKataSandiPage.expiredMessage).toBeVisible();
});

// ── AUTH-033 · Kata sandi baru dengan format tidak valid ditolak

When("pengguna menyimpan kata sandi baru dengan format tidak valid", async ({ resetKataSandiPage, world }) => {
  world.rejections = [];
  for (const attempt of INVALID_PASSWORDS.reset) {
    await resetKataSandiPage.submit(attempt);
    world.rejections.push({ ...attempt, shown: await resetKataSandiPage.showsMessage(attempt.message) });
  }
});

// ── AUTH-034 · Kata sandi berhasil direset lalu dapat dipakai untuk login

When("pengguna menyimpan kata sandi baru yang valid", async ({ resetKataSandiPage }) => {
  await resetKataSandiPage.submit({ password: NEW_PASSWORD, confirmation: NEW_PASSWORD });
});

Then("kata sandi baru dapat dipakai untuk login", async ({ world }) => {
  const session = await sessions.loginWith({ email: world.tempUser.email, password: NEW_PASSWORD });
  expect(session.access_token).toBeTruthy();
});

// ── AUTH-043 BUG-33 · Label formulir reset terhubung ke kolom yang benar

When("pengguna memilih label konfirmasi kata sandi baru", async ({ resetKataSandiPage }) => {
  await resetKataSandiPage.confirmPasswordLabel.click();
});

Then("kolom konfirmasi kata sandi baru menjadi aktif", async ({ resetKataSandiPage }) => {
  await expect(resetKataSandiPage.confirmPasswordInput).toBeFocused();
});

Then("setiap kolom formulir reset punya id unik", async ({ resetKataSandiPage }) => {
  const ids = await resetKataSandiPage.inputIds();
  expect(new Set(ids).size, `id kolom: ${ids.join(", ")}`).toBe(ids.length);
});
