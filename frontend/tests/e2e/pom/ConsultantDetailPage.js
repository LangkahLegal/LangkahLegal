/**
 * Page Object Model — Consultant Detail & Booking Page
 * Encapsulates /explore/[id] interactions
 */

export class ConsultantDetailPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto(consultantId) {
    await this.page.goto(`/explore/${consultantId}`);
    // await this.page.waitForLoadState('networkidle');
  }

  async getConsultantName() {
    // The hero section typically has an h1 or h2 with the consultant name
    const heading = this.page.locator('main h1, main h2').first();
    return heading.textContent();
  }

  async getPriceText() {
    // Look for price indicator (Rp or tarif)
    const price = this.page.getByText(/Rp|tarif/i).first();
    return price.textContent();
  }

  /** Select an available date in the schedule picker */
  async selectAvailableDate() {
    // Click the first date button that has an event indicator (dot)
    const dateBtn = this.page.locator('button:has(div.bg-primary)').first();
    if (await dateBtn.isVisible()) {
      await dateBtn.click();
      return true;
    }
    return false;
  }

  async fillDescription(text) {
    const textarea = this.page.locator('textarea').first();
    await textarea.fill(text);
  }

  async submitBooking() {
    const btn = this.page.getByRole('button', { name: /booking/i });
    await btn.click();
  }

  async isSuccessViewVisible() {
    const success = this.page.getByText(/berhasil/i);
    return success.isVisible();
  }

  async waitForSuccessView() {
    await this.page.getByText(/berhasil/i).waitFor({ state: 'visible', timeout: 15_000 });
  }
}
