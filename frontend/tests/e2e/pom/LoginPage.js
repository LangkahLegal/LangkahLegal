/**
 * Page Object Model — Login Page
 * Encapsulates all interactions with /auth/login
 */
import { AUTH } from '../utils/selectors.js';

export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator(AUTH.LOGIN_EMAIL);
    this.passwordInput = page.locator(AUTH.LOGIN_PASSWORD);
    this.submitButton = page.locator(AUTH.LOGIN_SUBMIT);
    this.errorMessage = page.locator(AUTH.LOGIN_ERROR);
    this.googleButton = page.locator(AUTH.GOOGLE_LOGIN);
    this.form = page.locator(AUTH.LOGIN_FORM);
  }

  async goto() {
    await this.page.goto('/auth/login');
    await this.form.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  async submitLogin() {
    await this.submitButton.click();
  }

  /** Full login helper */
  async loginAs(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submitLogin();
  }

  async getErrorText() {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 10_000 });
    return this.errorMessage.textContent();
  }

  async isErrorVisible() {
    return this.errorMessage.isVisible();
  }

  async clickGoogleLogin() {
    await this.googleButton.click();
  }

  /** Navigate to signup via footer link */
  async goToSignup() {
    await this.page.getByRole('link', { name: /daftar/i }).click();
  }
}
