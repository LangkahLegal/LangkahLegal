/**
 * Page Object Model - Bursa Post Page
 * Encapsulates /bursa/post interactions (client side)
 */
import { BURSA } from "../utils/selectors.js";

export class BursaPostPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.container = page.locator(BURSA.POST_PAGE);
    this.submitButton = page.locator(BURSA.POST_SUBMIT_BTN);
    this.descriptionInput = page.locator(BURSA.POST_DESCRIPTION);
  }

  async goto() {
    await this.page.goto("/bursa/post");
    await this.container.waitFor({ state: "visible", timeout: 15_000 });
  }

  async fillDescription(text) {
    await this.descriptionInput.fill(text);
  }

  async selectFirstAvailableDate({ skipToday = true } = {}) {
    const scheduleSection = this.page
      .locator("section", { hasText: "Pilih Jadwal Sesi" })
      .first();
    const dateButtons = scheduleSection.locator(
      "div.no-scrollbar button:not([disabled])",
    );
    const count = await dateButtons.count();

    if (count === 0) {
      throw new Error("No available dates found in schedule picker.");
    }

    const index = skipToday && count > 1 ? 1 : 0;
    await dateButtons.nth(index).click();
  }

  async selectFirstAvailableStartTime() {
    await this.openTimeDropdown("Jam Mulai");

    const menu = this.page.locator("div.bg-dropdown").first();
    const options = menu.locator("div").filter({
      has: this.page.locator("span", { hasText: /\d{2}:\d{2}/ }),
    });

    const count = await options.count();
    for (let i = 0; i < count; i += 1) {
      const option = options.nth(i);
      const className = (await option.getAttribute("class")) || "";
      if (
        !className.includes("opacity-20") &&
        !className.includes("cursor-not-allowed")
      ) {
        await option.click();
        return;
      }
    }

    throw new Error("No available time slots found for start time.");
  }

  async openTimeDropdown(labelText) {
    const scheduleSection = this.page
      .locator("section", { hasText: "Pilih Jadwal Sesi" })
      .first();
    const label = scheduleSection
      .locator("label", { hasText: labelText })
      .first();
    const dropdownRoot = label.locator("..").locator("..");
    const toggle = dropdownRoot.locator(":scope > div").nth(1);
    await toggle.click();
  }

  async submit() {
    await this.submitButton.click();
  }

  async waitForSuccess() {
    await this.page.getByText(/Kasus Berhasil Diposting/i).waitFor({
      state: "visible",
      timeout: 15_000,
    });
  }

  async isSuccessVisible() {
    const success = this.page.getByText(/Kasus Berhasil Diposting/i).first();
    return success.isVisible();
  }
}
