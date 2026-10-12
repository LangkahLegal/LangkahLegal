import { BasePage } from "../base.page.js";

export class PermintaanPage extends BasePage {
  constructor(page) {
    super(page);
    this.title = page.getByText("Detail Permintaan");
    this.acceptButton = page.getByRole("button", { name: /Terima/ });
    this.rejectButton = page.getByRole("button", { name: /Tolak/ });
    this.fromBursaBadge = page.getByText("Dari Bursa Kasus");
    this.scheduleAndAcceptButton = page.getByRole("button", { name: /Terima & Jadwalkan/ });
    this.startSelect = page.locator("#jam-mulai-select");
    this.endSelect = page.locator("#jam-selesai-select");
    this.noSlotMessage = page.getByText(/Belum ada slot jadwal tersedia/);
    this.scheduleLink = page.locator("span.underline", { hasText: "Jadwal" });
    this.backToDashboardButton = page.getByRole("button", { name: "Kembali ke Dashboard" });
    this.notFoundMessage = page.getByText("Data tidak ditemukan.");
  }

  slot(label) {
    return this.page.getByText(label);
  }

  async acceptTwice() {
    await this.acceptButton.click();
    await this.acceptButton.click({ timeout: 1_000 }).catch(() => {});
  }

  async schedule({ slotLabel, start, end }) {
    await this.slot(slotLabel).click();
    await this.startSelect.selectOption(start);
    await this.endSelect.selectOption(end);
    await this.scheduleAndAcceptButton.click();
  }
}
