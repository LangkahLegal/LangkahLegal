import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { FEATURED_SERVICES } from "../../pages/dashboard-klien/dashboard-klien.page.js";
import { account } from "../../test_data/accounts.js";
import { CATALOG_CONSULTANT } from "../../test_data/katalog-konsultan.data.js";
import { MESSAGES } from "../../test_data/konsultasi.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

Then(
  "kartu konsultasi menampilkan konsultan uji dengan status {statusKonsultasi}",
  async ({ dashboardKlienPage, page }, status) => {
    await expect(page.getByText(CATALOG_CONSULTANT.name).first()).toBeVisible();
    await expect(dashboardKlienPage.statusLabel(status.label)).toBeVisible();
  },
);

Then("kartu konsultasi kosong tampil", async ({ dashboardKlienPage }) => {
  await expect(dashboardKlienPage.emptyCard).toBeVisible();
});

// ── CLI-001 · Klien tanpa konsultasi melihat sapaan dan layanan unggulan

Then(
  "dashboard klien menampilkan sapaan, layanan unggulan, dan kartu konsultasi kosong",
  async ({ dashboardKlienPage }) => {
    await expect(dashboardKlienPage.greeting(account("klien").name)).toBeVisible();
    await expect(dashboardKlienPage.emptyCard).toBeVisible();
    for (const service of FEATURED_SERVICES) await expect(dashboardKlienPage.service(service)).toBeVisible();
  },
);

// ── CLI-002 · Klien tanpa konsultasi mencari konsultan dari dashboard

When("pengguna memilih cari konsultan", async ({ dashboardKlienPage }) => {
  await dashboardKlienPage.findConsultantLink.click();
});

// ── CLI-003 · Dashboard menampilkan pengajuan aktif, bukan konsultasi yang sudah selesai
// Seluruh langkahnya memakai langkah bersama.

// ── CLI-004 · Klien membatalkan pengajuan yang masih pending

When("pengguna membatalkan konsultasi itu", async ({ dashboardKlienPage, dialogs }) => {
  await dashboardKlienPage.cancelConsultation();
  await dialogs.waitFor(MESSAGES.cancelConfirm);
});

// ── CLI-005 · Klien mengurungkan pembatalan

When("pengguna mengurungkan pembatalan konsultasi itu", async ({ dashboardKlienPage, dialogs }) => {
  dialogs.acceptConfirm = false;
  await dashboardKlienPage.cancelConsultation();
  await dialogs.waitFor(MESSAGES.cancelConfirm);
});

// ── CLI-006 · Klien melanjutkan ke pembayaran dari dashboard

When("pengguna memilih lanjut pembayaran", async ({ dashboardKlienPage }) => {
  await dashboardKlienPage.payButton.click();
});

// ── CLI-007 · Konsultasi ditolak yang disembunyikan tetap tersembunyi

When("pengguna menyembunyikan konsultasi yang ditolak itu", async ({ dashboardKlienPage }) => {
  await dashboardKlienPage.hideConsultation();
});

When("pengguna memuat ulang halaman", async ({ page }) => {
  await page.reload();
});

// ── CLI-008 · Data tersimpan yang rusak di browser tidak merusak dashboard

Given("daftar konsultasi tersembunyi di browser rusak", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("hidden_rejected_ids", "{rusak"));
});

// ── CLI-009 · Gangguan saat memuat konsultasi diberitahukan ke klien

Then("dashboard klien menampilkan pesan gagal memuat", async ({ dashboardKlienPage }) => {
  await expect(dashboardKlienPage.loadErrorMessage).toBeVisible({ timeout: 6_000 });
  await expect(dashboardKlienPage.emptyCard).toHaveCount(0);
});

// ── CLI-010 · Klien menuju katalog konsultan dari layanan unggulan

When("pengguna memilih layanan eksplorasi konsultan", async ({ dashboardKlienPage }) => {
  await dashboardKlienPage.service("Eksplorasi Konsultan").click();
});

// ── CLI-010 · Klien menuju pengaturan dari dashboard

When("pengguna memilih pengaturan di dashboard", async ({ dashboardKlienPage }) => {
  await dashboardKlienPage.settingsButton.click();
});

// ── CLI-011 · Klien berpindah ke riwayat lewat navigasi bawah

When("pengguna memilih riwayat di navigasi bawah", async ({ dashboardKlienPage }) => {
  await dashboardKlienPage.bottomNavLink("Riwayat").click();
});
