import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import {
  latestCaseOfKlien,
  resetConsultationData,
  seedConsultation,
  seedSchedule,
  wibDate,
} from "../../support/seed.js";
import { CASE_POST, CATEGORIES, MAX_DOCUMENTS, OWN_SESSION, PAST_TIME_CHECK } from "../../test_data/bursa.data.js";
import { CONSULTATION_STATUSES } from "../../test_data/konsultasi.data.js";

const DISABLED = /cursor-not-allowed/;

const pdfNamed = (name) => ({ name, mimeType: "application/pdf", buffer: Buffer.from("%PDF") });

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna memposting kasus pidana dengan jadwal dan dokumen", async ({ postingKasusPage }) => {
  await postingKasusPage.categoryButton(CASE_POST.category.label).click();
  await postingKasusPage.descriptionInput.fill(CASE_POST.typedDescription);
  await postingKasusPage.pickDate(wibDate(CASE_POST.dayOffset), wibDate());
  await postingKasusPage.pickStartTime(CASE_POST.start);
  await postingKasusPage.attach(CASE_POST.document);
  await postingKasusPage.submitButton.click();
});

// ── BPO-001 · Formulir posting kasus menjelaskan bahwa kasus diposting anonim

Then(
  "formulir posting kasus menampilkan pilihan kategori dan keterangan anonim",
  async ({ postingKasusPage }) => {
    await expect(postingKasusPage.container).toBeVisible();
    await expect(postingKasusPage.title).toBeVisible();
    for (const category of CATEGORIES) await expect(postingKasusPage.categoryButton(category)).toBeVisible();
    await expect(postingKasusPage.anonymousNote).toBeVisible();
  },
);

// ── BPO-002 · Klien memposting kasus lengkap dengan dokumen

Then("posting kasus dikonfirmasi berhasil", async ({ postingKasusPage }) => {
  await expect(postingKasusPage.successTitle).toBeVisible();
});

Then("kasus tersimpan terbuka di bursa sesuai isian klien", async () => {
  const saved = await latestCaseOfKlien();
  expect(saved).toMatchObject({
    kategori_hukum: CASE_POST.category.value,
    deskripsi_kasus_awam: CASE_POST.storedDescription,
    jam_mulai: CASE_POST.startStored,
    jam_selesai: CASE_POST.endStored,
    status_bursa: "open",
  });
  expect(saved.tanggal_konsultasi).toContain(wibDate(CASE_POST.dayOffset));
  expect(saved.dokumen_bukti).toBeTruthy();
});

When("pengguna kembali ke dashboard dari konfirmasi posting", async ({ postingKasusPage }) => {
  await postingKasusPage.backToDashboardButton.click();
});

// ── BPO-003 · Posting tanpa isian apa pun ditolak

When("pengguna memposting kasus tanpa mengisi apa pun", async ({ postingKasusPage }) => {
  await postingKasusPage.submitButton.click();
});

// ── BPO-003 · Posting tanpa jadwal ditolak

When("pengguna memposting kasus tanpa memilih jadwal", async ({ postingKasusPage }) => {
  await postingKasusPage.descriptionInput.fill(CASE_POST.storedDescription);
  await postingKasusPage.submitButton.click();
});

// ── BPO-004 · Penolakan backend saat memposting diberitahukan ke klien
// Seluruh langkahnya memakai langkah bersama.

// ── BPO-005 · Jam yang bentrok dengan konsultasi klien sendiri tidak ditawarkan

Given("klien sudah punya sesi konsultasi besok", async ({ world }) => {
  await resetConsultationData();
  world.cleanups.push(resetConsultationData);
  const schedule = await seedSchedule({ tanggal: wibDate(OWN_SESSION.dayOffset) });
  await seedConsultation(schedule, CONSULTATION_STATUSES.terjadwal.value, {
    jam_mulai: OWN_SESSION.start,
    jam_selesai: OWN_SESSION.end,
  });
});

When("pengguna melihat pilihan jam untuk besok", async ({ postingKasusPage }) => {
  await postingKasusPage.pickDate(wibDate(OWN_SESSION.dayOffset), wibDate());
  await postingKasusPage.openStartTimes();
});

Then("jam yang bentrok dengan sesinya ditandai terisi", async ({ postingKasusPage }) => {
  for (const time of OWN_SESSION.takenTimes) {
    await expect(postingKasusPage.timeOption(time)).toContainText("Terisi");
  }
  await expect(postingKasusPage.timeOption(OWN_SESSION.freeTime)).not.toContainText("Terisi");
});

// ── BPO-006 · Jam yang sudah lewat hari ini tidak ditawarkan

Given("waktu di browser menunjukkan siang hari", async ({ page }) => {
  await page.clock.setFixedTime(new Date(`${wibDate()}T${PAST_TIME_CHECK.now}+07:00`));
});

When("pengguna melihat pilihan jam untuk hari ini", async ({ postingKasusPage }) => {
  await postingKasusPage.pickDate(wibDate(), wibDate());
  await postingKasusPage.openStartTimes();
});

Then("hanya jam yang belum lewat yang bisa dipilih", async ({ postingKasusPage }) => {
  await expect(postingKasusPage.timeOption(PAST_TIME_CHECK.passed)).toHaveClass(DISABLED);
  await expect(postingKasusPage.timeOption(PAST_TIME_CHECK.upcoming)).not.toHaveClass(DISABLED);
});

// ── BPO-007 · Jumlah dokumen pendukung dibatasi

When("pengguna melampirkan dokumen melebihi batas jumlah", async ({ postingKasusPage }) => {
  for (let number = 1; number <= MAX_DOCUMENTS + 1; number++) {
    await postingKasusPage.attach(pdfNamed(`dokumen-${number}.pdf`));
  }
});

Then("hanya dokumen sebanyak batas yang masuk daftar lampiran", async ({ postingKasusPage, page }) => {
  await expect(page.getByText(`${MAX_DOCUMENTS} Files`)).toBeVisible();
  await expect(postingKasusPage.attachment(`dokumen-${MAX_DOCUMENTS + 1}.pdf`)).toHaveCount(0);
});
