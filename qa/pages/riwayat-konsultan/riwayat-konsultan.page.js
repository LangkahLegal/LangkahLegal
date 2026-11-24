import { BasePage } from "../base.page.js";

export class RiwayatKonsultanPage extends BasePage {
  path = "/history/consultant";

  constructor(page) {
    super(page);
    this.cards = page.locator("div.group", { has: page.locator("h3") });
    this.emptyState = page.getByText(/^Belum Ada Riwayat/);
  }

  filter(label) {
    return this.page.getByRole("button", { name: label, exact: true });
  }

  /** Riwayat tidak lagi menampilkan lencana jumlah; jumlah sesi selesai dihitung lewat filter "Selesai". */
  async showFinishedOnly() {
    await this.filter("Selesai").click();
  }
}
