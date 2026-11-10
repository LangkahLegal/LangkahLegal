import { BasePage } from "../base.page.js";

export class RiwayatKlienPage extends BasePage {
  path = "/history/client";

  constructor(page) {
    super(page);
    this.cards = page.locator("div.group", { has: page.locator("h3") });
    this.emptyState = page.getByText(/^Belum Ada Riwayat/);
    this.detailButtons = page.getByRole("button", { name: /Lihat Detail/ });
  }

  filter(label) {
    return this.page.getByRole("button", { name: label, exact: true });
  }

  /** Riwayat tidak lagi menampilkan lencana jumlah; jumlah sesi selesai dihitung lewat filter "Selesai". */
  async showFinishedOnly() {
    await this.filter("Selesai").click();
  }
}
