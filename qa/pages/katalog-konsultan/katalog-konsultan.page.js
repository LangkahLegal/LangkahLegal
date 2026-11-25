import { BasePage } from "../base.page.js";

export class KatalogKonsultanPage extends BasePage {
  path = "/explore";

  constructor(page) {
    super(page);
    this.cards = page.getByTestId("consultant-card");
    this.searchInput = page.getByTestId("explore-search-input");
    this.categoryDropdown = page.getByTestId("explore-filter-spesialisasi");
    this.verificationDropdown = page.getByTestId("explore-filter-verified");
    this.minPriceInput = page.getByTestId("explore-price-min-input");
    this.maxPriceInput = page.getByTestId("explore-price-max-input");
    this.resetButton = page.getByTestId("explore-reset-filter");
    this.emptyState = page.getByTestId("explore-empty");
    this.loadErrorMessage = page.getByTestId("explore-load-error");
  }

  card(name) {
    return this.cards.filter({ hasText: name });
  }

  avatar(name) {
    return this.card(name).getByTestId("consultant-card-avatar");
  }

  /** @param {string} filterKey kunci dropdown filter, mis. "spesialisasi" atau "verified" */
  option(filterKey, label) {
    return this.page
      .getByTestId(`explore-filter-${filterKey}-option`)
      .filter({ hasText: new RegExp(`^${label}$`) });
  }

  async search(keyword) {
    await this.searchInput.fill(keyword);
  }

  async chooseCategory(label) {
    await this.categoryDropdown.click();
    await this.option("spesialisasi", label).click();
  }

  async chooseVerification(label) {
    await this.verificationDropdown.click();
    await this.option("verified", label).click();
  }

  async setPriceRange({ min, max }) {
    await this.minPriceInput.fill(min);
    await this.maxPriceInput.fill(max);
  }

  async openProfile(name) {
    await this.card(name).getByTestId("consultant-card-detail-btn").click();
  }

  cardTexts() {
    return this.cards.allTextContents();
  }
}
