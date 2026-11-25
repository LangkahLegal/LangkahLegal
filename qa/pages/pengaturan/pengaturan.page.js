import { BasePage } from "../base.page.js";

export class PengaturanPage extends BasePage {
  path = "/setting";

  constructor(page) {
    super(page);
    this.html = page.locator("html");
    this.verifiedBadge = page.getByTestId("settings-verification-badge").filter({ hasText: /^Terverifikasi$/ });
  }

  heading(name) {
    return this.page.getByTestId("settings-profile-name").filter({ hasText: name });
  }

  menuLabel(label) {
    return this.page.getByTestId("settings-menu-label").filter({ hasText: label });
  }

  menu(label) {
    return this.page.getByTestId("settings-menu-item").filter({ hasText: label });
  }

  async clickEmptyArea() {
    const { width, height } = this.page.viewportSize();
    await this.page.mouse.click(width - 10, height - 10);
  }
}
