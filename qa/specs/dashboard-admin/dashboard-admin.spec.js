import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { konsultanWithStatus, usersWithRole } from "../../support/seed.js";
import { APPLICANT, STUBBED_APPLICANTS } from "../../test_data/admin.data.js";

// ── ADM-001 · Dashboard admin menampilkan statistik pengguna sesuai database

Then("statistik pengguna di dashboard admin sama dengan isi database", async ({ dashboardAdminPage }) => {
  await expect(dashboardAdminPage.container).toBeVisible();
  const expected = {
    "Total User": await usersWithRole(),
    "Total Client": await usersWithRole("client"),
    "Total Konsultan": await konsultanWithStatus(),
    "Pending Verifikasi": await konsultanWithStatus("pending"),
  };
  for (const [label, total] of Object.entries(expected)) {
    await expect(dashboardAdminPage.statCard(label), `kartu ${label}`).toContainText(String(total));
  }
});

// ── ADM-002 · Pengajuan verifikasi terbaru dapat dibuka dari dashboard

Then("pengajuan verifikasi konsultan baru tampil di dashboard admin", async ({ page }) => {
  await expect(page.getByText(APPLICANT.name)).toBeVisible();
});

When("pengguna membuka pengajuan verifikasi itu dari dashboard", async ({ dashboardAdminPage }) => {
  await dashboardAdminPage.detailButton.click();
});

// ── ADM-003 · Dashboard tetap tampil tanpa pengajuan dan tanpa statistik

Given("tidak ada pengajuan verifikasi yang menunggu", async ({ network }) => {
  await network.reply("daftar pengajuan verifikasi", { json: STUBBED_APPLICANTS.empty });
});

Then("dashboard admin menampilkan bahwa semua pengajuan sudah selesai", async ({ dashboardAdminPage, page }) => {
  await expect(dashboardAdminPage.allDoneState).toBeVisible();
  await expect(page.getByText("Rp 0").first()).toBeVisible();
});
