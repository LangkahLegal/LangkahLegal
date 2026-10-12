import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { readSessionStorage } from "../../support/browser.js";

// ── AUTH-016 · Peran klien terpilih sejak awal

Then("peran {peranDaftar} sudah terpilih", async ({ peranPage }, peran) => {
  await expect(peranPage.radio(peran.key)).toBeChecked();
});

// ── AUTH-016 · Memilih peran konsultan membuka formulir pendaftaran konsultan

When("pengguna memilih mendaftar sebagai {peranDaftar}", async ({ peranPage }, peran) => {
  await peranPage.choose(peran.key);
});

Then("formulir pendaftaran {peranDaftar} tampil", async ({ page }, peran) => {
  await expect(page.getByText(peran.formTitle)).toBeVisible();
  expect(await readSessionStorage(page, "pending_role")).toBe(peran.role);
});
