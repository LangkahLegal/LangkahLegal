import { BasePage } from "../base.page.js";

export class ProfilKonsultanPage extends BasePage {
  constructor(page) {
    super(page);
    this.verifiedBadge = page.getByTestId("consultant-verified-badge");
    this.scheduleTitle = page.getByTestId("schedule-picker-title");
    this.availableDates = page.getByTestId("date-slot-available").getByTestId("date-slot");
    this.startTimeTrigger = page.getByTestId("selected-time-display");
    this.descriptionInput = page.getByTestId("booking-description-input");
    this.fileInput = page.getByTestId("booking-file-input");
    this.bookButton = page.getByTestId("booking-submit-btn");
    this.processingButton = this.bookButton.filter({ hasText: /Memproses/ });
    this.successTitle = page.getByTestId("success-title").filter({ hasText: "Permintaan Booking Berhasil Terkirim!" });
    this.backToDashboardButton = page.getByTestId("success-action-btn");
    this.notFoundMessage = page.getByTestId("consultant-profile-error");
  }

  async openFor(idKonsultan) {
    await this.page.goto(`/explore/${idKonsultan}`);
  }

  heading(name) {
    return this.page.getByTestId("consultant-profile-name").filter({ hasText: name });
  }

  timeOption(time) {
    return this.page.getByTestId(`time-slot-${time}`);
  }

  attachment(fileName) {
    return this.page.getByTestId("file-item").filter({ hasText: fileName });
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
    const row = this.attachment(fileName);
    await row.getByTestId("file-item-menu-btn").click();
    await row.getByTestId("file-item-delete-btn").click();
  }

  async book({ start, description, document }) {
    if (start) await this.pickSchedule(start);
    if (description !== undefined) await this.descriptionInput.fill(description);
    if (document) await this.attach(document);
    await this.bookButton.click();
  }
}
