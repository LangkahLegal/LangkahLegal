import { expect } from "@playwright/test";
import { Then } from "../../hooks/bdd.js";

// ── ABT-001 · Halaman tentang aplikasi dapat dibuka dari pengaturan

Then("halaman tentang aplikasi menampilkan penjelasan LangkahLegal", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Tentang LangkahLegal" })).toBeVisible();
  await expect(page.getByText(/Mendigitalisasi/)).toBeVisible();
});
