import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { chunksOfDocument } from "../../support/seed.js";
import { KNOWLEDGE_MESSAGES, LEGAL_DOCUMENT } from "../../test_data/admin.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna membuka detail dokumen uji", async ({ detailDokumenPage }) => {
  await detailDokumenPage.openFor(LEGAL_DOCUMENT.frbr_uri);
  await detailDokumenPage.articleListTitle.waitFor();
});

// ── KNW-008 · Admin membaca seluruh pasal sebuah dokumen

Then("detail dokumen menampilkan identitas dokumen uji", async ({ page }) => {
  await expect(page.getByText(LEGAL_DOCUMENT.detailLabel)).toBeVisible();
});

When("pengguna membuka semua pasal", async ({ detailDokumenPage }) => {
  await detailDokumenPage.openAllButton.click();
});

Then("isi setiap pasal dokumen uji tampil", async ({ page }) => {
  for (const chunk of LEGAL_DOCUMENT.chunks) await expect(page.getByText(chunk.isi_teks)).toBeVisible();
});

// ── KNW-008 · Admin memperbaiki isi sebuah pasal

When("pengguna menyunting isi pasal pertama", async ({ detailDokumenPage }) => {
  await detailDokumenPage.editFirstArticle(LEGAL_DOCUMENT.editedText);
});

Then("muncul keterangan perubahan pasal berhasil disimpan", async ({ page }) => {
  await expect(page.getByText(KNOWLEDGE_MESSAGES.chunkSaved)).toBeVisible();
});

Then("isi pasal pertama tersimpan di database", async () => {
  const [first] = await chunksOfDocument(LEGAL_DOCUMENT.frbr_uri);
  expect(first.isi_teks).toBe(LEGAL_DOCUMENT.editedText);
});

// ── KNW-009 · Detail dokumen tanpa dokumen yang dipilih menampilkan keadaan kosong

Then("detail dokumen menampilkan keadaan kosong", async ({ detailDokumenPage }) => {
  await expect(detailDokumenPage.noDataState).toBeVisible();
});
