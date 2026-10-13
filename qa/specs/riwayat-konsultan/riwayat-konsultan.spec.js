import { expect } from "@playwright/test";
import { Given, Then } from "../../hooks/bdd.js";
import { resetConsultationData, seedConsultation, seedSchedule } from "../../support/seed.js";
import { CONSULTANT_HISTORY } from "../../test_data/konsultan.data.js";

// ── CHI-001 · Riwayat konsultan tidak memuat pengajuan yang masih pending

Given("konsultan uji punya sesi selesai, pengajuan pending, dan sesi dibatalkan", async ({ world }) => {
  await resetConsultationData();
  world.cleanups.push(resetConsultationData);
  const schedule = await seedSchedule();
  for (const status of CONSULTANT_HISTORY.statuses) await seedConsultation(schedule, status);
});

Then(
  "riwayat konsultan hanya menampilkan sesi yang sudah diproses beserta jumlah sesi selesai",
  async ({ riwayatKonsultanPage }) => {
    await expect(riwayatKonsultanPage.cards).toHaveCount(CONSULTANT_HISTORY.shownLabels.length);
    for (const label of CONSULTANT_HISTORY.shownLabels) {
      await expect(riwayatKonsultanPage.cards.filter({ hasText: label })).toHaveCount(1);
    }
    await expect(riwayatKonsultanPage.cards.filter({ hasText: CONSULTANT_HISTORY.hiddenLabel })).toHaveCount(0);
    await expect(riwayatKonsultanPage.finishedBadge(CONSULTANT_HISTORY.finishedBadge)).toBeVisible();
  },
);

// ── CHI-002 · Konsultan tanpa sesi melihat riwayat kosong

Then("riwayat konsultan menampilkan keadaan kosong", async ({ riwayatKonsultanPage }) => {
  await expect(riwayatKonsultanPage.emptyState).toBeVisible();
  await expect(riwayatKonsultanPage.finishedBadge("0 Selesai")).toBeVisible();
});
