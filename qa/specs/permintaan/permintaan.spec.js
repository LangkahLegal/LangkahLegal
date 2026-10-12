import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import {
  findConsultation,
  resetConsultationData,
  seedCase,
  seedConsultation,
  seedSchedule,
  wibDate,
} from "../../support/seed.js";
import { identity } from "../../support/state.js";
import { account } from "../../test_data/accounts.js";
import { OPEN_CASES } from "../../test_data/bursa.data.js";
import { SUPPORTING_DOCUMENT } from "../../test_data/detail-konsultasi.data.js";
import { CLAIM_SCHEDULE, REQUEST_MESSAGES } from "../../test_data/konsultan.data.js";
import { EXISTING_SESSION } from "../../test_data/konsultasi.data.js";

/** Kasus bursa yang sudah diambil konsultan uji tetapi belum punya jadwal. */
async function claimCaseWithoutSchedule(world) {
  await resetConsultationData();
  world.cleanups.push(resetConsultationData);
  const posted = await seedCase({ ...OPEN_CASES.pidana, tanggal_konsultasi: wibDate(CLAIM_SCHEDULE.dayOffset), status_bursa: "closed" });
  const unscheduled = { id_konsultan: identity("konsultan").idKonsultan, id_jadwal: null, tanggal: null };
  world.consultation = await seedConsultation(unscheduled, "pending", {
    id_bursa: posted.id_bursa,
    tanggal_pengajuan: null,
    jam_mulai: null,
    jam_selesai: null,
  });
}

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna menerima permintaan itu", async ({ permintaanPage }) => {
  await permintaanPage.acceptButton.click();
});

Then("permintaan dikonfirmasi diterima", async ({ page }) => {
  await expect(page.getByText(REQUEST_MESSAGES.accepted)).toBeVisible();
});

// ── REQ-001 · Konsultan menerima permintaan klien

Then("permintaan menampilkan klien, deskripsi kasus, dan dokumennya", async ({ page }) => {
  await expect(page.getByText(account("klien").name).first()).toBeVisible();
  await expect(page.getByText(EXISTING_SESSION.description)).toBeVisible();
  await expect(page.getByText(SUPPORTING_DOCUMENT.nama_dokumen)).toBeVisible();
});

When("pengguna kembali ke dashboard dari konfirmasi permintaan", async ({ permintaanPage }) => {
  await permintaanPage.backToDashboardButton.click();
});

// ── REQ-002 · Konsultan menolak permintaan klien

When("pengguna menolak permintaan itu", async ({ permintaanPage }) => {
  await permintaanPage.rejectButton.click();
});

Then("permintaan dikonfirmasi ditolak", async ({ page }) => {
  await expect(page.getByText(REQUEST_MESSAGES.rejected)).toBeVisible();
});

// ── REQ-003 BUG-09 · Permintaan yang sedang diproses tidak bisa diterima dua kali

When("pengguna menerima permintaan itu lalu menekan tombol terima sekali lagi", async ({ permintaanPage }) => {
  await permintaanPage.acceptTwice();
});

// ── REQ-004 · Kegagalan memproses permintaan diberitahukan ke konsultan

Then("permintaan tetap terbuka untuk ditinjau", async ({ permintaanPage }) => {
  await expect(permintaanPage.title).toBeVisible();
});

// ── REQ-005 · Konsultan menjadwalkan kasus yang diambil dari bursa

Given("konsultan uji mengambil kasus dari bursa dan punya jadwal praktik", async ({ world }) => {
  await claimCaseWithoutSchedule(world);
  world.schedule = await seedSchedule({
    tanggal: wibDate(CLAIM_SCHEDULE.dayOffset),
    jam_mulai: CLAIM_SCHEDULE.slot.start,
    jam_selesai: CLAIM_SCHEDULE.slot.end,
  });
});

Then("permintaan dari bursa belum bisa diterima sebelum dijadwalkan", async ({ permintaanPage }) => {
  await expect(permintaanPage.fromBursaBadge).toBeVisible();
  await expect(permintaanPage.scheduleAndAcceptButton).toBeDisabled();
});

When("pengguna menjadwalkan kasus itu pada jadwal praktiknya", async ({ permintaanPage }) => {
  await permintaanPage.schedule({
    slotLabel: CLAIM_SCHEDULE.slot.shown,
    start: CLAIM_SCHEDULE.chosen.start,
    end: CLAIM_SCHEDULE.chosen.end,
  });
});

Then("permintaan dikonfirmasi diterima dan dijadwalkan", async ({ page }) => {
  await expect(page.getByText(REQUEST_MESSAGES.scheduled)).toBeVisible();
});

Then("jadwal kasus itu tersimpan sesuai pilihan konsultan", async ({ world }) => {
  const saved = await findConsultation(world.consultation.id_pengajuan);
  expect(saved).toMatchObject({
    id_jadwal: world.schedule.id_jadwal,
    jam_mulai: CLAIM_SCHEDULE.chosen.start,
    jam_selesai: CLAIM_SCHEDULE.chosen.end,
  });
});

// ── REQ-006 · Kasus dari bursa tidak bisa dijadwalkan tanpa jadwal praktik

Given("konsultan uji mengambil kasus dari bursa tanpa punya jadwal praktik", async ({ world }) => {
  await claimCaseWithoutSchedule(world);
});

Then("permintaan menjelaskan bahwa belum ada jadwal praktik", async ({ permintaanPage }) => {
  await expect(permintaanPage.noSlotMessage).toBeVisible();
});

When("pengguna memilih menambah jadwal dari permintaan", async ({ permintaanPage }) => {
  await permintaanPage.scheduleLink.click();
});

// ── REQ-007 · Permintaan yang tidak ada diberitahukan ke konsultan

Then("permintaan menampilkan pesan data tidak ditemukan", async ({ permintaanPage }) => {
  await expect(permintaanPage.notFoundMessage).toBeVisible();
});
