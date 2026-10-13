import { BasePage } from "../base.page.js";

export class RiwayatKonsultanPage extends BasePage {
  path = "/history/consultant";

  constructor(page) {
    super(page);
    this.cards = page.locator("div.group", { has: page.locator("h3") });
    this.emptyState = page.getByText("Riwayat Kosong");
  }

  finishedBadge(text) {
    return this.page.getByText(text);
  }
}
