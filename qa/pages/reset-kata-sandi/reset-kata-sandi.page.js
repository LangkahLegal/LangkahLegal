import { BasePage } from "../base.page.js";

export class ResetKataSandiPage extends BasePage {
  path = "/auth/reset-password";

  constructor(page) {
    super(page);
    this.newPasswordInput = page.getByTestId("reset-password-new-input");
    this.confirmPasswordInput = page.getByTestId("reset-password-confirm-input");
    this.confirmPasswordLabel = page.getByTestId("reset-password-confirm-label");
    this.submitButton = page.getByTestId("reset-password-submit-btn");
    this.errorMessage = page.getByTestId("reset-password-error-msg");
    this.invalidLinkTitle = page.getByTestId("reset-password-invalid-title");
    this.requestNewLink = page.getByTestId("reset-password-request-link");
    this.expiredMessage = page.getByTestId("reset-password-verify-error").filter({ hasText: /sudah kadaluarsa/ });
    this.inputs = page.getByTestId(/^reset-password-(new|confirm)-input$/);
  }

  async openWithToken({ token, email }) {
    await this.page.goto(`${this.path}?token=${token}&type=recovery&email=${encodeURIComponent(email)}`);
  }

  async submit({ password = "", confirmation = "" } = {}) {
    await this.newPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmation);
    await this.submitButton.click();
  }

  /** Menunggu sebuah pesan tampil; mengembalikan false bila tidak pernah tampil. */
  showsMessage(text) {
    return this.errorMessage
      .filter({ hasText: text })
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
  }

  inputIds() {
    return this.inputs.evaluateAll((inputs) => inputs.map((input) => input.id));
  }
}
