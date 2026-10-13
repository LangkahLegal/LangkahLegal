import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import {
  closeCase,
  consultationOfCase,
  findCase,
  resetConsultationData,
  seedCase,
  wibDate,
} from "../../support/seed.js";
import { identity } from "../../support/state.js";
import { CASE_POST, OPEN_CASES } from "../../test_data/bursa.data.js";

const CLAMPED = /line-clamp-3/;

// ── Langkah bersama · dipakai lebih dari satu skenario

Given("klien uji memposting beberapa kasus ke bursa", async ({ world }) => {
  await resetConsultationData();
  world.cleanups.push(resetConsultationData);
  world.cases = {};
  for (const [name, values] of Object.entries(OPEN_CASES)) {
    world.cases[name] = await seedCase({ ...values, tanggal_konsultasi: wibDate(CASE_POST.dayOffset) });
  }
});

When("pengguna mengklaim sebuah kasus", async ({ bursaKasusPage, world }) => {
  world.claimedCase = world.cases.pidana;
  await bursaKasusPage.claim(world.claimedCase.id_bursa);
  await bursaKasusPage.claimedTitle.waitFor();
});

// ── BUR-001 · Kasus terbuka tampil anonim beserta dokumennya

Then("kasus klien uji tampil anonim di bursa beserta tautan dokumennya", async ({ bursaKasusPage, world }) => {
  await expect(bursaKasusPage.countBadge).toBeVisible();
  for (const posted of Object.values(world.cases)) {
    await expect(bursaKasusPage.card(posted.id_bursa)).toContainText("Klien Anonim");
  }
  const document = bursaKasusPage.card(world.cases.perdata.id_bursa).getByRole("link", { name: /Lihat Dokumen/ });
  await expect(document).toHaveAttribute("href", OPEN_CASES.perdata.dokumen_bukti);
});

// ── BUR-002 · Bursa dapat disaring berdasarkan kategori

When("pengguna menyaring bursa berdasarkan kategori pidana", async ({ bursaKasusPage }) => {
  await bursaKasusPage.categoryButton("Pidana").click();
});

Then("hanya kasus pidana milik klien uji yang tampil", async ({ bursaKasusPage, world }) => {
  await expect(bursaKasusPage.card(world.cases.pidana.id_bursa)).toBeVisible();
  await expect(bursaKasusPage.card(world.cases.perdata.id_bursa)).toHaveCount(0);
  await expect(bursaKasusPage.card(world.cases.umum.id_bursa)).toHaveCount(0);
});

// ── BUR-002 · Bursa dapat disaring ke kategori umum

When("pengguna menyaring bursa berdasarkan kategori umum", async ({ bursaKasusPage }) => {
  await bursaKasusPage.categoryButton("Umum").click();
});

Then("hanya kasus umum milik klien uji yang tampil", async ({ bursaKasusPage, world }) => {
  await expect(bursaKasusPage.card(world.cases.umum.id_bursa)).toBeVisible();
  await expect(bursaKasusPage.card(world.cases.pidana.id_bursa)).toHaveCount(0);
});

// ── BUR-003 · Deskripsi kasus yang panjang dapat diperluas dan diciutkan

Then("deskripsi kasus yang panjang tampil terpotong", async ({ bursaKasusPage, world }) => {
  await expect(bursaKasusPage.description(world.cases.perdata.id_bursa)).toHaveClass(CLAMPED);
});

When("pengguna memperluas deskripsi kasus itu", async ({ bursaKasusPage, world }) => {
  await bursaKasusPage.card(world.cases.perdata.id_bursa).getByRole("button", { name: /Lihat Selengkapnya/ }).click();
});

Then("deskripsi kasus itu tampil utuh", async ({ bursaKasusPage, world }) => {
  await expect(bursaKasusPage.description(world.cases.perdata.id_bursa)).not.toHaveClass(CLAMPED);
});

When("pengguna menciutkan deskripsi kasus itu", async ({ bursaKasusPage, world }) => {
  await bursaKasusPage.card(world.cases.perdata.id_bursa).getByRole("button", { name: /Sembunyikan/ }).click();
});

// ── BUR-004 · Deskripsi kasus berisi skrip ditampilkan sebagai teks biasa

Then("deskripsi berisi skrip tampil sebagai teks biasa", async ({ bursaKasusPage, world }) => {
  const posted = world.cases.umum;
  await expect(bursaKasusPage.description(posted.id_bursa)).toContainText(OPEN_CASES.umum.deskripsi_kasus_awam);
  await expect(bursaKasusPage.card(posted.id_bursa).locator("img")).toHaveCount(0);
});

// ── BUR-005 · Konsultan mengurungkan klaim kasus

When("pengguna mengurungkan klaim sebuah kasus", async ({ bursaKasusPage, world }) => {
  world.claimedCase = world.cases.pidana;
  await bursaKasusPage.startClaim(world.claimedCase.id_bursa);
  await bursaKasusPage.cancelClaimButton.click();
  await expect(bursaKasusPage.claimModal).toHaveCount(0);
});

Then("kasus itu tetap terbuka di bursa", async ({ world }) => {
  expect((await findCase(world.claimedCase.id_bursa)).status_bursa).toBe("open");
});

// ── BUR-006 · Konsultan mengklaim kasus dan membuka konsultasinya

Then("klaim kasus dikonfirmasi berhasil", async ({ bursaKasusPage }) => {
  await expect(bursaKasusPage.claimedTitle).toBeVisible();
});

Then("kasus itu tertutup dan menjadi konsultasi konsultan uji", async ({ world }) => {
  expect((await findCase(world.claimedCase.id_bursa)).status_bursa).toBe("closed");
  world.consultation = await consultationOfCase(world.claimedCase.id_bursa);
  expect(world.consultation.id_konsultan).toBe(identity("konsultan").idKonsultan);
});

When("pengguna membuka konsultasi hasil klaim", async ({ bursaKasusPage }) => {
  await bursaKasusPage.viewConsultationButton.click();
});

// ── BUR-007 · Konsultan kembali ke bursa setelah mengklaim kasus

When("pengguna kembali ke bursa dari konfirmasi klaim", async ({ bursaKasusPage }) => {
  await bursaKasusPage.backToBursaButton.click();
});

Then("daftar bursa tampil kembali", async ({ bursaKasusPage }) => {
  await expect(bursaKasusPage.listTitle).toBeVisible();
});

// ── BUR-008 · Kasus yang sudah diambil konsultan lain tidak bisa diklaim

When(
  "konsultan lain lebih dulu mengambil kasus yang hendak diklaim pengguna",
  async ({ bursaKasusPage, world }) => {
    const target = world.cases.pidana;
    await bursaKasusPage.startClaim(target.id_bursa);
    await closeCase(target.id_bursa);
    await bursaKasusPage.confirmClaimButton.click();
  },
);

Then("jendela konfirmasi klaim tertutup", async ({ bursaKasusPage }) => {
  await expect(bursaKasusPage.claimModal).toHaveCount(0);
});

// ── BUR-009 · Gangguan saat memuat bursa diberitahukan ke konsultan

Then("bursa menampilkan pesan gagal memuat", async ({ bursaKasusPage }) => {
  await expect(bursaKasusPage.loadFailedMessage).toBeVisible();
});

// ── BUR-010 · Bursa tanpa kasus menampilkan keadaan kosong

Given("bursa sedang tidak punya kasus terbuka", async ({ network }) => {
  await network.reply("daftar bursa", { json: { data: [], total: 0 } });
});

Then("bursa menampilkan keadaan kosong", async ({ bursaKasusPage, page }) => {
  await expect(bursaKasusPage.emptyState).toBeVisible();
  await expect(page.getByText("0 Kasus")).toBeVisible();
});
