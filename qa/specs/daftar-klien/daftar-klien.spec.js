import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { resetConsultationData, seedSession } from "../../support/seed.js";
import { ACTIVE_CLIENTS, CLIENT_ORDERS } from "../../test_data/konsultan.data.js";

/** Kartu klien dikenali dari jam mulai sesinya, karena semua sesi milik klien uji yang sama. */
async function expectOrder(daftarKlienPage, startTimes) {
  await expect(daftarKlienPage.cards).toHaveCount(startTimes.length);
  for (const [index, time] of startTimes.entries()) {
    await expect(daftarKlienPage.cards.nth(index)).toContainText(`${time} -`);
  }
}

// ── CLT-001 · Klien aktif dapat diurutkan menurut pengajuan dan jadwal

Given("konsultan uji punya beberapa klien aktif", async ({ world }) => {
  await resetConsultationData();
  world.cleanups.push(resetConsultationData);
  for (const { key, ...session } of ACTIVE_CLIENTS) await seedSession(session);
});

Then(
  "daftar klien menampilkan jumlah klien aktif dengan pengajuan terbaru di atas",
  async ({ daftarKlienPage }) => {
    await expect(daftarKlienPage.countHeading(ACTIVE_CLIENTS.length)).toBeVisible();
    await expectOrder(daftarKlienPage, CLIENT_ORDERS.Terbaru);
  },
);

When("pengguna mengurutkan klien dari pengajuan terlama", async ({ daftarKlienPage }) => {
  await daftarKlienPage.sortBy("Terlama");
});

Then("daftar klien tersusun dari pengajuan terlama", async ({ daftarKlienPage }) => {
  await expectOrder(daftarKlienPage, CLIENT_ORDERS.Terlama);
});

When("pengguna mengurutkan klien dari jadwal paling dekat", async ({ daftarKlienPage }) => {
  await daftarKlienPage.sortBy("Jadwal Terdekat");
});

Then("daftar klien tersusun dari jadwal paling dekat", async ({ daftarKlienPage }) => {
  await expectOrder(daftarKlienPage, CLIENT_ORDERS["Jadwal Terdekat"]);
});

// ── CLT-002 · Konsultan tanpa klien aktif melihat daftar kosong

Then("daftar klien menampilkan keadaan kosong", async ({ daftarKlienPage }) => {
  await expect(daftarKlienPage.emptyState).toBeVisible();
});

// ── CLT-002 · Gangguan saat memuat daftar klien diberitahukan ke konsultan

Then("daftar klien menampilkan pesan gagal memuat", async ({ daftarKlienPage }) => {
  await expect(daftarKlienPage.loadFailedMessage).toBeVisible({ timeout: 20_000 });
});
