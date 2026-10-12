import { BasePage } from "../base.page.js";

export class VerifikasiKonsultanPage extends BasePage {
  path = "/verification";

  constructor(page) {
    super(page);
    this.searchInput = page.getByTestId("explore-search-input");
    this.names = page.locator("h3");
    this.emptyState = page.getByText("Tidak Ditemukan");
  }

  tab(label) {
    return this.page.getByRole("button", { name: label });
  }

  name(text) {
    return this.names.filter({ hasText: text });
  }

  async search(keyword) {
    await this.searchInput.fill(keyword);
  }
}
