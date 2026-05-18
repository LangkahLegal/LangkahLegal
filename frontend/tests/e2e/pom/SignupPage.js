/**
 * Page Object Model — Signup Page
 * Encapsulates all interactions with /auth/signup
 */
import { AUTH } from '../utils/selectors.js';

export class SignupPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.nameInput = page.locator(AUTH.SIGNUP_NAME);
    this.emailInput = page.locator(AUTH.SIGNUP_EMAIL);
    this.passwordInput = page.locator(AUTH.SIGNUP_PASSWORD);
    this.submitButton = page.locator(AUTH.SIGNUP_SUBMIT);
    this.errorMessage = page.locator(AUTH.SIGNUP_ERROR);
    this.googleButton = page.locator(AUTH.GOOGLE_SIGNUP);
    this.form = page.locator(AUTH.SIGNUP_FORM);
  }

  /** Must set pending_role in sessionStorage first (done by RolePage) */
  async goto() {
    await this.page.goto('/auth/signup');
  }

  async fillName(name) {
    await this.nameInput.fill(name);
  }

  async fillEmail(email) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password) {
    await this.passwordInput.fill(password);
  }

  async submitSignup() {
    await this.submitButton.click();
  }

  async signupAs(name, email, password) {
    await this.fillName(name);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submitSignup();
  }

  async getErrorText() {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 10_000 });
    return this.errorMessage.textContent();
  }

  async isErrorVisible() {
    return this.errorMessage.isVisible();
  }
}
