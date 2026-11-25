import { BasePage } from "../base.page.js";

export class RiwayatKonsultanPage extends BasePage {
  path = "/history/consultant";

  constructor(page) {
    super(page);
    this.cards = page.getByTestId("consultation-card");
    this.emptyState = page.getByTestId("history-empty");
    this.statusDropdown = page.getByTestId("history-filter-status");
  }

  filter(label) {
    return this.page.getByTestId("history-filter-status-option").filter({ hasText: new RegExp(`^${label}$`) });
  }

  /** Riwayat tidak lagi menampilkan lencana jumlah; jumlah sesi selesai dihitung lewat filter "Selesai". */
  async showFinishedOnly() {
    await this.statusDropdown.click();
    await this.filter("Selesai").click();
  }
}
