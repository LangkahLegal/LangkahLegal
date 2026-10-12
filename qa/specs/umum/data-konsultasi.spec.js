import { expect } from "@playwright/test";
import { Given, Then } from "../../hooks/bdd.js";
import {
  findConsultation,
  resetConsultationData,
  seedConsultation,
  seedDocument,
  seedRating,
  seedSchedule,
  seedTransaction,
  updateConsultation,
} from "../../support/seed.js";
import { HISTORY_STATUSES, REVIEW, SUPPORTING_DOCUMENT, ZOOM } from "../../test_data/detail-konsultasi.data.js";
import { CONSULTATION_STATUSES } from "../../test_data/konsultasi.data.js";
import { PAYMENT_STATUS } from "../../test_data/pembayaran.data.js";

/** Mengosongkan data konsultasi akun uji sekarang dan sekali lagi setelah skenario selesai. */
async function startClean(world) {
  await resetConsultationData();
  world.cleanups.push(resetConsultationData);
}

async function openSchedule(world) {
  await startClean(world);
  world.schedule = await seedSchedule();
  return world.schedule;
}

Given("klien belum punya konsultasi", async ({ world }) => {
  await startClean(world);
});

Given("klien punya konsultasi berstatus {statusKonsultasi}", async ({ world }, status) => {
  world.consultation = await seedConsultation(await openSchedule(world), status.value);
});

Given("klien punya konsultasi selesai dan pengajuan baru yang masih pending", async ({ world }) => {
  const schedule = await openSchedule(world);
  await seedConsultation(schedule, CONSULTATION_STATUSES.selesai.value);
  world.consultation = await seedConsultation(schedule, CONSULTATION_STATUSES.pending.value);
});

Given("konsultan uji membuka jadwal praktik", async ({ world }) => {
  await openSchedule(world);
});

Given("konsultan uji belum membuka jadwal praktik", async ({ world }) => {
  await startClean(world);
});

Given("konsultan uji sudah punya sesi terjadwal pada jadwal praktiknya", async ({ world }) => {
  world.consultation = await seedConsultation(await openSchedule(world), CONSULTATION_STATUSES.terjadwal.value);
});

Given("klien punya riwayat konsultasi dengan berbagai status", async ({ world }) => {
  const schedule = await openSchedule(world);
  for (const status of HISTORY_STATUSES) {
    world.consultation = await seedConsultation(schedule, CONSULTATION_STATUSES[status].value);
  }
});

Given("pembayaran konsultasi itu sudah lunas", async ({ world }) => {
  await seedTransaction(world.consultation, PAYMENT_STATUS.settled);
});

Given("pembayaran konsultasi itu masih tertunda", async ({ world }) => {
  await seedTransaction(world.consultation, PAYMENT_STATUS.pending);
});

Given("konsultasi itu punya tautan Zoom dan dokumen pendukung", async ({ world }) => {
  await updateConsultation(world.consultation.id_pengajuan, { link_zoom: ZOOM.link });
  await seedDocument(world.consultation, SUPPORTING_DOCUMENT);
});

Given("konsultasi itu sudah pernah diberi ulasan", async ({ world }) => {
  await seedRating(world.consultation, REVIEW);
});

Then("konsultasi itu tersimpan dengan status {statusKonsultasi}", async ({ world }, status) => {
  await expect
    .poll(async () => (await findConsultation(world.consultation.id_pengajuan))?.status_pengajuan)
    .toBe(status.value);
});
