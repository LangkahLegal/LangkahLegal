import { BasePage } from "../base.page.js";

export class PostingKasusPage extends BasePage {
  path = "/bursa/post";

  constructor(page) {
    super(page);
    this.container = page.getByTestId("bursa-post-page");
    this.title = page.getByText("Ajukan Kasus ke Ruang Publik");
    this.anonymousNote = page.getByText("secara anonim");
    this.descriptionInput = page.getByTestId("bursa-description-input");
    this.submitButton = page.getByTestId("bursa-post-submit-btn");
    this.fileInput = page.locator('input[type="file"]');
    this.calendar = page.getByTestId("monthly-calendar");
    this.dateButtons = this.calendar.getByTestId("date-slot");
    this.nextMonthButton = this.calendar.getByRole("button", { name: "Bulan Berikutnya" });
    this.selectedTime = page.getByTestId("selected-time-display");
    this.successTitle = page.getByText("Kasus Berhasil Diposting ke Ruang Publik!");
    this.backToDashboardButton = page.getByRole("button", { name: "Kembali ke Dashboard" });
  }

  categoryButton(name) {
    return this.page.getByRole("button", { name, exact: true });
  }

  timeOption(time) {
    return this.page.getByTestId(`time-slot-${time}`);
  }

  attachment(fileName) {
    return this.page.getByText(fileName);
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
