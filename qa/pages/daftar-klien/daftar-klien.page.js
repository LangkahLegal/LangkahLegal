import { BasePage } from "../base.page.js";

export class DaftarKlienPage extends BasePage {
  path = "/consultation";

  constructor(page) {
    super(page);
    this.cards = page.getByTestId("consultation-card");
    this.sortDropdown = page.getByTestId("client-filter-urutkan");
    this.emptyState = page.getByTestId("client-list-empty");
    this.loadFailedMessage = page.getByTestId("client-list-load-error");
  }

  countHeading(total) {
    return this.page.getByTestId("client-count").filter({ hasText: new RegExp(`${total}\\s*Klien`) });
  }

  async sortBy(label) {
    await this.sortDropdown.click();
    await this.page.getByTestId("client-filter-urutkan-option").filter({ hasText: new RegExp(`^${label}$`) }).click();
  }
}
