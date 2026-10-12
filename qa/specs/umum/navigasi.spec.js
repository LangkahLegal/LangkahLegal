import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { routeOf, urlOf } from "../../pages/routes.js";

const QUICK = { timeout: 5_000 };

Given("pengguna berada di halaman {halaman}", async ({ page, world }, halaman) => {
  world.response = await page.goto(routeOf(halaman, world));
});

When("pengguna membuka halaman {halaman}", async ({ page, world }, halaman) => {
  world.response = await page.goto(routeOf(halaman, world));
});

Then("pengguna diarahkan ke halaman {halaman}", async ({ page, world }, halaman) => {
  await expect(page).toHaveURL(urlOf(routeOf(halaman, world)));
});

Then("pengguna segera diarahkan ke halaman {halaman}", async ({ page, world }, halaman) => {
  await expect(page).toHaveURL(urlOf(routeOf(halaman, world)), QUICK);
});

Then("pengguna tetap berada di halaman {halaman}", async ({ page, world }, halaman) => {
  await expect(page).toHaveURL(urlOf(routeOf(halaman, world)));
});

Then("pengguna melihat pesan {string}", async ({ page }, pesan) => {
  await expect(page.getByText(pesan).first()).toBeVisible();
});

Then("muncul pemberitahuan {string}", async ({ dialogs }, pesan) => {
  await dialogs.waitFor(pesan);
});

Then("tidak ada dialog yang muncul", async ({ page, dialogs }) => {
  await page.waitForTimeout(300);
  expect(dialogs.messages).toEqual([]);
});

Then("halaman tidak mengalami galat", async ({ page, pageErrors }) => {
  await expect(page.getByText(/Application error|client-side exception/i)).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
