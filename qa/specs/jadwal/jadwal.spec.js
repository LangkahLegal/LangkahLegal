import { expect } from "@playwright/test";
import { Given, Then, When } from "../../hooks/bdd.js";
import {
  findKonsultan,
  findSchedule,
  nextMonthDate,
  resetConsultationData,
  schedulesOfKonsultan,
  seedConsultation,
  seedSchedule,
  setKonsultan,
  wibDate,
} from "../../support/seed.js";
import { MONTH_END_CHECK, SCHEDULE_MESSAGES, SLOTS } from "../../test_data/konsultan.data.js";

const monthLabel = (date) =>
  new Date(`${date}T00:00:00+07:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

async function seedSlot(world, slot, overrides = {}) {
  await resetConsultationData();
  world.cleanups.push(resetConsultationData);
  world.schedule = await seedSchedule({
    tanggal: nextMonthDate(slot.day),
    jam_mulai: slot.start,
    jam_selesai: slot.end,
    ...overrides,
  });
}

// ── Langkah bersama · dipakai lebih dari satu skenario

Then("formulir slot jadwal tidak terbuka", async ({ jadwalPage }) => {
  await expect(jadwalPage.modal).toHaveCount(0, { timeout: 3_000 });
});

// ── SCH-001 · Halaman jadwal menampilkan status ketersediaan dan kalender bulan ini

Then(
  "halaman jadwal menampilkan status menerima konsultasi dan kalender bulan ini",
  async ({ jadwalPage }) => {
    await expect(jadwalPage.availabilitySection).toContainText("Aktif Menerima Konsultasi");
    await expect(jadwalPage.calendar).toContainText(monthLabel(wibDate()));
  },
);

// ── SCH-002 · Konsultan menambah slot jadwal baru

When("pengguna menambah slot jadwal pada bulan depan", async ({ jadwalPage }) => {
  await jadwalPage.openDayNextMonth(SLOTS.added.day);
  await expect(jadwalPage.modalTitle("Tambah Jadwal")).toBeVisible();
  await jadwalPage.fillSlot(SLOTS.added);
  await jadwalPage.saveButton.click();
});

Then("slot jadwal baru tersimpan di database", async () => {
  const [saved] = await schedulesOfKonsultan({ tanggal: `eq.${nextMonthDate(SLOTS.added.day)}` });
  expect(saved).toMatchObject({
    jam_mulai: SLOTS.added.startStored,
    jam_selesai: SLOTS.added.endStored,
    status_tersedia: true,
  });
});

// ── SCH-003 · Konsultan meliburkan slot yang sudah ada

Given("konsultan uji punya slot jadwal pada bulan depan", async ({ world }) => {
  await seedSlot(world, SLOTS.existing);
});

When("pengguna meliburkan slot jadwal itu", async ({ jadwalPage }) => {
  await jadwalPage.openDayNextMonth(SLOTS.existing.day);
  await expect(jadwalPage.modalTitle("Edit Jadwal")).toBeVisible();
  await expect(jadwalPage.modal).toContainText(SLOTS.existing.shown);
  await jadwalPage.modalDropdown("Status Slot").click();
  await jadwalPage.modal.locator(".max-h-60 > div").filter({ hasText: "Libur / Tutup" }).click();
  await jadwalPage.saveButton.click();
});

Then("slot jadwal itu tersimpan sebagai libur", async ({ world }) => {
  await expect.poll(async () => (await findSchedule(world.schedule.id_jadwal)).status_tersedia).toBe(false);
});

// ── SCH-004 · Slot yang sudah dipesan klien tidak dapat diubah

Given("konsultan uji punya slot jadwal bulan depan yang sudah dipesan klien", async ({ world }) => {
  await seedSlot(world, SLOTS.booked, { status_tersedia: false });
  await seedConsultation(world.schedule, "terjadwal", { jam_mulai: SLOTS.booked.start, jam_selesai: SLOTS.booked.end });
});

When("pengguna membuka slot jadwal yang sudah dipesan itu", async ({ jadwalPage }) => {
  await jadwalPage.openDayNextMonth(SLOTS.booked.day);
});

Then("slot jadwal itu hanya bisa dilihat", async ({ jadwalPage, page }) => {
  await expect(jadwalPage.modalTitle("Detail Jadwal")).toBeVisible();
  await expect(page.getByText(SCHEDULE_MESSAGES.bookedReadOnly)).toBeVisible();
  await expect(jadwalPage.saveButton).toHaveCount(0);
});

// ── SCH-005 · Slot dengan jam selesai sebelum jam mulai ditolak

When("pengguna menambah slot dengan jam selesai sebelum jam mulai", async ({ jadwalPage }) => {
  await jadwalPage.openDayNextMonth(SLOTS.reversed.day);
  await jadwalPage.fillSlot(SLOTS.reversed);
  await jadwalPage.saveButton.click();
});

// ── SCH-006 · Slot tidak dapat ditambah pada tanggal yang sudah lewat

When("pengguna memilih tanggal pada bulan lalu", async ({ jadwalPage }) => {
  await jadwalPage.previousMonthButton.click();
  await jadwalPage.day(1).click();
});

// ── SCH-007 · Status tidak menerima konsultasi tersimpan

When("pengguna menonaktifkan penerimaan konsultasi", async ({ jadwalPage, world }) => {
  world.cleanups.push(() => setKonsultan("konsultan", { is_active: true }));
  await jadwalPage.availabilityToggle.click();
  await expect(jadwalPage.availabilitySection).toContainText("Tidak Menerima Konsultasi");
});

Then("status tidak menerima konsultasi tersimpan ke backend", async () => {
  await expect.poll(async () => (await findKonsultan("konsultan")).is_active, { timeout: 4_000 }).toBe(false);
});

// ── SCH-008 · Slot yang bentrok diberitahukan ke konsultan

When("pengguna menambah slot jadwal yang bentrok", async ({ jadwalPage }) => {
  await jadwalPage.openDayNextMonth(SLOTS.conflicting.day);
  await jadwalPage.fillSlot(SLOTS.conflicting);
  await jadwalPage.saveButton.click();
});

// ── SCH-009 · Berpindah bulan dari tanggal 31 tidak melompati bulan

Given("hari ini di browser adalah tanggal 31 Januari", async ({ page }) => {
  await page.clock.setFixedTime(new Date(MONTH_END_CHECK.now));
});

When("pengguna berpindah ke bulan berikutnya di kalender", async ({ jadwalPage }) => {
  await expect(jadwalPage.calendar).toContainText(MONTH_END_CHECK.current);
  await jadwalPage.nextMonthButton.click();
});

Then("kalender menampilkan bulan Februari", async ({ jadwalPage }) => {
  await expect(jadwalPage.calendar).toContainText(MONTH_END_CHECK.next, { timeout: 3_000 });
});

// ── SCH-010 · Formulir slot jadwal dapat ditutup tanpa menyimpan

When("pengguna membuka lalu menutup formulir slot jadwal", async ({ jadwalPage }) => {
  await jadwalPage.openDayNextMonth(SLOTS.untouched.day);
  await jadwalPage.closeModalButton.click();
});
