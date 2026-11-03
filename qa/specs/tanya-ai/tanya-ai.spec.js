import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import { ProfilKonsultanPage } from "../../pages/profil-konsultan/profil-konsultan.page.js";
import { defineCases } from "../../support/parameter-types.js";
import { chatSessionsOfKlien, resetChatData, seedChatSession } from "../../support/seed.js";
import { identity } from "../../support/state.js";
import { CATALOG_CONSULTANT } from "../../test_data/katalog-konsultan.data.js";
import {
  AI_FAILURES,
  AI_REPLIES,
  CONSULTATION_DRAFT,
  QUESTIONS,
  PREFERENCE,
  QUICK_REPLIES,
  RECOMMENDATION,
  SAVED_SESSIONS,
  SOURCE_DOCUMENT,
  SOURCE_PASAL,
  STUB_SESSION_ID,
  WELCOME_TEXT,
} from "../../test_data/tanya-ai.data.js";

defineCases("jawabanAi", Object.fromEntries(Object.entries(AI_REPLIES).map(([name, build]) => [name, { build }])));
defineCases("gangguanAi", AI_FAILURES);

const replyWith = (network, jawaban, options = {}) =>
  network.reply("tanya AI", { json: jawaban.build(), ...options });

async function startCleanChat(world) {
  await resetChatData();
  world.cleanups.push(resetChatData);
}

// ── Langkah bersama · dipakai lebih dari satu skenario

Given("AI akan membalas dengan {jawabanAi}", async ({ network }, jawaban) => {
  await replyWith(network, jawaban);
});

Given("layanan AI sedang {gangguanAi}", async ({ network, world }, gangguan) => {
  world.aiFailure = gangguan;
  if (gangguan.disconnect) await network.disconnect("tanya AI");
  else await network.fail("tanya AI", { status: gangguan.status, detail: "gangguan" });
});

Given("klien punya dua sesi percakapan lama dengan AI", async ({ world }) => {
  await startCleanChat(world);
  world.savedSessions = {};
  for (const [name, session] of Object.entries(SAVED_SESSIONS)) {
    world.savedSessions[name] = await seedChatSession(session);
  }
});

When("pengguna bertanya ke Tanya AI", async ({ tanyaAiPage }) => {
  await tanyaAiPage.ask(QUESTIONS.real);
});

When("pengguna mengirim pertanyaan hukum ke AI", async ({ tanyaAiPage }) => {
  await tanyaAiPage.ask(QUESTIONS.real);
});

Then("pengguna diminta login terlebih dahulu", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.loginRequiredMessage).toBeVisible();
});

Then(
  "AI menampilkan pesan gangguan yang sesuai dan klien dapat bertanya lagi",
  async ({ tanyaAiPage, world }) => {
    await expect(tanyaAiPage.lastAiMessage).toContainText(world.aiFailure.message);
    await expect(tanyaAiPage.input).toBeEditable();
  },
);

// ── AI-001 · Halaman Tanya AI menyambut klien

Then("Tanya AI menampilkan sambutan dan menunggu pertanyaan", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.title).toBeVisible();
  await expect(tanyaAiPage.onlineStatus).toBeVisible();
  await expect(tanyaAiPage.aiMessages).toHaveCount(1);
  await expect(tanyaAiPage.aiMessages.first()).toContainText(WELCOME_TEXT);
  await expect(tanyaAiPage.sendButton).toBeDisabled();
});

// ── AI-002 · Klien bertanya dan mendapat jawaban dari AI

Given("klien belum punya percakapan dengan AI", async ({ world }) => {
  await startCleanChat(world);
});

Then("pertanyaan itu tampil di percakapan selagi AI menyiapkan jawaban", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.userMessages).toContainText(QUESTIONS.real);
  await expect(tanyaAiPage.typingIndicator).toBeVisible();
  await expect(tanyaAiPage.input).toHaveValue("");
});

Then("AI membalas pertanyaan itu", async ({ tanyaAiPage, network }) => {
  await expect.poll(() => network.calls("tanya AI")[0]?.status, { timeout: 50_000 }).toBe(200);
  await expect(tanyaAiPage.typingIndicator).toHaveCount(0);
  await expect(tanyaAiPage.lastAiMessage).not.toContainText(WELCOME_TEXT);
});

Then("percakapan tersimpan sebagai sesi klien uji", async () => {
  await expect.poll(async () => (await chatSessionsOfKlien()).length).toBe(1);
});

// ── AI-003 · Pertanyaan lanjutan tetap berada di sesi yang sama

When("pengguna mengirim dua pertanyaan berturut-turut", async ({ tanyaAiPage }) => {
  await tanyaAiPage.ask(QUESTIONS.first);
  await expect(tanyaAiPage.typingIndicator).toHaveCount(0);
  await tanyaAiPage.ask(QUESTIONS.followUp);
});

Then("pertanyaan kedua dikirim dalam sesi yang sama", async ({ network }) => {
  await expect.poll(() => network.calls("tanya AI").length).toBe(2);
  const [first, second] = network.calls("tanya AI");
  expect(first.body.session_id).toBeNull();
  expect(second.body.session_id).toBe(STUB_SESSION_ID);
});

// ── AI-004 · Baris baru tidak mengirim pertanyaan

When("pengguna menulis pertanyaan dua baris", async ({ tanyaAiPage }) => {
  await tanyaAiPage.input.fill(QUESTIONS.multiline.first);
  await tanyaAiPage.input.press("Shift+Enter");
  await tanyaAiPage.input.pressSequentially(QUESTIONS.multiline.second);
});

Then("pertanyaan itu belum dikirim ke AI", async ({ tanyaAiPage, network }) => {
  await expect(tanyaAiPage.input).toHaveValue(QUESTIONS.multiline.joined);
  expect(network.calls("tanya AI")).toHaveLength(0);
});

// ── AI-004 · Pertanyaan kosong tidak dapat dikirim

When("pengguna mengirim pertanyaan yang hanya berisi spasi", async ({ tanyaAiPage }) => {
  await tanyaAiPage.ask(QUESTIONS.blank);
  await expect(tanyaAiPage.sendButton).toBeDisabled();
});

// ── AI-008 · Rekomendasi konsultan dari AI dapat langsung dijadwalkan

Then("AI menampilkan konsultan uji sebagai rekomendasi", async ({ page }) => {
  await expect(page.getByText(RECOMMENDATION.title)).toBeVisible();
  await expect(page.getByText(CATALOG_CONSULTANT.name)).toBeVisible();
  await expect(page.getByText(RECOMMENDATION.priceLabel)).toBeVisible();
  await expect(page.getByText(RECOMMENDATION.rating)).toBeVisible();
});

When("pengguna memilih menjadwalkan konsultan yang direkomendasikan", async ({ tanyaAiPage, context, world }) => {
  const opened = context.waitForEvent("page");
  await tanyaAiPage.scheduleButton.click();
  world.popup = await opened;
  await world.popup.waitForLoadState("domcontentloaded");
});

Then("profil konsultan uji terbuka di tab baru", async ({ world }) => {
  expect(world.popup.url()).toMatch(new RegExp(`/explore/${identity("konsultan").idKonsultan}$`));
});

// ── AI-014 · Ringkasan kasus dari AI terisi otomatis di form pengajuan konsultan

Then("AI menampilkan ringkasan kasus sebagai draft pengajuan", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.consultationDraft).toBeVisible();
  await expect(tanyaAiPage.consultationDraft).toContainText(CONSULTATION_DRAFT.ringkasan_kasus);
  await expect(tanyaAiPage.consultationDraft).toContainText(CONSULTATION_DRAFT.bukti_perlu_disiapkan[0]);
});

Then("form pengajuan di tab baru sudah berisi ringkasan kasus dari AI", async ({ world }) => {
  expect(world.popup.url()).toMatch(new RegExp(`/explore/${identity("konsultan").idKonsultan}\\?dari=ai$`));
  const profil = new ProfilKonsultanPage(world.popup);
  await expect(profil.descriptionInput).toHaveValue(CONSULTATION_DRAFT.deskripsi_kasus);
});

// ── AI-009 · Jawaban cepat dapat dipilih saat AI menanyakan bukti

When("pengguna memilih jawaban cepat bahwa ia punya bukti", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.quickReply(QUICK_REPLIES.no)).toBeVisible();
  await tanyaAiPage.quickReply(QUICK_REPLIES.yes).click();
});

Then("jawaban cepat itu dikirim sebagai pertanyaan berikutnya", async ({ network }) => {
  await expect.poll(() => network.calls("tanya AI").length).toBe(2);
  expect(network.calls("tanya AI")[1].body.query).toBe(QUICK_REPLIES.yes);
});

// ── AI-010 · Jawaban AI berisi konten berbahaya tidak dijalankan browser

Then("konten berbahaya dalam jawaban AI dinetralkan", async ({ tanyaAiPage }) => {
  const link = tanyaAiPage.lastAiMessage.getByRole("link", { name: "klik" });
  await expect(link).toBeVisible();
  expect(await link.getAttribute("href")).not.toMatch(/^javascript:/i);
  await expect(tanyaAiPage.lastAiMessage.locator("img, script")).toHaveCount(0);
  await link.click().catch(() => {});
});

// ── AI-011 · Pertanyaan baru tidak dikirim selama AI masih menjawab

Given("AI akan membalas dengan {jawabanAi} setelah beberapa saat", async ({ network }, jawaban) => {
  await replyWith(network, jawaban, { delayMs: 1_500 });
});

When("pengguna mengirim dua pertanyaan tanpa menunggu jawaban", async ({ tanyaAiPage }) => {
  await tanyaAiPage.ask(QUESTIONS.first);
  await tanyaAiPage.ask(QUESTIONS.followUp);
});

// ── AI-012 · Klien membuka sesi lama, menghapus sesi lain, lalu memulai percakapan baru

When("pengguna membuka salah satu sesi lama dari riwayat", async ({ tanyaAiPage, page }) => {
  await tanyaAiPage.historyToggle.click();
  await expect(page.getByText("2 sesi konsultasi")).toBeVisible();
  await tanyaAiPage.savedSession(SAVED_SESSIONS.opened.title).click();
});

Then("isi percakapan sesi itu tampil kembali", async ({ page }) => {
  for (const message of SAVED_SESSIONS.opened.messages) {
    await expect(page.getByText(message.content, { exact: false })).toBeVisible();
  }
});

When("pengguna menghapus sesi lama yang lain", async ({ tanyaAiPage, network }) => {
  await tanyaAiPage.startDeleting(SAVED_SESSIONS.deleted.title);
  expect(network.calls("hapus sesi AI")).toHaveLength(0);
  await tanyaAiPage.confirmDeleting(SAVED_SESSIONS.deleted.title);
});

Then("sesi itu terhapus dari riwayat dan dari database", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.savedSession(SAVED_SESSIONS.deleted.title)).toHaveCount(0);
  await expect
    .poll(async () => (await chatSessionsOfKlien()).map((session) => session.title))
    .toEqual([SAVED_SESSIONS.opened.title]);
});

When("pengguna memulai percakapan baru", async ({ tanyaAiPage }) => {
  await tanyaAiPage.newConsultationButton.click();
});

Then("Tanya AI kembali menampilkan sambutan", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.aiMessages.first()).toContainText(WELCOME_TEXT);
});

// ── AI-013 · Riwayat percakapan tetap terbaca tanpa font ikon

Given("font ikon tidak dapat dimuat", async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
});

When("pengguna membuka riwayat percakapan", async ({ tanyaAiPage }) => {
  await tanyaAiPage.historyToggle.click();
});

Then("judul sesi lama tetap terbaca", async ({ page }) => {
  await expect(page.getByText(SAVED_SESSIONS.opened.title)).toBeVisible({ timeout: 3_000 });
});

// ── AI-015 · Dokumen sumber jawaban AI dapat dibuka sampai naskah resminya

Then("AI menampilkan dokumen sumber di bawah jawaban", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.sources).toHaveCount(1);
  await expect(tanyaAiPage.sources).toContainText(SOURCE_DOCUMENT.nama_uu);
  await expect(tanyaAiPage.sources).toContainText(SOURCE_DOCUMENT.pasal[0].pasal_bagian);
});

When("pengguna membuka dokumen sumber itu", async ({ tanyaAiPage, network }) => {
  await network.reply("isi pasal", { json: SOURCE_PASAL });
  await tanyaAiPage.sources.click();
});

Then("isi pasal yang dirujuk tampil beserta tautan naskah resminya", async ({ tanyaAiPage, network }) => {
  await expect(tanyaAiPage.sourceModal).toContainText(SOURCE_PASAL.isi_teks);
  expect(network.calls("isi pasal")[0].path).toBe(`/knowledge/pasal/${SOURCE_PASAL.id_dokumen}`);
  await expect(tanyaAiPage.openPdfLink).toHaveAttribute("href", SOURCE_DOCUMENT.file_url);
  await expect(tanyaAiPage.bpkLink).toHaveAttribute("href", SOURCE_DOCUMENT.sumber_url);
});

When("pengguna beralih ke naskah resmi", async ({ tanyaAiPage, page }) => {
  await page.route(/res\.cloudinary\.com/, (route) => route.fulfill({ contentType: "application/pdf", body: "%PDF-1.4" }));
  await tanyaAiPage.officialTextTab.click();
});

Then("naskah resmi peraturan ditampilkan di dalam pratinjau", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.sourceModal.locator("iframe")).toHaveAttribute("src", SOURCE_DOCUMENT.file_url);
});

// ── AI-016 · AI menanyakan budget dan jadwal sebelum merekomendasikan konsultan

Given("AI akan menanyakan budget dan jadwal lalu merekomendasikan konsultan", async ({ network }) => {
  // Route yang didaftarkan terakhir dipakai lebih dulu: pertanyaan untuk pesan pertama, lalu daftar konsultan.
  await network.reply("tanya AI", { json: AI_REPLIES["konsultan dengan slot jadwal"]() });
  await network.reply("tanya AI", { json: AI_REPLIES["pertanyaan budget dan jadwal"](), times: 1 });
});

Then("AI menampilkan form budget dan jadwal dengan kategori yang diasumsikan", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.lastAiMessage).toContainText("termasuk ketenagakerjaan");
  await expect(tanyaAiPage.preferenceForm).toBeVisible();
  await expect(tanyaAiPage.preferenceForm).toContainText(PREFERENCE.form.kategori);
});

When("pengguna mengisi budget dan memilih jadwal lalu mencari konsultan", async ({ tanyaAiPage }) => {
  await tanyaAiPage.fillPreference(PREFERENCE.input);
  await tanyaAiPage.searchConsultantButton.click();
});

Then("preferensi itu dikirim ke AI bersama ringkasannya", async ({ network }) => {
  await expect.poll(() => network.calls("tanya AI").length).toBe(2);
  const kedua = network.calls("tanya AI")[1].body;
  expect(kedua.preferensi).toEqual(PREFERENCE.expected);
  expect(kedua.query).toBe(PREFERENCE.summary);
});

Then("AI menampilkan konsultan dengan slot jadwal yang cocok", async ({ tanyaAiPage }) => {
  await expect(tanyaAiPage.consultantSchedule).toContainText("Jadwal yang cocok");
  await expect(tanyaAiPage.consultantSlots).toHaveText([PREFERENCE.slot.label]);
  await expect(tanyaAiPage.page.getByTestId("ai-preference-form-done")).toBeVisible();
});

When("pengguna memilih slot jadwal konsultan", async ({ tanyaAiPage, context, world }) => {
  const opened = context.waitForEvent("page");
  await tanyaAiPage.consultantSlots.first().click();
  world.popup = await opened;
  await world.popup.waitForLoadState("domcontentloaded");
});

Then("halaman konsultan terbuka dengan slot itu sudah terpilih", async ({ world }) => {
  const url = new URL(world.popup.url());
  expect(url.pathname).toBe(`/explore/${identity("konsultan").idKonsultan}`);
  expect(Object.fromEntries(url.searchParams)).toEqual({
    tanggal: PREFERENCE.slot.tanggal,
    mulai: PREFERENCE.slot.mulai,
    selesai: PREFERENCE.slot.selesai,
  });
});

// ── AI-017 · Klien dapat melewati pertanyaan budget dan jadwal

When("pengguna melewati pertanyaan budget dan jadwal", async ({ tanyaAiPage }) => {
  await tanyaAiPage.skipPreferenceButton.click();
});

Then("permintaan berikutnya menandai preferensi dilewati", async ({ network }) => {
  await expect.poll(() => network.calls("tanya AI").length).toBe(2);
  const kedua = network.calls("tanya AI")[1].body;
  expect(kedua.preferensi).toEqual({ kategori: PREFERENCE.form.kategori, dilewati: true });
  expect(kedua.query).toBe(PREFERENCE.skipText);
});

// ── AI-018 · Budget minimal yang lebih besar dari maksimal ditolak

When("pengguna mengisi budget minimal lebih besar dari maksimal", async ({ tanyaAiPage }) => {
  await tanyaAiPage.fillPreference(PREFERENCE.invalidBudget);
  await tanyaAiPage.searchConsultantButton.click();
});

Then("form menolak budget itu tanpa mengirim pertanyaan baru", async ({ tanyaAiPage, network }) => {
  await expect(tanyaAiPage.preferenceForm.getByRole("alert")).toHaveText(PREFERENCE.budgetError);
  expect(network.calls("tanya AI")).toHaveLength(1);
});
