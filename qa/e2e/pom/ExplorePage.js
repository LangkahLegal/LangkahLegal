/**
 * Page Object Model — Explore / Consultant Directory Page
 * Encapsulates /explore interactions
 */
import { EXPLORE } from '../utils/selectors.js';

export class ExplorePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator(EXPLORE.SEARCH_INPUT);
    this.consultantCards = page.locator(EXPLORE.CONSULTANT_CARD);
  }

  async goto() {
    await this.page.goto('/explore');
    // Wait for the search input to indicate page has loaded
    await this.searchInput.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async searchConsultant(text) {
    await this.searchInput.fill(text);
  }

  async clearSearch() {
    await this.searchInput.fill('');
  }

  /** Click a category filter button by label text */
  async selectCategory(label) {
    await this.page.getByRole('button', { name: label, exact: true }).click();
  }

  async getCardCount() {
    // Brief wait for DOM to settle after filtering
    await this.page.waitForTimeout(500);
    return this.consultantCards.count();
  }

  /** Click the "Lihat" link on the nth card (0-indexed) */
  async clickConsultantCard(index = 0) {
    const card = this.consultantCards.nth(index);
    const link = card.locator('a', { hasText: 'Lihat' });
    await link.click();
  }

  async getConsultantNames() {
    const cards = await this.consultantCards.all();
    const names = [];
    for (const card of cards) {
      const name = await card.locator('h3').textContent();
      names.push(name?.trim());
    }
    return names;
  }

  async isEmptyStateVisible() {
    const empty = this.page.locator('text=Tidak ada konsultan yang ditemukan');
    return empty.isVisible();
  }
}
