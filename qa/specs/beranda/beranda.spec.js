import { expect } from "@playwright/test";
import { Then, When } from "../../hooks/bdd.js";
import { BERANDA } from "../../test_data/beranda.data.js";

// ── Langkah bersama · dipakai lebih dari satu skenario

When("pengguna memilih dashboard dari navbar", async ({ berandaPage }) => {
  await berandaPage.navbarButton("Dashboard").click();
});

// ── PUB-001 · Beranda tampil lengkap untuk pengunjung

Then("beranda menampilkan seluruh bagian utamanya", async ({ berandaPage }) => {
  await expect(berandaPage.page).toHaveTitle(/LangkahLegal/);
  await expect(berandaPage.heroTitle).toContainText(BERANDA.heroTitle);
  await expect(berandaPage.featuresSection).toBeAttached();
  await expect(berandaPage.aboutSection).toBeAttached();
  await expect(berandaPage.signUpCta).toBeVisible();
  await expect(berandaPage.faqTitle).toBeVisible();
  await expect(berandaPage.copyright).toBeVisible();
});

// ── PUB-002 · Pengunjung memulai pendaftaran dari beranda

When("pengguna memilih mulai sekarang", async ({ berandaPage }) => {
  await berandaPage.startNowButton.click();
});

// ── PUB-003 · Pengunjung menuju login dari navbar

When("pengguna memilih masuk dari navbar", async ({ berandaPage }) => {
  await berandaPage.navbarButton("Mulai").click();
});

// ── PUB-004 · Konsultan yang sudah login menuju dashboardnya dari navbar
// Seluruh langkahnya memakai langkah bersama.

// ── PUB-005 · Pengguna yang perannya belum diketahui diminta memilih peran
// Seluruh langkahnya memakai langkah bersama.

// ── PUB-006 · Jawaban FAQ dapat dibuka dan ditutup

When("pengguna membuka sebuah pertanyaan FAQ", async ({ berandaPage }) => {
  await expect(berandaPage.faqAnswer(BERANDA.faq.answer)).toHaveCount(0);
  await berandaPage.faqQuestion(BERANDA.faq.question).click();
});

Then("jawaban pertanyaan itu tampil", async ({ berandaPage }) => {
  await expect(berandaPage.faqAnswer(BERANDA.faq.answer)).toBeVisible();
});

When("pengguna menutup pertanyaan FAQ itu", async ({ berandaPage }) => {
  await berandaPage.faqQuestion(BERANDA.faq.question).click();
});

Then("jawaban pertanyaan itu tersembunyi", async ({ berandaPage }) => {
  await expect(berandaPage.faqAnswer(BERANDA.faq.answer)).toHaveCount(0);
});

// ── PUB-007 · Tautan layanan di navbar membawa pengunjung ke bagian fitur

When("pengguna memilih tautan layanan di navbar", async ({ berandaPage }) => {
  await berandaPage.servicesLink.click();
});

Then("bagian fitur terlihat di layar", async ({ berandaPage }) => {
  await expect(berandaPage.featuresSection).toBeInViewport();
});

// ── PUB-008 · Beranda pas dengan lebar layar

Then("beranda tidak dapat digulir ke samping", async ({ berandaPage }) => {
  expect(await berandaPage.horizontalOverflow()).toBeLessThanOrEqual(1);
});
