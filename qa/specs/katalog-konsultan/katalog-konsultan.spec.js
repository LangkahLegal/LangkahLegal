import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { defineCases } from "../../support/parameter-types.js";
import { CATALOG_CONSULTANT, SEARCHES, STUBBED_CATALOGS } from "../../test_data/katalog-konsultan.data.js";

defineCases("katalogTiruan", STUBBED_CATALOGS);

// ── Langkah bersama · dipakai lebih dari satu skenario

Given("katalog berisi konsultan dengan {katalogTiruan}", async ({ network, world }, katalog) => {
  world.stubbedCatalog = katalog;
  await network.reply("katalog konsultan", { json: { data: katalog.data, total: katalog.total } });
});

When("pengguna mencari konsultan uji berdasarkan namanya", async ({ katalogKonsultanPage }) => {
  await katalogKonsultanPage.search(CATALOG_CONSULTANT.name);
});

Then("setidaknya satu konsultan tampil di katalog", async ({ katalogKonsultanPage }) => {
  await expect(katalogKonsultanPage.cards.first()).toBeVisible();
});

Then("konsultan uji tampil di katalog", async ({ katalogKonsultanPage }) => {
  await expect(katalogKonsultanPage.card(CATALOG_CONSULTANT.name).first()).toBeVisible();
});

Then("setiap konsultan yang tampil cocok dengan keahlian itu", async ({ katalogKonsultanPage }) => {
  await expect(katalogKonsultanPage.cards.first()).toBeVisible();
  for (const text of await katalogKonsultanPage.cardTexts()) {
    expect(text.toLowerCase()).toContain(CATALOG_CONSULTANT.expertiseKeyword.toLowerCase());
  }
});

Then("katalog menampilkan keadaan kosong", async ({ katalogKonsultanPage }) => {
  await expect(katalogKonsultanPage.emptyState).toBeVisible();
  await expect(katalogKonsultanPage.cards).toHaveCount(0);
});

// ── EXP-001 · Konsultan aktif tampil di katalog beserta tarifnya

Then("konsultan uji tampil di katalog beserta tarifnya", async ({ katalogKonsultanPage }) => {
  await expect(katalogKonsultanPage.card(CATALOG_CONSULTANT.name).first()).toContainText(CATALOG_CONSULTANT.priceLabel);
});

// ── EXP-002 · Pencarian nama tidak membedakan huruf besar dan kecil

When("pengguna mencari konsultan uji dengan kapitalisasi yang berbeda", async ({ katalogKonsultanPage }) => {
  await katalogKonsultanPage.search(CATALOG_CONSULTANT.nameMixedCase);
});

// ── EXP-003 · Konsultan dapat dicari berdasarkan keahlian

When("pengguna mencari berdasarkan keahlian konsultan uji", async ({ katalogKonsultanPage, page }) => {
  await katalogKonsultanPage.search(CATALOG_CONSULTANT.expertiseKeyword);
  await page.waitForResponse((response) => response.url().includes("search="));
});

// ── EXP-004 · Pencarian tanpa hasil menampilkan keadaan kosong

When("pengguna mencari kata yang tidak cocok dengan konsultan mana pun", async ({ katalogKonsultanPage }) => {
  await katalogKonsultanPage.search(SEARCHES.noMatch);
});

// ── EXP-005 · Kata pencarian yang tidak wajar tidak merusak katalog

When(
  "pengguna mencari dengan kata yang sangat panjang, berisi skrip, perintah SQL, dan emoji",
  async ({ katalogKonsultanPage, world }) => {
    world.searchOutcomes = [];
    for (const keyword of SEARCHES.extreme) {
      await katalogKonsultanPage.search(keyword);
      const empty = await katalogKonsultanPage.emptyState
        .waitFor({ state: "visible", timeout: 8_000 })
        .then(() => true)
        .catch(() => false);
      world.searchOutcomes.push({ keyword: keyword.slice(0, 30), empty });
      await katalogKonsultanPage.search("");
      await katalogKonsultanPage.cards.first().waitFor();
    }
  },
);

Then("setiap pencarian itu berakhir dengan keadaan kosong", async ({ world }) => {
  for (const { keyword, empty } of world.searchOutcomes) {
    expect(empty, `pencarian "${keyword}" seharusnya tanpa hasil`).toBe(true);
  }
});

// ── EXP-006 · Katalog dapat disaring berdasarkan kategori hukum

When("pengguna menyaring katalog berdasarkan kategori konsultan uji", async ({ katalogKonsultanPage, page }) => {
  await katalogKonsultanPage.cards.first().waitFor();
  const filtered = page.waitForResponse((response) => response.url().includes("spesialisasi="));
  await katalogKonsultanPage.chooseCategory(CATALOG_CONSULTANT.category.label);
  await filtered;
});

Then("katalog diminta ke backend dengan kategori itu", async ({ network }) => {
  const queries = network.calls("katalog konsultan").map((request) => request.query.spesialisasi);
  expect(queries).toContain(CATALOG_CONSULTANT.category.query);
});

// ── EXP-007 · Saringan verifikasi dan tarif dapat dipakai lalu diatur ulang

When(
  "pengguna menyaring konsultan terverifikasi pada rentang tarif konsultan uji",
  async ({ katalogKonsultanPage }) => {
    await expect(katalogKonsultanPage.resetButton).toBeDisabled();
    await katalogKonsultanPage.chooseVerification(CATALOG_CONSULTANT.verification);
    await katalogKonsultanPage.setPriceRange(CATALOG_CONSULTANT.priceRange);
  },
);

When("pengguna mengatur ulang saringan katalog", async ({ katalogKonsultanPage }) => {
  await katalogKonsultanPage.resetButton.click();
});

Then("saringan katalog kembali ke keadaan awal", async ({ katalogKonsultanPage }) => {
  await expect(katalogKonsultanPage.resetButton).toBeDisabled();
  await expect(katalogKonsultanPage.minPriceInput).toHaveValue("");
  await expect(katalogKonsultanPage.maxPriceInput).toHaveValue("");
});

// ── EXP-008 · Rentang tarif yang terbalik tidak menghasilkan konsultan

When("pengguna menyaring dengan tarif minimum di atas tarif maksimum", async ({ katalogKonsultanPage }) => {
  await katalogKonsultanPage.setPriceRange(SEARCHES.reversedPrice);
});

// ── EXP-009 · Foto profil dengan alamat berbahaya tidak dipakai

Then("foto konsultan itu diganti gambar bawaan", async ({ katalogKonsultanPage, world }) => {
  const photo = katalogKonsultanPage.card(world.stubbedCatalog.name).locator("img");
  await expect(photo).toHaveAttribute("src", /ui-avatars\.com/);
});

// ── EXP-010 · Konsultan tanpa nama tidak merusak katalog

Then("konsultan lain tetap tampil di katalog", async ({ katalogKonsultanPage, world }) => {
  await expect(katalogKonsultanPage.card(world.stubbedCatalog.name).first()).toBeVisible();
});

// ── EXP-011 · Gangguan saat memuat katalog diberitahukan ke klien

Then("katalog menampilkan pesan gagal memuat", async ({ katalogKonsultanPage }) => {
  await expect(katalogKonsultanPage.loadErrorMessage).toBeVisible({ timeout: 6_000 });
});

// ── EXP-012 · Klien membuka profil konsultan dari katalog

When("pengguna membuka profil konsultan uji dari katalog", async ({ katalogKonsultanPage }) => {
  await katalogKonsultanPage.openProfile(CATALOG_CONSULTANT.name);
});
