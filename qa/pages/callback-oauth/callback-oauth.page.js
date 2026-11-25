import { BasePage } from "../base.page.js";

export class CallbackOauthPage extends BasePage {
  path = "/auth/callback";

  constructor(page) {
    super(page);
    this.errorTitle = page.getByTestId("oauth-callback-error-title");
    this.backToLoginButton = page.getByTestId("oauth-callback-back-to-login-btn");
  }

  /** @param {Record<string, string>} query parameter yang dibawa pulang dari Google */
  async openWith(query) {
    await this.page.goto(`${this.path}?${new URLSearchParams(query)}`);
  }
}
