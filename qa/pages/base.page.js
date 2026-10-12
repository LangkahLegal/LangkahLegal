import { expect } from "@playwright/test";

export class BasePage {
  /** Alamat halaman; diisi oleh turunan yang punya alamat tetap. */
  path = null;

  /** @param {import("@playwright/test").Page} page */
  constructor(page) {
    this.page = page;
  }

  async open() {
    if (!this.path) throw new Error(`${this.constructor.name} tidak punya alamat tetap.`);
    await this.page.goto(this.path);
  }

  async expectNoCrash() {
    await expect(this.page.getByText(/Application error|client-side exception/i)).toHaveCount(0);
  }
}
