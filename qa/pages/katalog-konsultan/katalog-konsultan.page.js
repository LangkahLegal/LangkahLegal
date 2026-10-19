import { BasePage } from "../base.page.js";

export class KatalogKonsultanPage extends BasePage {
  path = "/explore";

  constructor(page) {
    super(page);
    this.cards = page.getByTestId("consultant-card");
    this.searchInput = page.getByTestId("explore-search-input");
    this.categoryDropdown = page.getByTestId("explore-filter-spesialisasi");
    this.verificationDropdown = page.getByTestId("explore-filter-verified");
    this.minPriceInput = page.getByPlaceholder("Min");
    this.maxPriceInput = page.getByPlaceholder("Max");
    this.resetButton = page.getByTestId("explore-reset-filter");
    this.emptyState = page.getByText("Tidak Ditemukan");
    this.loadErrorMessage = page.getByText(/gagal|error|coba lagi/i).first();
  }

  card(name) {
    return this.cards.filter({ hasText: name });
  }

  option(label) {
    return this.page.locator("div.cursor-pointer", { hasText: new RegExp(`^${label}$`) });
  }

  async search(keyword) {
    await this.searchInput.fill(keyword);
  }

  async chooseCategory(label) {
    await this.categoryDropdown.click();
    await this.option(label).click();
  }

  async chooseVerification(label) {
    await this.verificationDropdown.click();
    await this.option(label).click();
  }

  async setPriceRange({ min, max }) {
    await this.minPriceInput.fill(min);
    await this.maxPriceInput.fill(max);
  }

  async openProfile(name) {
    await this.card(name).getByRole("link", { name: "Lihat" }).click();
  }

  cardTexts() {
    return this.cards.allTextContents();
  }
}
