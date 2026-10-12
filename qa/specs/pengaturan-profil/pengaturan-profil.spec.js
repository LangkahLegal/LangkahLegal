import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { findKonsultan, findUser, setKonsultan, setUser } from "../../support/seed.js";
import { ACCOUNTS, account } from "../../test_data/accounts.js";
import { REJECTION_REASON } from "../../test_data/konsultan.data.js";
import { CREDENTIALS, PHOTO, PROFILE_EDIT } from "../../test_data/pengaturan.data.js";

const IMGBB = /api\.imgbb\.com/;

const imgbbReplies = (page, status, body) =>
  page.route(IMGBB, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(body),
    }),
  );

/** Mengembalikan profil akun uji ke nilai awalnya setelah skenario mengubahnya. */
const restoreKlien = (world) =>
  world.cleanups.push(() => setUser("klien", { nama: account("klien").name, foto_profil: null }));

const restoreKonsultanBaru = (world) =>
  world.cleanups.push(() => setKonsultan("konsultan baru", ACCOUNTS["konsultan baru"].konsultan));

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna mengunggah foto profil baru", async ({ pengaturanProfilPage, world }) => {
  restoreKlien(world);
  await pengaturanProfilPage.photoInput.setInputFiles(PHOTO.valid);
});

// ── PRF-001 · Klien mengubah namanya

When("pengguna mengganti namanya lalu menyimpan profil", async ({ pengaturanProfilPage, world }) => {
  restoreKlien(world);
  await expect(pengaturanProfilPage.nameInput).toHaveValue(account("klien").name);
  await pengaturanProfilPage.nameInput.fill(PROFILE_EDIT.newName);
  await pengaturanProfilPage.save();
});

Then("nama baru klien tersimpan di database", async () => {
  await expect.poll(async () => (await findUser("klien")).nama).toBe(PROFILE_EDIT.newName);
});

// ── PRF-001 · Formulir profil klien tidak memuat kredensial konsultan

Then(
  "formulir profil terisi data klien tanpa bagian kredensial profesional",
  async ({ pengaturanProfilPage }) => {
    await expect(pengaturanProfilPage.nameInput).toHaveValue(account("klien").name);
    await expect(pengaturanProfilPage.emailInput).toHaveValue(account("klien").email);
    await expect(pengaturanProfilPage.credentialsTitle).toHaveCount(0);
  },
);

// ── PRF-002 · Email tidak dapat diubah dari formulir profil

Then("kolom email profil hanya bisa dibaca", async ({ pengaturanProfilPage }) => {
  await expect(pengaturanProfilPage.emailInput).toHaveValue(account("klien").email);
  await expect(pengaturanProfilPage.emailInput).not.toBeEditable();
});

// ── PRF-003 · Konsultan memperbarui kredensial profesional dan portofolionya

When("pengguna memperbarui kredensial profesional dan portofolionya", async ({ pengaturanProfilPage, page, world }) => {
  restoreKonsultanBaru(world);
  await expect(pengaturanProfilPage.credentialsTitle).toBeVisible();
  await pengaturanProfilPage.fillCredentials(CREDENTIALS);
  await expect(page.getByText(CREDENTIALS.portfolioName).first()).toBeVisible();
  await pengaturanProfilPage.save();
});

Then(
  "kredensial profesional konsultan tersimpan di database beserta portofolionya",
  async () => {
    const saved = await findKonsultan("konsultan baru");
    expect(saved).toMatchObject(CREDENTIALS.stored);
    expect(saved.portofolio).toBeTruthy();
  },
);

// ── PRF-004 · Tarif dan pengalaman bernilai negatif ditolak

When(
  "pengguna mengisi tarif dan pengalaman dengan nilai negatif lalu menyimpan profil",
  async ({ pengaturanProfilPage, page, world }) => {
    restoreKonsultanBaru(world);
    await expect(pengaturanProfilPage.credentialsTitle).toBeVisible();
    await pengaturanProfilPage.fillCredentials(CREDENTIALS.negative);
    await pengaturanProfilPage.save();
    await page.waitForTimeout(800);
  },
);

Then("nilai negatif tidak tersimpan di database", async () => {
  const saved = await findKonsultan("konsultan baru");
  expect(saved.tarif_per_sesi).toBeGreaterThanOrEqual(0);
  expect(saved.pengalaman_tahun).toBeGreaterThanOrEqual(0);
});

// ── PRF-005 · Kegagalan menyimpan profil diberitahukan ke pengguna

When("pengguna menyimpan profil tanpa perubahan", async ({ pengaturanProfilPage }) => {
  await expect(pengaturanProfilPage.nameInput).toHaveValue(account("klien").name);
  await pengaturanProfilPage.save();
});

// ── PRF-006 · Foto profil yang terlalu besar ditolak

When("pengguna mengunggah foto profil yang terlalu besar", async ({ pengaturanProfilPage }) => {
  await pengaturanProfilPage.photoInput.setInputFiles(PHOTO.oversized);
});

// ── PRF-006 · Foto profil baru tersimpan dan tampil

Given("layanan unggah foto menerima foto profil", async ({ page }) => {
  await imgbbReplies(page, 200, { success: true, data: { url: PHOTO.uploadedUrl } });
  // Alamat hasil unggahan juga dilayani, karena avatar kembali ke gambar bawaan bila fotonya gagal dimuat.
  await page.route(PHOTO.uploadedUrl, (route) => route.fulfill({ path: PHOTO.valid, contentType: "image/png" }));
});

Then("foto profil baru tampil di halaman", async ({ pengaturanProfilPage }) => {
  await expect(pengaturanProfilPage.avatar).toHaveAttribute("src", PHOTO.uploadedUrl);
});

Then("alamat foto baru tersimpan di database", async () => {
  await expect.poll(async () => (await findUser("klien")).foto_profil).toBe(PHOTO.uploadedUrl);
});

// ── PRF-007 · Kegagalan mengunggah foto diberitahukan ke pengguna

Given("layanan unggah foto menolak foto profil", async ({ page }) => {
  await imgbbReplies(page, 400, { success: false });
});

// ── PRF-008 · Konsultan yang ditolak melihat alasan penolakan di profilnya

Then("profil menampilkan penolakan verifikasi beserta alasannya", async ({ pengaturanProfilPage, page }) => {
  await expect(pengaturanProfilPage.rejectionNotice).toBeVisible();
  await expect(page.getByText(`"${REJECTION_REASON}"`)).toBeVisible();
});

// ── PRF-009 · Label kolom profil terhubung ke kolomnya

Then("kolom nama dan email dapat ditemukan lewat labelnya", async ({ page }) => {
  await expect(page.getByLabel("Nama Lengkap")).toHaveValue(account("klien").name, { timeout: 3_000 });
  await expect(page.getByLabel("Email")).toHaveValue(account("klien").email);
});
