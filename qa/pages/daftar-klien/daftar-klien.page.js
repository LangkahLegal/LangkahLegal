import { BasePage } from "../base.page.js";

export class DaftarKlienPage extends BasePage {
  path = "/consultation";

  constructor(page) {
    super(page);
    this.cards = page.locator("div.group", { has: page.locator("h3") });
    this.sortButton = page.getByRole("button", { name: "filter_list" });
    this.emptyState = page.getByText("Klien Kosong");
    this.loadFailedMessage = page.getByText("Gagal memuat data klien.");
  }

  countHeading(total) {
    return this.page.getByRole("heading", { name: new RegExp(`${total}\\s*Klien`) });
  }

  async sortBy(label) {
    await this.sortButton.click();
    await this.page.getByRole("button", { name: new RegExp(label) }).click();
  }
}
