import { BasePage } from "../base.page.js";

const DROPDOWN = { Mulai: "schedule-start-dropdown", Selesai: "schedule-end-dropdown", "Status Slot": "schedule-status-dropdown" };

export class JadwalPage extends BasePage {
  path = "/schedule";

  constructor(page) {
    super(page);
    this.availabilitySection = page.getByTestId("availability-toggle-section");
    this.availabilityToggle = this.availabilitySection.getByTestId("availability-toggle-btn");
    this.calendar = page.getByTestId("monthly-calendar");
    this.nextMonthButton = this.calendar.getByTestId("calendar-next-btn");
    this.previousMonthButton = this.calendar.getByTestId("calendar-prev-btn");
    this.modal = page.getByTestId("schedule-slot-form");
    this.saveButton = page.getByTestId("schedule-save-btn");
  }

  day(number) {
    return this.calendar.getByTestId("date-slot").filter({ hasText: new RegExp(`^${number}$`) });
  }

  modalTitle(title) {
    return this.page.getByTestId("schedule-slot-title").filter({ hasText: title });
  }

  modalDropdown(label) {
    return this.modal.getByTestId(DROPDOWN[label]);
  }

  async openDayNextMonth(number) {
    await this.nextMonthButton.click();
    await this.day(number).click();
  }

  async choose(label, option) {
    await this.modalDropdown(label).click();
    await this.modal.getByTestId(`${DROPDOWN[label]}-option`).filter({ hasText: option }).click();
  }

  async fillSlot({ start, end }) {
    await this.choose("Mulai", start);
    await this.choose("Selesai", end);
  }
}
