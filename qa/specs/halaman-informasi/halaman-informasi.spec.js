import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { routeOf } from "../../pages/routes.js";
import { INFO_PAGES, UNKNOWN_PATH } from "../../test_data/beranda.data.js";

const mainHeading = (page) => page.getByRole("heading", { level: 1 });

// ── PUB-009 PUB-010 PUB-011 PUB-012 · Setiap halaman informasi dapat dibaca tanpa login

When("pengguna membuka setiap halaman informasi", async ({ page, world }) => {
  world.visits = [];
  for (const info of INFO_PAGES) {
    const response = await page.goto(routeOf(info.page));
    world.visits.push({ ...info, status: response?.status(), heading: await mainHeading(page).textContent() });
  }
});

Then("setiap halaman informasi berhasil dimuat dengan judulnya", async ({ world }) => {
  for (const visit of world.visits) {
    expect(visit.status, `halaman ${visit.page}`).toBe(200);
    expect(visit.heading, `halaman ${visit.page}`).toContain(visit.title);
  }
});

// ── PUB-013 · Alamat yang tidak dikenal menampilkan halaman tidak ditemukan

When("pengguna membuka alamat yang tidak dikenal", async ({ page, world }) => {
  world.response = await page.goto(UNKNOWN_PATH);
});

Then("halaman tidak ditemukan tampil", async ({ page, world }) => {
  expect(world.response?.status()).toBe(404);
  await expect(page.getByText(/could not be found/i)).toBeVisible();
});
