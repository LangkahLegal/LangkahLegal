import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { findKonsultan } from "../../support/seed.js";
import { APPLICANT, VERIFICATION, VERIFIED_CONSULTANT } from "../../test_data/admin.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna menyetujui verifikasi konsultan itu", async ({ detailVerifikasiPage }) => {
  await detailVerifikasiPage.approve();
});

// ── VER-004 · Admin menyetujui verifikasi konsultan

Then("data pengajuan konsultan baru tampil lengkap", async ({ page }) => {
  await expect(page.getByText(APPLICANT.name).first()).toBeVisible();
  await expect(page.getByText(APPLICANT.email).first()).toBeVisible();
  await expect(page.getByText(APPLICANT.priceLabel).first()).toBeVisible();
});

Then("konsultan baru tersimpan sebagai terverifikasi", async () => {
  await expect.poll(async () => (await findKonsultan("konsultan baru")).status_verifikasi).toBe("terverifikasi");
});

// ── VER-005 · Penolakan verifikasi tidak bisa dikirim tanpa alasan

When("pengguna hendak menolak verifikasi tanpa menulis alasan", async ({ detailVerifikasiPage }) => {
  await detailVerifikasiPage.startRejecting();
  await detailVerifikasiPage.reasonInput.fill(VERIFICATION.blankReason);
});

Then("penolakan belum dapat dikirim", async ({ detailVerifikasiPage }) => {
  await expect(detailVerifikasiPage.confirmRejectButton).toBeDisabled();
});

// ── VER-005 · Admin menolak verifikasi konsultan dengan alasan

When("pengguna menolak verifikasi konsultan itu dengan sebuah alasan", async ({ detailVerifikasiPage }) => {
  await detailVerifikasiPage.startRejecting();
  await detailVerifikasiPage.reasonInput.fill(VERIFICATION.rejectionReason);
  await detailVerifikasiPage.confirmRejectButton.click();
});

Then("konsultan baru tersimpan sebagai ditolak beserta alasannya", async () => {
  await expect.poll(async () => (await findKonsultan("konsultan baru")).status_verifikasi).toBe("ditolak");
  expect((await findKonsultan("konsultan baru")).alasan_penolakan).toBe(VERIFICATION.rejectionReason);
});

// ── VER-006 · Konsultan yang sudah terverifikasi tidak bisa diputuskan ulang

Then("data konsultan uji tampil tanpa pilihan terima atau tolak", async ({ detailVerifikasiPage, page }) => {
  await expect(page.getByText(VERIFIED_CONSULTANT.name).first()).toBeVisible();
  await expect(detailVerifikasiPage.approveButton).toHaveCount(0);
});

// ── VER-007 · Pengajuan yang tidak ada diberitahukan ke admin

Then("halaman verifikasi menampilkan pesan data tidak ditemukan", async ({ detailVerifikasiPage }) => {
  await expect(detailVerifikasiPage.notFoundMessage).toBeVisible({ timeout: 20_000 });
});

// ── VER-008 BUG-16 · Kegagalan menyimpan keputusan diberitahukan ke admin

Then("admin diberi tahu bahwa keputusan gagal disimpan", async ({ page, dialogs }) => {
  await expect
    .poll(async () => dialogs.messages.length + (await page.getByText(/gagal/i).count()), { timeout: 4_000 })
    .toBeGreaterThan(0);
});
