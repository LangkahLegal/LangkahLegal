import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { presetSessionStorage } from "../../support/browser.js";
import { db, eq } from "../../support/database.js";
import { env } from "../../support/env.js";
import { sessions } from "../../support/sessions.js";
import { removeProfile } from "../../support/temp-users.js";
import { account } from "../../test_data/accounts.js";
import { OAUTH } from "../../test_data/callback-oauth.data.js";

const rememberVerifier = (page) => presetSessionStorage(page, { pending_oauth_verifier: OAUTH.verifier });

// ── Langkah bersama · dipakai lebih dari satu skenario

Given("Google mengenali pengguna sebagai {akun}", async ({ page, network, world }, akun) => {
  const session = await sessions.fresh(akun);
  await network.reply("tukar kode OAuth", { json: { data: { session } } });
  await rememberVerifier(page);
  if (!account(akun).role) world.cleanups.push(() => removeProfile(account(akun).email));
});

When("pengguna kembali dari Google dengan kode otorisasi", async ({ callbackOauthPage }) => {
  await callbackOauthPage.openWith({ code: OAUTH.code });
});

Then("peran {akun} dikirim ke backend", async ({ network }, akun) => {
  const request = await network.waitForCall("atur peran");
  expect(request.body).toEqual({ role: account(akun).role });
});

Then("{akun} tersimpan sebagai {akun}", async ({}, akun, peran) => {
  const profile = await db.first("users", { email: eq(account(akun).email) }, "role");
  expect(profile?.role).toBe(account(peran).role);
});

// ── AUTH-037 · Penolakan akses di Google diberitahukan ke pengguna

When("pengguna kembali dari Google setelah menolak memberi akses", async ({ callbackOauthPage }) => {
  await callbackOauthPage.openWith({ error_description: OAUTH.deniedReason });
});

Then("galat callback menampilkan alasan penolakan", async ({ callbackOauthPage, page }) => {
  await expect(callbackOauthPage.errorTitle).toBeVisible();
  await expect(page.getByText(OAUTH.deniedReason)).toBeVisible();
});

When("pengguna memilih kembali ke login", async ({ callbackOauthPage }) => {
  await callbackOauthPage.backToLoginButton.click();
});

// ── AUTH-038 · Callback tanpa kode otorisasi dikembalikan ke login
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-039 · Pendaftaran konsultan lewat Google berakhir di dashboard konsultan

Given("pendaftaran lewat Google sebagai {akun} sedang berlangsung", async ({ page }, akun) => {
  const pending = { role: account(akun).role, flow: "oauth_signup" };
  await presetSessionStorage(page, { pending_auth: JSON.stringify(pending) });
});

Then("kode otorisasi ditukar bersama kode verifikasinya", async ({ network }) => {
  const [request] = network.calls("tukar kode OAuth");
  expect(request.body).toEqual({ code: OAUTH.code, code_verifier: OAUTH.verifier });
});

// ── AUTH-040 · Pengguna Google baru tanpa peran otomatis menjadi klien
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-041 · Tujuan lanjutan ke situs luar tidak boleh mengalihkan pengguna

When("pengguna kembali dari Google dengan tujuan lanjutan ke situs luar", async ({ callbackOauthPage }) => {
  await callbackOauthPage.openWith({ code: OAUTH.code, next: OAUTH.externalNext });
});

Then("browser tetap berada di aplikasi LangkahLegal", async ({ page }) => {
  await page.waitForTimeout(2_500);
  expect(new URL(page.url()).origin).toBe(env.baseUrl);
});

// ── AUTH-042 · Kode otorisasi yang tidak berlaku diberitahukan ke pengguna

Given("browser masih menyimpan kode verifikasi OAuth", async ({ page }) => {
  await rememberVerifier(page);
});

When("pengguna kembali dari Google dengan kode otorisasi yang tidak berlaku", async ({ callbackOauthPage }) => {
  await callbackOauthPage.openWith({ code: OAUTH.invalidCode });
});

Then("galat callback tampil", async ({ callbackOauthPage }) => {
  await expect(callbackOauthPage.errorTitle).toBeVisible();
});
