import { BasePage } from "../base.page.js";

export class KatalogKonsultanPage extends BasePage {
  path = "/explore";

  constructor(page) {
    super(page);
    this.cards = page.getByTestId("consultant-card");
    this.searchInput = page.getByTestId("explore-search-input");
    this.filterDropdowns = page.getByRole("button", { name: /^Semua/ });
    this.minPriceInput = page.getByPlaceholder("Min");
    this.maxPriceInput = page.getByPlaceholder("Max");
    this.resetButton = page.getByRole("button", { name: "Reset" });
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

  /** Dropdown yang belum diubah masih berlabel "Semua": kategori di depan, verifikasi di belakang. */
  async chooseCategory(label) {
    await this.filterDropdowns.first().click();
    await this.option(label).click();
  }

  async chooseVerification(label) {
    await this.filterDropdowns.last().click();
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
