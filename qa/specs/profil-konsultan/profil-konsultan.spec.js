import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { documentsOf, latestConsultationOfKlien } from "../../support/seed.js";
import { CATALOG_CONSULTANT } from "../../test_data/katalog-konsultan.data.js";
import { BOOKING, CONSULTATION_STATUSES, DOCUMENTS, TIME_OPTIONS } from "../../test_data/konsultasi.data.js";

const DISABLED = /cursor-not-allowed/;

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna melihat pilihan jam mulai", async ({ profilKonsultanPage }) => {
  await profilKonsultanPage.openStartTimes();
});

Then("pemesanan dikonfirmasi berhasil", async ({ profilKonsultanPage }) => {
  await expect(profilKonsultanPage.successTitle).toBeVisible();
});

Then("dokumen itu tidak masuk daftar lampiran", async ({ profilKonsultanPage, world }) => {
  await expect(profilKonsultanPage.attachment(world.attachedName)).toHaveCount(0);
});

// ── BOK-001 · Profil konsultan menampilkan informasi utamanya

Then(
  "profil menampilkan nama, status verifikasi, tarif, dan deskripsi konsultan uji",
  async ({ profilKonsultanPage, page }) => {
    await expect(profilKonsultanPage.heading(CATALOG_CONSULTANT.name)).toBeVisible();
    await expect(profilKonsultanPage.verifiedBadge).toBeVisible();
    await expect(page.getByText(CATALOG_CONSULTANT.priceLabel).first()).toBeVisible();
    await expect(page.getByText(CATALOG_CONSULTANT.description)).toBeVisible();
  },
);

// ── BOK-002 · Klien memesan konsultasi dengan dokumen pendukung

When("pengguna memesan konsultasi dengan dokumen pendukung", async ({ profilKonsultanPage }) => {
  await profilKonsultanPage.book({ start: BOOKING.start, description: BOOKING.description, document: DOCUMENTS.valid });
});

Then("pengajuan tersimpan menunggu persetujuan konsultan beserta dokumennya", async ({ world }) => {
  const saved = await latestConsultationOfKlien();
  expect(saved).toMatchObject({
    id_jadwal: world.schedule.id_jadwal,
    jam_mulai: BOOKING.startStored,
    jam_selesai: BOOKING.endStored,
    deskripsi_kasus: BOOKING.description,
    status_pengajuan: CONSULTATION_STATUSES.pending.value,
  });
  expect(saved.tanggal_pengajuan).toContain(world.schedule.tanggal);
  const documents = await documentsOf(saved.id_pengajuan);
  expect(documents.map((document) => document.nama_dokumen)).toEqual([DOCUMENTS.validName]);
});

When("pengguna kembali ke dashboard dari konfirmasi pemesanan", async ({ profilKonsultanPage }) => {
  await profilKonsultanPage.backToDashboardButton.click();
});

// ── BOK-003 · Pemesanan tanpa jadwal dan deskripsi ditolak

When("pengguna memesan konsultasi tanpa mengisi apa pun", async ({ profilKonsultanPage }) => {
  await profilKonsultanPage.book({});
});

// ── BOK-003 · Pemesanan dengan deskripsi kosong ditolak

When("pengguna memesan konsultasi dengan deskripsi yang hanya berisi spasi", async ({ profilKonsultanPage }) => {
  await profilKonsultanPage.book({ start: BOOKING.start, description: BOOKING.blankDescription });
});

// ── BOK-004 · Jam yang sudah dipesan tidak bisa dipilih

Then("jam yang sudah dipesan ditandai terisi dan tidak bisa dipilih", async ({ profilKonsultanPage }) => {
  for (const time of TIME_OPTIONS.booked) {
    await expect(profilKonsultanPage.timeOption(time)).toContainText("Terisi");
  }
  await profilKonsultanPage.timeOption(TIME_OPTIONS.booked[0]).click({ force: true });
  await expect(profilKonsultanPage.startTimeTrigger).toContainText("--:--");
});

// ── BOK-005 · Jam di luar jam praktik tidak bisa dipilih

Then("hanya jam di dalam jam praktik yang bisa dipilih", async ({ profilKonsultanPage }) => {
  for (const time of TIME_OPTIONS.outsideHours) {
    await expect(profilKonsultanPage.timeOption(time)).toHaveClass(DISABLED);
  }
  for (const time of TIME_OPTIONS.insideHours) {
    await expect(profilKonsultanPage.timeOption(time)).not.toHaveClass(DISABLED);
  }
});

// ── BOK-006 · Konsultan tanpa jadwal tidak menawarkan tanggal

Then("tidak ada tanggal konsultasi yang bisa dipilih", async ({ profilKonsultanPage }) => {
  await expect(profilKonsultanPage.scheduleTitle).toBeVisible();
  await expect(profilKonsultanPage.availableDates).toHaveCount(0);
});

// ── BOK-007 · Dokumen yang terlalu besar ditolak

When("pengguna melampirkan dokumen yang terlalu besar", async ({ profilKonsultanPage, world }) => {
  world.attachedName = DOCUMENTS.oversized.name;
  await profilKonsultanPage.attach(DOCUMENTS.oversized);
});

// ── BOK-007 · Dokumen yang sudah dilampirkan dapat dihapus

When("pengguna melampirkan lalu menghapus sebuah dokumen", async ({ profilKonsultanPage }) => {
  await profilKonsultanPage.attach(DOCUMENTS.valid);
  await expect(profilKonsultanPage.attachment(DOCUMENTS.validName)).toBeVisible();
  await profilKonsultanPage.removeAttachment(DOCUMENTS.validName);
});

Then("daftar lampiran kembali kosong", async ({ profilKonsultanPage }) => {
  await expect(profilKonsultanPage.attachment(DOCUMENTS.validName)).toHaveCount(0);
});

// ── BOK-008 · Berkas program tidak boleh dilampirkan

When("pengguna melampirkan berkas program", async ({ profilKonsultanPage, page, world }) => {
  world.attachedName = DOCUMENTS.executable.name;
  await profilKonsultanPage.attach(DOCUMENTS.executable);
  await page.waitForTimeout(500);
});

// ── BOK-009 · Penolakan backend saat memesan diberitahukan ke klien

When("pengguna memesan konsultasi tanpa dokumen", async ({ profilKonsultanPage }) => {
  await profilKonsultanPage.book({ start: BOOKING.start, description: BOOKING.description });
});

Then("pemesanan tidak dikonfirmasi berhasil", async ({ profilKonsultanPage }) => {
  await expect(profilKonsultanPage.successTitle).toHaveCount(0);
});

// ── BOK-010 · Pemesanan yang sedang diproses tidak bisa dikirim dua kali

When(
  "pengguna memesan konsultasi lalu menekan tombol pesan sekali lagi",
  async ({ profilKonsultanPage }) => {
    await profilKonsultanPage.book({ start: BOOKING.start, description: BOOKING.description });
    await profilKonsultanPage.processingButton.click({ force: true, timeout: 1_000 }).catch(() => {});
  },
);

// ── BOK-011 · Profil konsultan yang tidak ada diberitahukan ke klien

Then("profil menampilkan pesan konsultan tidak ditemukan", async ({ profilKonsultanPage }) => {
  await expect(profilKonsultanPage.notFoundMessage).toBeVisible({ timeout: 6_000 });
  await expect(profilKonsultanPage.bookButton).toHaveCount(0);
});
