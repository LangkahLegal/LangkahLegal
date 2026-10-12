import { BasePage } from "../base.page.js";

export class LupaKataSandiPage extends BasePage {
  path = "/auth/forgot-password";

  constructor(page) {
    super(page);
    this.emailInput = page.getByLabel("Email");
    this.submitButton = page.getByRole("button", { name: "Kirim Link Reset" });
    this.sentTitle = page.getByText("Tautan Terkirim!");
  }

  async requestLink(email) {
    if (email) await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
