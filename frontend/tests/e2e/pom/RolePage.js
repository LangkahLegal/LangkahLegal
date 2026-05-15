/**
 * Page Object Model — Role Selection Page
 * Encapsulates /auth/role interactions
 */
import { AUTH } from '../utils/selectors.js';

export class RolePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.clientCard = page.locator(AUTH.ROLE_CARD_CLIENT);
    this.consultantCard = page.locator(AUTH.ROLE_CARD_KONSULTAN);
    this.continueButton = page.locator(AUTH.ROLE_CONTINUE);
  }

  async goto() {
    await this.page.goto('/auth/role');
  }

  async selectClient() {
    await this.clientCard.click();
  }

  async selectConsultant() {
    await this.consultantCard.click();
  }

  async selectRole(role) {
    if (role === 'client') {
      await this.selectClient();
    } else {
      await this.selectConsultant();
    }
  }

  async clickContinue() {
    await this.continueButton.click();
  }

  /** Select role and proceed to signup */
  async selectAndContinue(role) {
    await this.selectRole(role);
    await this.clickContinue();
  }
}
