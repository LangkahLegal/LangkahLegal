/**
 * Page Object Model — Dashboard Page
 * Encapsulates /dashboard/* interactions
 */

export class DashboardPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto(role = 'client') {
    await this.page.goto(`/dashboard/${role}`);
    // await this.page.waitForLoadState('networkidle');
  }

  async isVisible() {
    // Dashboard pages have a sidebar or main content area
    await this.page.waitForTimeout(1000);
    const url = this.page.url();
    return url.includes('/dashboard/');
  }

  async getPageTitle() {
    const header = this.page.locator('h1, h2').first();
    return header.textContent();
  }

  async getCurrentURL() {
    return this.page.url();
  }
}
