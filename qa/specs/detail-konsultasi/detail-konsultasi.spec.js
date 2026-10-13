import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { findConsultation, ratingsOf } from "../../support/seed.js";
import { REVIEW, SUPPORTING_DOCUMENT, ZOOM } from "../../test_data/detail-konsultasi.data.js";
import { CONSULTATION_STATUSES, EXISTING_SESSION } from "../../test_data/konsultasi.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna memberi rating dan ulasan untuk sesi itu", async ({ detailKonsultasiPage }) => {
  await detailKonsultasiPage.openReviewForm();
  await detailKonsultasiPage.writeReview(REVIEW);
  await expect(detailKonsultasiPage.page.getByText(REVIEW.counter)).toBeVisible();
  await detailKonsultasiPage.sendReviewButton.click();
});

// ── CON-001 · Klien melihat detail sesi terjadwal dan bergabung lewat Zoom

Then(
  "detail konsultasi menampilkan status, deskripsi kasus, dokumen, dan tautan Zoom",
  async ({ detailKonsultasiPage, page }) => {
    await expect(detailKonsultasiPage.statusBadge(CONSULTATION_STATUSES.terjadwal.value)).toBeVisible();
    await expect(page.getByText(EXISTING_SESSION.description)).toBeVisible();
    await expect(page.getByText(SUPPORTING_DOCUMENT.nama_dokumen)).toBeVisible();
    await expect(page.getByText(ZOOM.link)).toBeVisible();
  },
);

When("pengguna bergabung ke sesi konsultasi", async ({ detailKonsultasiPage, context, world }) => {
  const opened = context.waitForEvent("page");
  await detailKonsultasiPage.joinButton.click();
  world.popup = await opened;
});

Then("tautan Zoom terbuka di tab baru", async ({ world }) => {
  expect(world.popup.url()).toContain(new URL(ZOOM.link).pathname);
});

// ── CON-002 · Klien menyalin tautan Zoom

When("pengguna menyalin tautan Zoom", async ({ detailKonsultasiPage, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await detailKonsultasiPage.copyLinkButton.click();
});

Then("tautan Zoom tersalin ke papan klip", async ({ detailKonsultasiPage, page }) => {
  await expect(detailKonsultasiPage.copiedIndicator).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(ZOOM.link);
});

// ── CON-003 · Klien menutup sesi dengan rating dan ulasan

Then("formulir ulasan tertutup", async ({ detailKonsultasiPage }) => {
  await expect(detailKonsultasiPage.reviewModalTitle).toHaveCount(0);
});

Then("ulasan tersimpan di database untuk konsultasi itu", async ({ world }) => {
  const [rating] = await ratingsOf(world.consultation.id_pengajuan);
  expect(rating).toMatchObject({ skor_rating: REVIEW.stars, ulasan_teks: REVIEW.text });
});

// ── CON-003 · Ulasan tidak dapat dikirim sebelum rating dipilih

When("pengguna membuka formulir ulasan", async ({ detailKonsultasiPage }) => {
  await detailKonsultasiPage.openReviewForm();
});

Then("ulasan belum dapat dikirim", async ({ detailKonsultasiPage }) => {
  await expect(detailKonsultasiPage.sendReviewButton).toBeDisabled();
});

// ── CON-004 · Ulasan dibatasi panjangnya

When("pengguna menulis ulasan yang melebihi batas panjang", async ({ detailKonsultasiPage }) => {
  await detailKonsultasiPage.openReviewForm();
  await detailKonsultasiPage.writeReview({ text: REVIEW.tooLong });
});

Then("ulasan dipotong sesuai batas panjangnya", async ({ detailKonsultasiPage, page }) => {
  await expect(page.getByText(REVIEW.maxCounter)).toBeVisible();
  expect((await detailKonsultasiPage.reviewInput.inputValue()).length).toBe(REVIEW.maxLength);
});

// ── CON-005 · Ulasan kedua untuk sesi yang sama ditolak

Then("formulir ulasan tetap terbuka", async ({ detailKonsultasiPage }) => {
  await expect(detailKonsultasiPage.reviewModalTitle).toBeVisible();
});

// ── CON-006 · Konsultasi yang dibatalkan tidak menawarkan Zoom maupun ulasan

Then(
  "detail konsultasi menampilkan status dibatalkan tanpa Zoom dan ulasan",
  async ({ detailKonsultasiPage }) => {
    await expect(detailKonsultasiPage.statusBadge(CONSULTATION_STATUSES.dibatalkan.value)).toBeVisible();
    await expect(detailKonsultasiPage.zoomSectionTitle).toHaveCount(0);
    await expect(detailKonsultasiPage.reviewButton).toHaveCount(0);
  },
);

// ── CON-007 · Konsultasi yang tidak ada menampilkan gagal memuat

Then(
  "detail konsultasi menampilkan gagal memuat dengan pilihan coba lagi",
  async ({ detailKonsultasiPage }) => {
    await expect(detailKonsultasiPage.loadFailedMessage).toBeVisible();
    await expect(detailKonsultasiPage.retryButton).toBeVisible();
  },
);

// ── CON-008 · Konsultan menambahkan tautan Zoom untuk sesi terjadwal

When("pengguna menyimpan tautan Zoom untuk sesi itu", async ({ detailKonsultasiPage }) => {
  await expect(detailKonsultasiPage.startSessionButton).toBeDisabled();
  await detailKonsultasiPage.saveZoomLink(ZOOM.newLink);
});

Then("tautan Zoom tersimpan di database untuk konsultasi itu", async ({ detailKonsultasiPage, world }) => {
  await expect(detailKonsultasiPage.zoomLinkInput).toHaveCount(0);
  const saved = await findConsultation(world.consultation.id_pengajuan);
  expect(saved.link_zoom).toBe(ZOOM.newLink);
});

// ── CON-009 · Tautan Zoom yang bukan alamat web ditolak

When("pengguna menyimpan tautan Zoom yang bukan alamat web", async ({ detailKonsultasiPage }) => {
  await detailKonsultasiPage.saveZoomLink(ZOOM.invalidLink);
});

// ── CON-010 · Konsultan tidak ditawari ulasan dan dapat mengurungkan pengisian tautan

When("pengguna mengurungkan pengisian tautan Zoom", async ({ detailKonsultasiPage }) => {
  await detailKonsultasiPage.addLinkButton.click();
  await detailKonsultasiPage.cancelEditButton.click();
});

Then("tautan Zoom tetap belum tersedia", async ({ detailKonsultasiPage }) => {
  await expect(detailKonsultasiPage.noLinkMessage).toBeVisible();
});

Then("konsultan tidak ditawari memberi ulasan", async ({ detailKonsultasiPage }) => {
  await expect(detailKonsultasiPage.reviewButton).toHaveCount(0);
});
