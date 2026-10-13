import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { presetSessionStorage } from "../../support/browser.js";
import { db, eq } from "../../support/database.js";
import { account } from "../../test_data/accounts.js";
import { OTP, PENDING_SIGNUP } from "../../test_data/verifikasi-otp.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

Given("sebuah pendaftaran sedang menunggu verifikasi", async ({ page }) => {
  await presetSessionStorage(page, { pending_auth: JSON.stringify({ ...PENDING_SIGNUP, flow: "signup" }) });
});

When("pengguna memverifikasi kode OTP yang salah", async ({ verifikasiOtpPage }) => {
  await verifikasiOtpPage.verify(OTP.wrongCode);
});

// ── AUTH-023 · Konsultan baru memverifikasi kode OTP lalu masuk ke dashboard

When("pengguna memverifikasi kode OTP yang diterimanya", async ({ verifikasiOtpPage, world }) => {
  await verifikasiOtpPage.verify(world.newUser.otp);
});

Then("akun baru tersimpan sebagai {akun}", async ({ world }, akun) => {
  const profile = await db.first("users", { email: eq(world.newUser.email) }, "role");
  expect(profile?.role).toBe(account(akun).role);
});

// ── AUTH-023 · Verifikasi belum bisa dikirim sebelum kode diisi

Then("tombol verifikasi belum dapat ditekan", async ({ verifikasiOtpPage }) => {
  await expect(verifikasiOtpPage.verifyButton).toBeDisabled();
});

// ── AUTH-024 · Kotak OTP menolak karakter selain huruf dan angka

When("pengguna mengetik karakter selain huruf dan angka pada kotak OTP pertama", async ({ verifikasiOtpPage }) => {
  await verifikasiOtpPage.box(1).pressSequentially(OTP.nonAlphanumeric);
});

Then("kotak OTP pertama tetap kosong", async ({ verifikasiOtpPage }) => {
  await expect(verifikasiOtpPage.box(1)).toHaveValue("");
});

// ── AUTH-024 · Fokus kotak OTP berpindah mengikuti ketikan

When("pengguna mengetik satu angka pada kotak OTP pertama", async ({ verifikasiOtpPage }) => {
  await verifikasiOtpPage.box(1).pressSequentially(OTP.singleDigit);
});

Then("fokus berpindah ke kotak OTP kedua", async ({ verifikasiOtpPage }) => {
  await expect(verifikasiOtpPage.box(1)).toHaveValue(OTP.singleDigit);
  await expect(verifikasiOtpPage.box(2)).toBeFocused();
});

When("pengguna menghapus dari kotak OTP yang kosong", async ({ page }) => {
  await page.keyboard.press("Backspace");
});

Then("fokus kembali ke kotak OTP pertama", async ({ verifikasiOtpPage }) => {
  await expect(verifikasiOtpPage.box(1)).toBeFocused();
});

// ── AUTH-025 · Kode OTP yang ditempel mengisi semua kotak

When("pengguna menempel kode OTP yang mengandung spasi", async ({ verifikasiOtpPage }) => {
  await verifikasiOtpPage.paste(OTP.pastedWithSpaces);
});

Then("semua kotak OTP terisi tanpa spasi", async ({ verifikasiOtpPage }) => {
  expect(await verifikasiOtpPage.code()).toBe(OTP.pastedResult);
});

Then("tombol verifikasi dapat ditekan", async ({ verifikasiOtpPage }) => {
  await expect(verifikasiOtpPage.verifyButton).toBeEnabled();
});

// ── AUTH-026 · Kode OTP yang salah ditolak

Then("pesan galat verifikasi tampil", async ({ page, network }) => {
  await network.waitForCall("verifikasi OTP");
  await expect(page.getByText(/expired|invalid|tidak valid|gagal/i).first()).toBeVisible();
});

// ── AUTH-027 · Kode OTP dapat diminta ulang

When(
  "pengguna meminta kode OTP dikirim ulang setelah mengisi sebagian kotak",
  async ({ verifikasiOtpPage }) => {
    await verifikasiOtpPage.fillCode(OTP.partialCode);
    await verifikasiOtpPage.resendButton.click();
  },
);

Then("kode baru diminta untuk email pendaftaran itu", async ({ network }) => {
  const request = await network.waitForCall("kirim ulang OTP");
  expect(request.body.email).toBe(PENDING_SIGNUP.email);
});

Then("kotak OTP dikosongkan", async ({ verifikasiOtpPage }) => {
  await expect(verifikasiOtpPage.box(1)).toHaveValue("");
});

// ── AUTH-028 · Verifikasi tanpa pendaftaran yang tertunda dikembalikan ke login
// Seluruh langkahnya memakai langkah bersama.
