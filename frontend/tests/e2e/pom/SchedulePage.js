/**
 * Page Object Model — Schedule Management Page
 * Encapsulates /schedule interactions (consultant-only)
 */
import { SCHEDULE } from '../utils/selectors.js';

export class SchedulePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.availabilityToggle = page.locator(SCHEDULE.AVAILABILITY_TOGGLE);
    this.calendar = page.locator(SCHEDULE.MONTHLY_CALENDAR);
    this.modal = page.locator(SCHEDULE.ADD_SLOT_MODAL);
    this.saveBtn = page.locator(SCHEDULE.SAVE_BTN);
  }

  async goto() {
    await this.page.goto('/schedule');
    // await this.page.waitForLoadState('networkidle');
  }

  /** Check if the schedule page loaded (calendar visible) */
  async isLoaded() {
    return this.calendar.isVisible();
  }

  /** Check availability toggle status text */
  async getAvailabilityText() {
    const text = this.availabilityToggle.locator('p').first();
    return text.textContent();
  }

  /** Click a specific date on the calendar (opens modal) */
  async clickCalendarDate(dayNumber) {
    const btn = this.calendar.locator(`button:has-text("${dayNumber}")`);
    await btn.click();
  }

  /** Check if the add/edit slot modal is open */
  async isModalOpen() {
    return this.modal.isVisible();
  }

  /** Close the modal */
  async closeModal() {
    const closeBtn = this.modal.locator('button:has(span:text("close"))');
    await closeBtn.click();
  }

  /** Get the modal title text */
  async getModalTitle() {
    const title = this.modal.locator('h3').first();
    return title.textContent();
  }

  /** Select start time from dropdown */
  async selectStartTime(time) {
    // Click the "Mulai" dropdown area
    const startDropdown = this.modal.locator('text=Mulai').locator('..').locator('button, [role="listbox"], [class*="Dropdown"]').first();
    await startDropdown.click();
    // Select the time option
    await this.page.locator(`text="${time}"`).first().click();
  }

  /** Select end time from dropdown */
  async selectEndTime(time) {
    const endDropdown = this.modal.locator('text=Selesai').locator('..').locator('button, [role="listbox"], [class*="Dropdown"]').first();
    await endDropdown.click();
    await this.page.locator(`text="${time}"`).first().click();
  }

  /** Click save/submit button in modal */
  async clickSave() {
    await this.saveBtn.click();
  }

  /** Navigate to next month */
  async nextMonth() {
    const nextBtn = this.calendar.locator('button:has(span:text("chevron_right"))');
    await nextBtn.click();
  }

  /** Navigate to previous month */
  async prevMonth() {
    const prevBtn = this.calendar.locator('button:has(span:text("chevron_left"))');
    await prevBtn.click();
  }

  /** Get the current month label */
  async getMonthLabel() {
    const label = this.calendar.locator('h2').first();
    return label.textContent();
  }

  /** Get dates that have event indicators (dots) */
  async getDatesWithEvents() {
    const dots = this.calendar.locator('div.bg-primary.rounded-full');
    return dots.count();
  }
}
