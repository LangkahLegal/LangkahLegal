import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { RECOVERY_EMAIL } from "../../test_data/kata-sandi.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna meminta tautan reset untuk emailnya", async ({ lupaKataSandiPage }) => {
  await lupaKataSandiPage.requestLink(RECOVERY_EMAIL);
});

// ── AUTH-029 · Permintaan tautan reset dikonfirmasi ke pengguna

Then("konfirmasi tautan terkirim tampil beserta emailnya", async ({ lupaKataSandiPage, page }) => {
  await expect(lupaKataSandiPage.sentTitle).toBeVisible();
  await expect(page.getByText(RECOVERY_EMAIL)).toBeVisible();
});

Then("tautan reset diminta mengarah ke halaman reset kata sandi", async ({ network }) => {
  const [request] = network.calls("lupa kata sandi");
  expect(request.body.emailRedirectTo).toMatch(/\/auth\/reset-password$/);
});

// ── AUTH-030 · Permintaan tautan reset tanpa email ditolak peramban

When("pengguna meminta tautan reset tanpa mengisi email", async ({ lupaKataSandiPage }) => {
  await lupaKataSandiPage.requestLink();
});

// ── AUTH-030 · Penolakan backend saat meminta tautan reset diberitahukan ke pengguna
// Seluruh langkahnya memakai langkah bersama.
