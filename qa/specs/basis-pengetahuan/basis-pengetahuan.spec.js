import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { chunksOfDocument } from "../../support/seed.js";
import {
  DOCUMENT_UPLOAD,
  JOBS,
  KNOWLEDGE_MESSAGES,
  KNOWLEDGE_SEARCH,
  LEGAL_DOCUMENT,
} from "../../test_data/admin.data.js";

const OUT_OF_RANGE_PAGE = 99999;

const documentRequests = (network) => network.calls("daftar dokumen");

/** Proses latar belakang tiruan: sekali "sedang diproses", lalu selesai. */
async function simulateJob(network, endpoint) {
  await network.reply(endpoint, { json: JOBS.queued });
  await network.intercept("status proses dokumen", (route, attempt) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(attempt < 2 ? { status: "processing" } : JOBS.completed),
    }),
  );
}

// ── Langkah bersama · dipakai lebih dari satu skenario

Given("unggahan dokumen akan diproses sampai selesai", async ({ network }) => {
  await simulateJob(network, "unggah dokumen");
});

When("pengguna mencari dokumen uji di basis pengetahuan", async ({ basisPengetahuanPage }) => {
  await basisPengetahuanPage.rows.first().waitFor();
  await basisPengetahuanPage.searchInput.fill(LEGAL_DOCUMENT.nama_uu);
  await expect(basisPengetahuanPage.row(LEGAL_DOCUMENT.nama_uu)).toHaveCount(1);
});

Then("daftar dokumen tetap berada di halaman kedua", async ({ basisPengetahuanPage }) => {
  await expect(basisPengetahuanPage.pageInput).toHaveValue("2", { timeout: 3_000 });
});

// ── KNW-001 · Daftar dokumen hukum menampilkan nomor, jumlah pasal, dan statusnya

Then("dokumen uji tampil dengan nomor, jumlah pasal, dan status hukumnya", async ({ basisPengetahuanPage }) => {
  const row = basisPengetahuanPage.row(LEGAL_DOCUMENT.nama_uu);
  await expect(row).toContainText(LEGAL_DOCUMENT.numberLabel);
  await expect(row.getByRole("cell", { name: String(LEGAL_DOCUMENT.chunks.length), exact: true })).toBeVisible();
  await expect(row).toContainText(LEGAL_DOCUMENT.statusLabel);
});

// ── KNW-002 · Pencarian dokumen menunggu admin selesai mengetik

When("pengguna mengetik kata pencarian dokumen huruf demi huruf", async ({ basisPengetahuanPage }) => {
  await basisPengetahuanPage.rows.first().waitFor();
  await basisPengetahuanPage.search(KNOWLEDGE_SEARCH.keyword);
});

Then("hanya satu pencarian dokumen yang dikirim ke backend", async ({ page, network }) => {
  const searches = () => documentRequests(network).filter((request) => request.query.search);
  await expect.poll(() => searches().length, { timeout: 5_000 }).toBe(1);
  await page.waitForTimeout(700);
  expect(searches()).toHaveLength(1);
  expect(searches()[0].query).toMatchObject({ search: KNOWLEDGE_SEARCH.keyword, page: "1" });
});

// ── KNW-003 · Dokumen dapat disaring berdasarkan kategori

When("pengguna menyaring dokumen berdasarkan kategori pidana", async ({ basisPengetahuanPage, page }) => {
  await basisPengetahuanPage.rows.first().waitFor();
  await page.waitForTimeout(700);
  await basisPengetahuanPage.categoryFilter(KNOWLEDGE_SEARCH.category.label).click();
});

Then("daftar dokumen diminta ke backend dengan kategori itu", async ({ network }) => {
  await expect
    .poll(() => documentRequests(network).map((request) => request.query.kategori))
    .toContain(KNOWLEDGE_SEARCH.category.query);
});

// ── KNW-003 · Nomor halaman di luar jangkauan dikembalikan ke halaman aktif

When(
  "pengguna berpindah ke halaman dokumen berikutnya lalu mengetik nomor halaman yang tidak ada",
  async ({ basisPengetahuanPage, page, network }) => {
    await basisPengetahuanPage.rows.first().waitFor();
    await page.waitForTimeout(700);
    await basisPengetahuanPage.nextPageButton.click();
    await expect.poll(() => documentRequests(network).map((request) => request.query.page)).toContain("2");
    await basisPengetahuanPage.goToPage(OUT_OF_RANGE_PAGE);
  },
);

// ── KNW-011 · Berpindah halaman segera setelah daftar dimuat tidak kembali ke halaman pertama

When("pengguna langsung berpindah ke halaman dokumen berikutnya", async ({ basisPengetahuanPage, page }) => {
  await basisPengetahuanPage.nextPageButton.click();
  await page.waitForTimeout(1_000);
});

// ── KNW-004 · Admin mengunggah dokumen hukum baru

When("pengguna mengunggah dokumen hukum baru", async ({ basisPengetahuanPage }) => {
  await basisPengetahuanPage.addButton.click();
  await basisPengetahuanPage.fillUploadForm(DOCUMENT_UPLOAD);
  await basisPengetahuanPage.uploadButton.click();
});

Then("proses dokumen berjalan lalu dinyatakan selesai", async ({ basisPengetahuanPage, page }) => {
  await expect(basisPengetahuanPage.processingBanner).toBeVisible();
  await expect(page.getByText(KNOWLEDGE_MESSAGES.completed)).toBeVisible({ timeout: 20_000 });
});

Then("data dokumen dikirim lengkap ke backend", async ({ network }) => {
  const body = String((await network.waitForCall("unggah dokumen")).body);
  for (const value of [DOCUMENT_UPLOAD.name, DOCUMENT_UPLOAD.number, DOCUMENT_UPLOAD.year, DOCUMENT_UPLOAD.legalStatus]) {
    expect(body).toContain(value);
  }
});

// ── KNW-004 · Formulir unggah belum bisa dikirim sebelum lengkap

When("pengguna membuka formulir unggah dokumen", async ({ basisPengetahuanPage }) => {
  await basisPengetahuanPage.addButton.click();
});

Then("dokumen belum dapat diunggah", async ({ basisPengetahuanPage }) => {
  await expect(basisPengetahuanPage.uploadButton).toBeDisabled();
});

// ── KNW-005 · Proses dokumen yang gagal diberitahukan ke admin

Given("ada proses dokumen yang berakhir gagal", async ({ page, network }) => {
  await page.addInitScript((jobId) => localStorage.setItem("activeJobId", jobId), JOBS.failed.id);
  await network.reply("status proses dokumen", { json: JOBS.failed.reply });
});

Then("kegagalan proses dokumen diberitahukan beserta penyebabnya", async ({ basisPengetahuanPage, page }) => {
  await expect(page.getByText(JOBS.failed.toast)).toBeVisible();
  await expect(basisPengetahuanPage.processingBanner).toHaveCount(0);
});

// ── KNW-006 · Admin menghapus dokumen beserta seluruh pasalnya

When("pengguna menghapus dokumen uji itu", async ({ basisPengetahuanPage }) => {
  await basisPengetahuanPage.row(LEGAL_DOCUMENT.nama_uu).getByRole("button", { name: "delete" }).click();
  await basisPengetahuanPage.deleteConfirmTitle.waitFor();
  await basisPengetahuanPage.confirmDeleteButton.click();
});

Then("muncul keterangan dokumen berhasil dihapus", async ({ page }) => {
  await expect(page.getByText(KNOWLEDGE_MESSAGES.deleted)).toBeVisible();
});

Then("dokumen uji beserta pasalnya hilang dari database", async () => {
  await expect.poll(async () => (await chunksOfDocument(LEGAL_DOCUMENT.frbr_uri)).length).toBe(0);
});

// ── KNW-007 · Admin mengganti berkas dokumen yang sudah ada

Given("penggantian dokumen akan diproses sampai selesai", async ({ network }) => {
  await simulateJob(network, "ganti dokumen");
});

When("pengguna mengganti berkas dokumen uji itu", async ({ basisPengetahuanPage, world }) => {
  await basisPengetahuanPage.row(LEGAL_DOCUMENT.nama_uu).getByRole("button", { name: "sync" }).click();
  await basisPengetahuanPage.replaceTitle.waitFor();
  world.prefilledName = await basisPengetahuanPage.nameInput.inputValue();
  await basisPengetahuanPage.fileInput.setInputFiles(DOCUMENT_UPLOAD.file);
  await basisPengetahuanPage.replaceButton.click();
});

Then("formulir ganti dokumen terisi data dokumen uji", async ({ world }) => {
  expect(world.prefilledName).toBe(LEGAL_DOCUMENT.nama_uu);
});

Then("penggantian dikirim ke backend untuk dokumen uji", async ({ network }) => {
  const request = await network.waitForCall("ganti dokumen");
  expect(String(request.body)).toContain(LEGAL_DOCUMENT.frbr_uri);
});

// ── KNW-010 · Tahun undang-undang di luar rentang ditolak

When("pengguna mengunggah dokumen dengan tahun yang tidak masuk akal", async ({ basisPengetahuanPage }) => {
  await basisPengetahuanPage.addButton.click();
  await basisPengetahuanPage.fillUploadForm({ ...DOCUMENT_UPLOAD, year: DOCUMENT_UPLOAD.invalidYear });
  await basisPengetahuanPage.uploadButton.click({ timeout: 2_000 }).catch(() => {});
});
