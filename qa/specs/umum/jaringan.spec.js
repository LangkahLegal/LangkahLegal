import { expect } from "@playwright/test";
import { Given, Then } from "../../hooks/bdd.js";

Given("layanan {layanan} sedang mengalami gangguan", async ({ network }, layanan) => {
  await network.fail(layanan, { status: 500 });
});

Given("layanan {layanan} tidak dapat dihubungi", async ({ network }, layanan) => {
  await network.disconnect(layanan);
});

Given("layanan {layanan} merespons lambat", async ({ network }, layanan) => {
  await network.slowDown(layanan);
});

Given("layanan {layanan} menolak dengan pesan {string}", async ({ network }, layanan, pesan) => {
  await network.fail(layanan, { status: 400, detail: pesan });
});

Given("layanan {layanan} menerima permintaan", async ({ network }, layanan) => {
  await network.reply(layanan, { json: { data: { sent: true, session: null } } });
});

Then("tidak ada permintaan {layanan} yang dikirim ke backend", async ({ page, network }, layanan) => {
  await page.waitForTimeout(500);
  expect(network.calls(layanan)).toHaveLength(0);
});

Then("hanya ada {int} permintaan {layanan} yang dikirim ke backend", async ({ network }, jumlah, layanan) => {
  await network.waitForCall(layanan);
  expect(network.calls(layanan)).toHaveLength(jumlah);
});
