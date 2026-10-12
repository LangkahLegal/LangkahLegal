import { BasePage } from "../base.page.js";

const ROLE_CARD = { klien: "role-card-client", konsultan: "role-card-konsultan" };

export class PeranPage extends BasePage {
  path = "/auth/role";

  constructor(page) {
    super(page);
    this.continueButton = page.getByTestId("role-continue-btn");
  }

  card(role) {
    return this.page.getByTestId(ROLE_CARD[role]);
  }

  radio(role) {
    return this.card(role).locator("input");
  }

  async choose(role) {
    await this.card(role).click();
    await this.continueButton.click();
  }
}
