import { BasePage } from "../base.page.js";

export class JadwalPage extends BasePage {
  path = "/schedule";

  constructor(page) {
    super(page);
    this.availabilitySection = page.getByTestId("availability-toggle-section");
    this.availabilityToggle = this.availabilitySection.getByRole("button");
    this.calendar = page.getByTestId("monthly-calendar");
    this.nextMonthButton = this.calendar.getByRole("button", { name: "chevron_right" });
    this.previousMonthButton = this.calendar.getByRole("button", { name: "chevron_left" });
    this.modal = page.getByTestId("add-slot-modal");
    this.saveButton = page.getByTestId("schedule-save-btn");
    this.closeModalButton = this.modal.getByRole("button", { name: "close" });
  }

  day(number) {
    return this.calendar.getByRole("button", { name: String(number), exact: true });
  }

  modalTitle(title) {
    return this.page.getByText(title);
  }

  modalDropdown(label) {
    return this.modal
      .locator("div.space-y-3", { has: this.page.locator("label", { hasText: new RegExp(`^${label}$`) }) })
      .locator("div.cursor-pointer")
      .first();
  }

  async openDayNextMonth(number) {
    await this.nextMonthButton.click();
    await this.day(number).click();
  }

  async choose(label, option) {
    await this.modalDropdown(label).click();
    await this.modal.locator(".max-h-60 > div").filter({ hasText: new RegExp(`^${option}$`) }).click();
  }

  async fillSlot({ start, end }) {
    await this.choose("Mulai", start);
    await this.choose("Selesai", end);
  }
}
