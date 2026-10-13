import { BasePage } from "../base.page.js";

export class RiwayatKlienPage extends BasePage {
  path = "/history/client";

  constructor(page) {
    super(page);
    this.cards = page.locator("div.group", { has: page.locator("h3") });
    this.emptyState = page.getByText("Riwayat Kosong");
    this.detailButtons = page.getByRole("button", { name: /Lihat Detail/ });
  }

  finishedBadge(text) {
    return this.page.getByText(text);
  }
}
