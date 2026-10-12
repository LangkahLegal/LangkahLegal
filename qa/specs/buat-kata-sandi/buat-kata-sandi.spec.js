import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { presetSessionStorage } from "../../support/browser.js";
import { INVALID_PASSWORDS, NEW_PASSWORD } from "../../test_data/kata-sandi.data.js";

// ── AUTH-035 · Kata sandi dengan format tidak valid ditolak

When("pengguna membuat kata sandi dengan format tidak valid", async ({ buatKataSandiPage, world }) => {
  world.rejections = [];
  for (const attempt of INVALID_PASSWORDS.create) {
    await buatKataSandiPage.submit(attempt);
    world.rejections.push({ ...attempt, shown: await buatKataSandiPage.showsMessage(attempt.message) });
  }
});

// ── AUTH-036 · Kata sandi yang valid tersimpan lalu pengguna menuju dashboard

Given("pengguna diminta membuat kata sandi setelah masuk lewat Google", async ({ page, world }) => {
  await presetSessionStorage(page, { pending_create_password: JSON.stringify({ role: world.account.role }) });
});

When("pengguna membuat kata sandi yang valid", async ({ buatKataSandiPage }) => {
  await buatKataSandiPage.submit({ password: NEW_PASSWORD, confirmation: NEW_PASSWORD });
});

Then("tidak ada pesan galat buat kata sandi", async ({ buatKataSandiPage }) => {
  await expect(buatKataSandiPage.errorMessage).toHaveCount(0, { timeout: 3_000 });
});
