import { BasePage } from "../base.page.js";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

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
    this.dateButtons = page.locator('button[class*="!w-16"]');
    this.monthTrigger = this.dropdown("Bulan");
    this.startTimeTrigger = this.dropdown("Jam Mulai");
    this.timeOptions = page.locator(".max-h-60 > div");
    this.successTitle = page.getByText("Kasus Berhasil Diposting ke Ruang Publik!");
    this.backToDashboardButton = page.getByRole("button", { name: "Kembali ke Dashboard" });
  }

  dropdown(label) {
    return this.page
      .locator("div.space-y-3", { has: this.page.locator("label", { hasText: label }) })
      .locator("div.cursor-pointer")
      .first();
  }

  categoryButton(name) {
    return this.page.getByRole("button", { name, exact: true });
  }

  timeOption(time) {
    return this.timeOptions.filter({ hasText: new RegExp(`^${time}`) });
  }

  attachment(fileName) {
    return this.page.getByText(fileName);
  }

  /** @param {string} date tanggal YYYY-MM-DD; bulan diganti dulu bila berbeda dari bulan ini */
  async pickDate(date, today) {
    const [, month, day] = date.split("-").map(Number);
    if (Number(today.split("-")[1]) !== month) {
      await this.monthTrigger.click();
      await this.page.locator(".max-h-52 > div").filter({ hasText: new RegExp(`^${MONTH_NAMES[month - 1]}`, "i") }).click();
    }
    await this.dateButtons.filter({ hasText: new RegExp(`^\\D+${day}$`) }).click();
  }

  async openStartTimes() {
    await this.startTimeTrigger.click();
  }

  async pickStartTime(time) {
    await this.openStartTimes();
    await this.timeOption(time).click();
  }

  async attach(file) {
    await this.fileInput.setInputFiles(file);
  }
}
