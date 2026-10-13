import { BasePage } from "../base.page.js";

export class PengaturanPage extends BasePage {
  path = "/setting";

  constructor(page) {
    super(page);
    this.html = page.locator("html");
    this.verifiedBadge = page.getByText("Terverifikasi", { exact: true });
  }

  heading(name) {
    return this.page.getByRole("heading", { name });
  }

  menuLabel(label) {
    return this.page.getByText(label, { exact: true });
  }

  menu(label) {
    return this.page.locator("div.cursor-pointer", { hasText: label });
  }

  async clickEmptyArea() {
    const { width, height } = this.page.viewportSize();
    await this.page.mouse.click(width - 10, height - 10);
  }
}
