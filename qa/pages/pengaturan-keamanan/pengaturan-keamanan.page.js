import { BasePage } from "../base.page.js";

export class PengaturanKeamananPage extends BasePage {
  path = "/setting/security";

  constructor(page) {
    super(page);
    this.newPasswordInput = page.getByTestId("security-new-password-input");
    this.confirmPasswordInput = page.getByTestId("security-confirm-password-input");
    this.currentPasswordInput = page.getByTestId("security-current-password-input");
    this.saveButton = page.getByTestId("security-save-btn");
  }

  async fill({ current, password, confirmation }) {
    if (current) await this.currentPasswordInput.fill(current);
    await this.newPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmation);
  }

  async change(values) {
    await this.fill(values);
    await this.saveButton.click();
  }
}
