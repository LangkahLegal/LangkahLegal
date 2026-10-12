import { BasePage } from "../base.page.js";

export class CallbackOauthPage extends BasePage {
  path = "/auth/callback";

  constructor(page) {
    super(page);
    this.errorTitle = page.getByText("Terjadi Kesalahan");
    this.backToLoginButton = page.getByRole("button", { name: "Kembali ke Login" });
  }

  /** @param {Record<string, string>} query parameter yang dibawa pulang dari Google */
  async openWith(query) {
    await this.page.goto(`${this.path}?${new URLSearchParams(query)}`);
  }
}
