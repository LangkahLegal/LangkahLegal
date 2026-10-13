import { BasePage } from "../base.page.js";

export class BuatKataSandiPage extends BasePage {
  path = "/auth/create-password";

  constructor(page) {
    super(page);
    this.passwordInput = page.getByTestId("create-password-input");
    this.confirmInput = page.getByTestId("create-password-confirm-input");
    this.submitButton = page.getByTestId("create-password-submit-btn");
    this.errorMessage = page.getByTestId("create-password-error-msg");
  }

  /** Menunggu pesan galat tertentu tampil; mengembalikan false bila tidak pernah tampil. */
  showsMessage(text) {
    return this.errorMessage
      .filter({ hasText: text })
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
  }

  async submit({ password, confirmation }) {
    await this.passwordInput.fill(password);
    await this.confirmInput.fill(confirmation);
    await this.submitButton.click();
  }
}
