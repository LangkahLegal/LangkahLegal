import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { konsultanWithStatus } from "../../support/seed.js";
import { APPLICANT, STUBBED_APPLICANTS, VERIFICATION, VERIFIED_CONSULTANT } from "../../test_data/admin.data.js";

// ── VER-001 · Jumlah pengajuan per status sama dengan isi database

Then("tab status menampilkan jumlah pengajuan sesuai database", async ({ verifikasiKonsultanPage }) => {
  const tabs = {
    Semua: await konsultanWithStatus(),
    Pending: await konsultanWithStatus("pending"),
    Terverifikasi: await konsultanWithStatus("terverifikasi"),
    Ditolak: await konsultanWithStatus("ditolak"),
  };
  for (const [label, total] of Object.entries(tabs)) {
    await expect(verifikasiKonsultanPage.tab(`${label} (${total})`)).toBeVisible();
  }
});

// ── VER-002 · Pengajuan dapat disaring ke status pending

When("pengguna menyaring pengajuan yang masih pending", async ({ verifikasiKonsultanPage }) => {
  await verifikasiKonsultanPage.tab(/^Pending \(\d+\)$/).click();
});

Then(
  "pengajuan konsultan baru tampil tanpa konsultan yang sudah terverifikasi",
  async ({ verifikasiKonsultanPage }) => {
    await expect(verifikasiKonsultanPage.name(APPLICANT.name)).toBeVisible();
    await expect(verifikasiKonsultanPage.name(new RegExp(`^${VERIFIED_CONSULTANT.name}$`))).toHaveCount(0);
  },
);

Then("daftar pengajuan diminta ke backend dengan status pending", async ({ network }) => {
  const filters = network.calls("daftar pengajuan verifikasi").map((request) => request.query.status_filter);
  expect(filters).toContain("pending");
});

// ── VER-003 · Pengajuan dapat dicari berdasarkan nama

When("pengguna mencari pengajuan berdasarkan nama konsultan baru", async ({ verifikasiKonsultanPage }) => {
  await verifikasiKonsultanPage.search(APPLICANT.name);
});

Then("hanya pengajuan konsultan baru yang tampil", async ({ verifikasiKonsultanPage }) => {
  await expect(verifikasiKonsultanPage.names).toHaveText([APPLICANT.name]);
});

// ── VER-003 · Pencarian pengajuan tanpa hasil menampilkan keadaan kosong

When("pengguna mencari pengajuan dengan kata yang tidak cocok", async ({ verifikasiKonsultanPage }) => {
  await verifikasiKonsultanPage.search(VERIFICATION.noMatchSearch);
});

Then("daftar pengajuan menampilkan keadaan kosong", async ({ verifikasiKonsultanPage }) => {
  await expect(verifikasiKonsultanPage.emptyState).toBeVisible();
});

// ── VER-009 · Pengajuan tanpa nama lengkap tidak merusak daftar

Given("daftar pengajuan berisi konsultan tanpa nama lengkap", async ({ network }) => {
  const { visibleName, ...reply } = STUBBED_APPLICANTS.withoutName;
  await network.reply("daftar pengajuan verifikasi", { json: reply });
});

Then("pengajuan lain tetap tampil di daftar", async ({ verifikasiKonsultanPage }) => {
  await expect(verifikasiKonsultanPage.name(STUBBED_APPLICANTS.withoutName.visibleName)).toBeVisible();
});
