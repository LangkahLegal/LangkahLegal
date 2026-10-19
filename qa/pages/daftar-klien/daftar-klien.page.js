import { BasePage } from "../base.page.js";

export class DaftarKlienPage extends BasePage {
  path = "/consultation";

  constructor(page) {
    super(page);
    this.cards = page.locator("div.group", { has: page.locator("h3") });
    this.sortDropdown = page.getByTestId("client-filter-urutkan");
    this.emptyState = page.getByText("Klien Kosong");
    this.loadFailedMessage = page.getByText("Gagal memuat data klien.");
  }

  countHeading(total) {
    return this.page.getByRole("heading", { name: new RegExp(`${total}\\s*Klien`) });
  }

  async sortBy(label) {
    await this.sortDropdown.click();
    await this.page.locator("div.cursor-pointer", { hasText: new RegExp(`^${label}$`) }).click();
  }
}
