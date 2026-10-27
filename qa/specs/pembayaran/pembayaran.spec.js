import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { midtrans } from "../../support/midtrans.js";
import { defineCases } from "../../support/parameter-types.js";
import { setTransactionStatus, transactionsOf } from "../../support/seed.js";
import { CATALOG_CONSULTANT } from "../../test_data/katalog-konsultan.data.js";
import { PAYMENT_STATUS, SNAP_OUTCOMES } from "../../test_data/pembayaran.data.js";

defineCases("hasilMidtrans", SNAP_OUTCOMES);

// ── Langkah bersama · dipakai lebih dari satu skenario

Given("Midtrans akan {hasilMidtrans}", async ({ page, network }, hasil) => {
  await midtrans.respondWith(page, hasil.callback);
  if (hasil.synced) await network.reply("sinkronisasi pembayaran", { json: hasil.synced });
});

When("pengguna membayar konsultasi", async ({ pembayaranPage }) => {
  await pembayaranPage.pay();
});

Then("pembayaran dikonfirmasi berhasil", async ({ pembayaranPage }) => {
  await expect(pembayaranPage.successTitle).toBeVisible();
});

// ── PAY-001 · Halaman pembayaran menampilkan konsultan dan rincian biaya

Then(
  "halaman pembayaran menampilkan konsultan, rincian biaya, dan tombol bayar",
  async ({ pembayaranPage, page }) => {
    await expect(pembayaranPage.container).toBeVisible();
    await expect(page.getByText(CATALOG_CONSULTANT.name).first()).toBeVisible();
    await expect(pembayaranPage.costBreakdownTitle).toBeVisible();
    await expect(pembayaranPage.pricePerSessionLabel).toBeVisible();
    await expect(page.getByText(CATALOG_CONSULTANT.priceLabel).first()).toBeVisible();
    await expect(pembayaranPage.payButton).toContainText("Bayar Sekarang");
  },
);

// ── PAY-002 · Klien menyelesaikan pembayaran

Then("transaksi tercatat di database untuk konsultasi itu", async ({ page, world }) => {
  const [transaction, ...others] = await transactionsOf(world.consultation.id_pengajuan);
  expect(others).toEqual([]);
  expect(transaction.snap_token).toBeTruthy();
  expect(await midtrans.tokens(page)).toEqual([transaction.snap_token]);
});

When("pengguna kembali ke dashboard dari konfirmasi pembayaran", async ({ pembayaranPage }) => {
  await pembayaranPage.backToDashboardButton.click();
});

// ── PAY-003 · Pembayaran yang belum diselesaikan mengembalikan klien ke dashboard
// Seluruh langkahnya memakai langkah bersama.

// ── PAY-004 · Pembayaran yang ditolak dapat dicoba kembali

Then("pengguna masih dapat membayar konsultasi", async ({ pembayaranPage }) => {
  await expect(pembayaranPage.payButton).toBeVisible();
});

// ── PAY-005 · Konsultasi yang belum disetujui tidak dapat dibayar

Then("jendela pembayaran Midtrans tidak dibuka", async ({ page }) => {
  expect(await midtrans.tokens(page)).toEqual([]);
});

// ── PAY-006 · Konsultasi yang sudah lunas langsung menampilkan konfirmasi
// Seluruh langkahnya memakai langkah bersama.

// ── PAY-012 · Pelunasan terdeteksi tanpa memuat ulang halaman

When("pembayaran itu dilunasi di luar aplikasi", async ({ pembayaranPage, world }) => {
  await expect(pembayaranPage.payButton).toBeVisible();
  await setTransactionStatus(world.consultation.id_pengajuan, PAYMENT_STATUS.settled);
});

// ── PAY-007 · Layanan pembayaran yang tidak tersedia diberitahukan ke klien

Given("layanan pembayaran Midtrans tidak dapat dimuat", async ({ page }) => {
  await midtrans.block(page);
});

Then("pengguna diberi tahu bahwa pembayaran tidak dapat diproses", async ({ dialogs }) => {
  await expect.poll(() => dialogs.messages.length, { timeout: 4_000 }).toBeGreaterThan(0);
});

// ── PAY-008 · Pembayaran untuk konsultasi yang tidak ada menampilkan gagal memuat

Then("halaman pembayaran menampilkan gagal memuat dengan pilihan coba lagi", async ({ pembayaranPage }) => {
  await expect(pembayaranPage.loadFailedTitle).toBeVisible();
  await expect(pembayaranPage.retryButton).toBeVisible();
});

// ── PAY-009 · Pembayaran yang sedang diproses tidak membuat transaksi ganda

When("pengguna membayar konsultasi lalu menekan tombol bayar sekali lagi", async ({ pembayaranPage }) => {
  await pembayaranPage.payTwice();
});

// ── PAY-005 · Konsultasi yang belum disetujui tidak dapat dibayar

Then("halaman pembayaran memberitahu konsultasi belum bisa dibayar", async ({ pembayaranPage }) => {
  await expect(pembayaranPage.notPayableNotice).toBeVisible();
  await expect(pembayaranPage.payButton).toHaveCount(0);
});
