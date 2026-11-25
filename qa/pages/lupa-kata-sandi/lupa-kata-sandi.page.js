import { BasePage } from "../base.page.js";

export class LupaKataSandiPage extends BasePage {
  path = "/auth/forgot-password";

  constructor(page) {
    super(page);
    this.emailInput = page.getByTestId("forgot-password-email-input");
    this.submitButton = page.getByTestId("forgot-password-submit-btn");
    this.sentTitle = page.getByTestId("forgot-password-sent-message");
  }

  async requestLink(email) {
    if (email) await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
