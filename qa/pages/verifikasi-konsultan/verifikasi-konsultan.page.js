import { BasePage } from "../base.page.js";

export class VerifikasiKonsultanPage extends BasePage {
  path = "/verification";

  constructor(page) {
    super(page);
    this.searchInput = page.getByTestId("explore-search-input");
    this.names = page.getByTestId("verification-card-name");
    this.emptyState = page.getByTestId("verification-empty");
  }

  tab(label) {
    return this.page.getByTestId("verification-status-tab").filter({ hasText: label });
  }

  name(text) {
    return this.names.filter({ hasText: text });
  }

  async search(keyword) {
    await this.searchInput.fill(keyword);
  }
}
