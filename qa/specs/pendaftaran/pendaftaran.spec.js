import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { presetSessionStorage, readSessionStorage } from "../../support/browser.js";
import { defineCases } from "../../support/parameter-types.js";
import { SIGNUP_CASES } from "../../test_data/pendaftaran.data.js";

defineCases("pendaftaran", SIGNUP_CASES);

// ── Langkah bersama · dipakai lebih dari satu skenario

Given("pengguna sudah memilih mendaftar sebagai {peranDaftar}", async ({ page, world }, peran) => {
  world.signupRole = peran.role;
  await presetSessionStorage(page, { pending_role: peran.role });
});

When("pengguna mendaftar dengan {pendaftaran}", async ({ pendaftaranPage, world }, data) => {
  world.signup = data;
  await pendaftaranPage.open();
  await pendaftaranPage.register(data);
});

Then("data pendaftaran dikirim lengkap ke backend", async ({ network, world }) => {
  const { name, email, password } = world.signup;
  const request = await network.waitForCall("pendaftaran");
  expect(request.body).toMatchObject({ name, email, password, role: world.signupRole });
  expect(request.body.emailRedirectTo).toMatch(/\/auth\/callback$/);
});

// ── AUTH-017 · Formulir pendaftaran tidak bisa dibuka tanpa memilih peran
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-018 · Pendaftaran klien berlanjut ke verifikasi OTP

Then("pendaftaran tercatat menunggu verifikasi", async ({ page, world }) => {
  const pending = JSON.parse(await readSessionStorage(page, "pending_auth"));
  expect(pending).toEqual({ email: world.signup.email, role: world.signupRole, flow: "signup" });
});

// ── AUTH-019 · Email yang sudah terdaftar ditolak

Then("pesan galat pendaftaran adalah {string}", async ({ pendaftaranPage }, pesan) => {
  await expect(pendaftaranPage.errorMessage).toHaveText(pesan);
});

// ── AUTH-020 · Nama beraksara non-Latin dan emoji diterima apa adanya
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-021 BUG-21 · Kata sandi yang terlalu pendek ditolak sebelum dikirim
// Seluruh langkahnya memakai langkah bersama.

// ── AUTH-022 · Pendaftaran tanpa nama ditolak peramban

Then("kolom nama pendaftaran ditandai belum diisi", async ({ pendaftaranPage }) => {
  expect(await pendaftaranPage.nameIsMissing()).toBe(true);
});
