import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { resetConsultationData, seedSession } from "../../support/seed.js";
import { account } from "../../test_data/accounts.js";
import { DASHBOARD_TEXT, NEW_REQUESTS, REJECTION_REASON, UPCOMING_SESSIONS } from "../../test_data/konsultan.data.js";

async function startClean(world) {
  await resetConsultationData();
  world.cleanups.push(resetConsultationData);
}

// ── CDB-001 · Konsultan tanpa konsultasi melihat dashboard kosong

Then(
  "dashboard konsultan menampilkan sapaan, pendapatan nol, dan keadaan kosong",
  async ({ dashboardKonsultanPage, page }) => {
    await expect(dashboardKonsultanPage.greeting(account("konsultan").name)).toBeVisible();
    await expect(page.getByText(DASHBOARD_TEXT.emptyIncome).first()).toBeVisible();
    await expect(dashboardKonsultanPage.activeConsultationsLabel).toBeVisible();
    await expect(page.getByText(DASHBOARD_TEXT.noSchedule)).toBeVisible();
    await expect(page.getByText(DASHBOARD_TEXT.noRequest)).toBeVisible();
  },
);

// ── CDB-002 · Jadwal terdekat menampilkan sesi mendatang yang paling dekat

Given(
  "konsultan uji punya sesi terjadwal yang dekat, yang jauh, dan yang sudah lewat",
  async ({ world }) => {
    await startClean(world);
    for (const session of Object.values(UPCOMING_SESSIONS)) await seedSession({ ...session, shown: undefined, status: "terjadwal" });
  },
);

Then("hanya sesi yang paling dekat tampil sebagai jadwal terdekat", async ({ dashboardKonsultanPage }) => {
  const section = dashboardKonsultanPage.nextSessionSection;
  await expect(dashboardKonsultanPage.cardsIn(section)).toHaveCount(1);
  await expect(section).toContainText(UPCOMING_SESSIONS.nearest.shown);
});

// ── CDB-003 · Permintaan baru tidak menampilkan permintaan yang jadwalnya sudah lewat

Given(
  "konsultan uji menerima permintaan baru dan permintaan yang jadwalnya sudah lewat",
  async ({ world }) => {
    await startClean(world);
    await seedSession({ ...NEW_REQUESTS.expired, shown: undefined, status: "pending" });
    world.consultation = await seedSession({ ...NEW_REQUESTS.valid, shown: undefined, status: "pending" });
  },
);

Then(
  "hanya permintaan yang jadwalnya belum lewat tampil sebagai permintaan baru",
  async ({ dashboardKonsultanPage }) => {
    const section = dashboardKonsultanPage.newRequestsSection;
    await expect(dashboardKonsultanPage.cardsIn(section)).toHaveCount(1);
    await expect(section).toContainText(NEW_REQUESTS.valid.shown);
  },
);

When("pengguna membuka permintaan baru itu", async ({ dashboardKonsultanPage }) => {
  await dashboardKonsultanPage.detailButtonIn(dashboardKonsultanPage.newRequestsSection).click();
});

// ── CDB-004 · Konsultan yang verifikasinya ditolak diberi tahu alasannya

Then(
  "dashboard konsultan menampilkan penolakan verifikasi beserta alasannya",
  async ({ dashboardKonsultanPage, page }) => {
    await expect(dashboardKonsultanPage.rejectionNotice).toBeVisible();
    await expect(page.getByText(`"${REJECTION_REASON}"`)).toBeVisible();
  },
);

When("pengguna memilih pengaturan profil dari pemberitahuan penolakan", async ({ dashboardKonsultanPage }) => {
  await dashboardKonsultanPage.profileSettingsLink.click();
});

// ── CDB-005 · Gangguan saat memuat statistik tidak merusak dashboard

Then("dashboard konsultan tetap tampil dengan pendapatan nol", async ({ page }) => {
  await expect(page.getByText(DASHBOARD_TEXT.emptyIncome).first()).toBeVisible();
});
