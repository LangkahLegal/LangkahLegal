/**
 * Page Object Model — Admin Dashboard Page
 * Encapsulates /dashboard/admin interactions
 */
import { ADMIN } from '../utils/selectors.js';

export class AdminDashboardPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.container = page.locator(ADMIN.DASHBOARD);
  }

  async goto() {
    await this.page.goto('/dashboard/admin');
    // await this.page.waitForLoadState('networkidle');
  }

  async isLoaded() {
    return this.container.isVisible();
  }

  /** Get all stat card values */
  async getStatCards() {
    const cards = this.page.locator('section.grid > div');
    const count = await cards.count();
    const stats = [];
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent();
      stats.push(text?.trim());
    }
    return stats;
  }

  /** Check if verification section is visible */
  async isVerificationSectionVisible() {
    const section = this.page.getByText(/Pengajuan Verifikasi/i);
    return section.isVisible();
  }

  /** Check if transaction monitoring is visible */
  async isTransactionMonitoringVisible() {
    const section = this.page.getByText(/Keuangan|Transaksi/i);
    return section.isVisible();
  }

  /** Get pending verification count from stat cards */
  async getPendingVerificationText() {
    const card = this.page.getByText(/Pending Verifikasi/i);
    if (await card.isVisible()) {
      const parent = card.locator('..');
      return parent.textContent();
    }
    return null;
  }

  /** Navigate to verification detail page */
  async clickVerificationCard(index = 0) {
    const cards = this.page.locator('[class*="VerificationCard"], [class*="verification"]');
    const card = cards.nth(index);
    if (await card.isVisible()) {
      const detailBtn = card.getByText(/detail|lihat/i);
      if (await detailBtn.isVisible()) {
        await detailBtn.click();
      }
    }
  }
}
