import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";

// ── LNG-001 BUG-25 · Pilihan bahasa Inggris tersimpan

When("pengguna memilih bahasa Inggris lalu menyimpannya", async ({ pengaturanBahasaPage }) => {
  await pengaturanBahasaPage.englishOption.click();
  await pengaturanBahasaPage.saveButton.click();
});

Then("bahasa Inggris masih terpilih", async ({ pengaturanBahasaPage }) => {
  await expect(pengaturanBahasaPage.englishOption).toHaveClass(/bg-primary\/10/, { timeout: 3_000 });
});
