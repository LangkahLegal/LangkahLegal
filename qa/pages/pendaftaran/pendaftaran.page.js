import { BasePage } from "../base.page.js";

export class PendaftaranPage extends BasePage {
  path = "/auth/signup";

  constructor(page) {
    super(page);
    this.nameInput = page.getByTestId("signup-name-input");
    this.emailInput = page.getByTestId("signup-email-input");
    this.passwordInput = page.getByTestId("signup-password-input");
    this.submitButton = page.getByTestId("signup-submit-btn");
    this.errorMessage = page.getByTestId("signup-error-msg");
  }

  async register({ name, email, password }) {
    if (name) await this.nameInput.fill(name);
    if (email) await this.emailInput.fill(email);
    if (password) await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  nameIsMissing() {
    return this.nameInput.evaluate((input) => input.validity.valueMissing);
  }
}
