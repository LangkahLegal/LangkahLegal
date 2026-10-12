/**
 * Page Object Model - Bursa Page
 * Encapsulates /bursa interactions (consultant side)
 */
import { BURSA } from "../utils/selectors.js";

export class BursaPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.container = page.locator(BURSA.PAGE);
    this.cards = page.locator(BURSA.CARD);
    this.claimModal = page.locator(BURSA.CLAIM_MODAL);
    this.claimConfirmButton = page.locator(BURSA.CLAIM_CONFIRM_BTN);
  }

  async goto() {
    await this.page.goto("/bursa");
    await this.container.waitFor({ state: "visible", timeout: 15_000 });
  }

  async filterByCategory(label) {
    await this.page
      .getByRole("button", { name: new RegExp(label, "i") })
      .click();
  }

  async waitForCase(description) {
    await this.page.getByText(description, { exact: false }).waitFor({
      state: "visible",
      timeout: 15_000,
    });
  }

  async claimCaseByDescription(description) {
    const card = this.cards.filter({ hasText: description }).first();
    await card.locator(BURSA.CLAIM_BUTTON).click();
  }

  async confirmClaim() {
    await this.claimModal.waitFor({ state: "visible", timeout: 10_000 });
    await this.claimConfirmButton.click();
  }

  async waitForSuccess() {
    await this.page.getByText(/Kasus Berhasil Diklaim/i).waitFor({
      state: "visible",
      timeout: 15_000,
    });
  }

  async isSuccessVisible() {
    const success = this.page.getByText(/Kasus Berhasil Diklaim/i).first();
    return success.isVisible();
  }
}
