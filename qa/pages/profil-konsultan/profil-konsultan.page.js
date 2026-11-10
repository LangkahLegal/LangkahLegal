import { BasePage } from "../base.page.js";

export class ProfilKonsultanPage extends BasePage {
  constructor(page) {
    super(page);
    this.verifiedBadge = page.getByText("✅ Verified");
    this.scheduleTitle = page.getByText("Pilih Jadwal Sesi");
    this.availableDates = page.locator('[data-testid="date-slot"]:not([disabled])');
    this.startTimeTrigger = page.getByTestId("selected-time-display");
    this.descriptionInput = page.getByPlaceholder("Ceritakan detail permasalahan hukum Anda di sini...");
    this.fileInput = page.locator('input[type="file"]');
    this.bookButton = page.getByRole("button", { name: "Booking Konsultasi" });
    this.processingButton = page.getByRole("button", { name: /Memproses/ });
    this.successTitle = page.getByText("Permintaan Booking Berhasil Terkirim!");
    this.backToDashboardButton = page.getByRole("button", { name: "Kembali ke Dashboard" });
    this.notFoundMessage = page.getByText(/tidak ditemukan/i);
  }

  async openFor(idKonsultan) {
    await this.page.goto(`/explore/${idKonsultan}`);
  }

  heading(name) {
    return this.page.getByRole("heading", { name });
  }

  timeOption(time) {
    return this.page.getByTestId(`time-slot-${time}`);
  }

  attachment(fileName) {
    return this.page.getByText(fileName);
  }

  /** Memilih tanggal praktik pertama sehingga kartu jam sesi tampil. */
  async openStartTimes() {
    await this.availableDates.first().click();
    await this.startTimeTrigger.waitFor();
  }

  async pickSchedule(startTime) {
    await this.openStartTimes();
    await this.timeOption(startTime).click();
  }

  async attach(file) {
    await this.fileInput.setInputFiles(file);
  }

  async removeAttachment(fileName) {
    const row = this.attachment(fileName).locator("xpath=ancestor::div[contains(@class,'relative')][1]");
    await row.getByRole("button", { name: "more_vert" }).click();
    await this.page.getByRole("button", { name: /Hapus Berkas/ }).click();
  }

  async book({ start, description, document }) {
    if (start) await this.pickSchedule(start);
    if (description !== undefined) await this.descriptionInput.fill(description);
    if (document) await this.attach(document);
    await this.bookButton.click();
  }
}
