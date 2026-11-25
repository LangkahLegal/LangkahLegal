import { BasePage } from "../base.page.js";

export class PostingKasusPage extends BasePage {
  path = "/bursa/post";

  constructor(page) {
    super(page);
    this.container = page.getByTestId("bursa-post-page");
    this.title = page.getByTestId("bursa-post-title");
    this.anonymousNote = page.getByTestId("bursa-post-anonymous-note");
    this.descriptionInput = page.getByTestId("bursa-description-input");
    this.submitButton = page.getByTestId("bursa-post-submit-btn");
    this.fileInput = page.getByTestId("bursa-post-file-input");
    this.calendar = page.getByTestId("monthly-calendar");
    this.dateButtons = this.calendar.getByTestId("date-slot");
    this.nextMonthButton = this.calendar.getByTestId("calendar-next-btn");
    this.selectedTime = page.getByTestId("selected-time-display");
    this.successTitle = page.getByTestId("success-title").filter({ hasText: "Kasus Berhasil Diposting ke Ruang Publik!" });
    this.backToDashboardButton = page.getByTestId("success-action-btn");
  }

  categoryButton(name) {
    return this.page.getByTestId("bursa-post-category-btn").filter({ hasText: new RegExp(`^${name}$`) });
  }

  timeOption(time) {
    return this.page.getByTestId(`time-slot-${time}`);
  }

  attachment(fileName) {
    return this.page.getByTestId("file-item").filter({ hasText: fileName });
  }

  /** @param {string} date tanggal YYYY-MM-DD; kalender dipindah ke bulan berikutnya bila berbeda dari bulan ini */
  async pickDate(date, today) {
    const [, month, day] = date.split("-").map(Number);
    if (Number(today.split("-")[1]) !== month) {
      await this.nextMonthButton.click();
    }
    await this.dateButtons.filter({ hasText: new RegExp(`^${day}$`) }).click();
  }

  /** Kartu jam sesi tampil begitu tanggal dipilih. */
  async openStartTimes() {
    await this.selectedTime.waitFor();
  }

  async pickStartTime(time) {
    await this.openStartTimes();
    await this.timeOption(time).click();
  }

  async attach(file) {
    await this.fileInput.setInputFiles(file);
  }
}
