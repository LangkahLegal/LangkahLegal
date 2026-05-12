/**
 * Page Object Model — Payment Page
 * Encapsulates /payment/[id] interactions
 */
import { PAYMENT } from '../utils/selectors.js';

export class PaymentPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.container = page.locator(PAYMENT.PAGE);
    this.payButton = page.locator(PAYMENT.PAY_BTN);
  }

  async goto(consultationId) {
    await this.page.goto(`/payment/${consultationId}`);
    // await this.page.waitForLoadState('networkidle');
  }

  async isLoaded() {
    return this.container.isVisible();
  }

  async getConsultantName() {
    // ClientCard renders the consultant name
    const name = this.page.locator('h3, h4').first();
    return name.textContent();
  }

  async getPaymentBreakdown() {
    const breakdown = this.page.getByText(/Rp|Total/i).first();
    return breakdown.textContent();
  }

  async isPayButtonVisible() {
    return this.payButton.isVisible();
  }

  async clickPay() {
    await this.payButton.click();
  }

  async isSuccessViewVisible() {
    const success = this.page.getByText(/berhasil/i);
    return success.isVisible();
  }

  async isErrorStateVisible() {
    const error = this.page.getByText(/gagal/i);
    return error.isVisible();
  }
}
