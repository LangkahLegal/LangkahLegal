import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { HISTORY_EXPECTATION } from "../../test_data/detail-konsultasi.data.js";

// ── HIS-001 · Riwayat mendahulukan sesi aktif dan menghitung sesi selesai

Then(
  "riwayat menampilkan semua konsultasi dengan sesi aktif di urutan teratas",
  async ({ riwayatKlienPage }) => {
    await expect(riwayatKlienPage.cards).toHaveCount(HISTORY_EXPECTATION.total);
    for (const [index, label] of HISTORY_EXPECTATION.firstLabels.entries()) {
      await expect(riwayatKlienPage.cards.nth(index)).toContainText(label);
    }
  },
);

Then("jumlah sesi selesai tampil di riwayat", async ({ riwayatKlienPage }) => {
  await riwayatKlienPage.showFinishedOnly();
  await expect(riwayatKlienPage.cards).toHaveCount(HISTORY_EXPECTATION.finished);
});

// ── HIS-002 · Klien tanpa konsultasi melihat riwayat kosong

Then("riwayat menampilkan keadaan kosong", async ({ riwayatKlienPage }) => {
  await expect(riwayatKlienPage.emptyState).toBeVisible();
  await expect(riwayatKlienPage.cards).toHaveCount(0);
});

// ── HIS-003 · Klien membuka detail konsultasi dari riwayat

When("pengguna membuka detail konsultasi dari riwayat", async ({ riwayatKlienPage }) => {
  await riwayatKlienPage.detailButtons.first().click();
});
