# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: features\jadwal\jadwal.feature.spec.js >> Jadwal praktik konsultan >> Konsultan menambah slot jadwal baru
- Location: .features-gen\features\jadwal\jadwal.feature.spec.js:12:3

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByTestId('monthly-calendar').getByRole('button', { name: 'chevron_right' })

```

# Test source

```ts
  1  | import { BasePage } from "../base.page.js";
  2  | 
  3  | export class JadwalPage extends BasePage {
  4  |   path = "/schedule";
  5  | 
  6  |   constructor(page) {
  7  |     super(page);
  8  |     this.availabilitySection = page.getByTestId("availability-toggle-section");
  9  |     this.availabilityToggle = this.availabilitySection.getByRole("button");
  10 |     this.calendar = page.getByTestId("monthly-calendar");
  11 |     this.nextMonthButton = this.calendar.getByRole("button", { name: "chevron_right" });
  12 |     this.previousMonthButton = this.calendar.getByRole("button", { name: "chevron_left" });
  13 |     this.modal = page.getByTestId("add-slot-modal");
  14 |     this.saveButton = page.getByTestId("schedule-save-btn");
  15 |     this.closeModalButton = this.modal.getByRole("button", { name: "close" });
  16 |   }
  17 | 
  18 |   day(number) {
  19 |     return this.calendar.getByRole("button", { name: String(number), exact: true });
  20 |   }
  21 | 
  22 |   modalTitle(title) {
  23 |     return this.page.getByText(title);
  24 |   }
  25 | 
  26 |   modalDropdown(label) {
  27 |     return this.modal
  28 |       .locator("div.space-y-3", { has: this.page.locator("label", { hasText: new RegExp(`^${label}$`) }) })
  29 |       .locator("div.cursor-pointer")
  30 |       .first();
  31 |   }
  32 | 
  33 |   async openDayNextMonth(number) {
> 34 |     await this.nextMonthButton.click();
     |                                ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  35 |     await this.day(number).click();
  36 |   }
  37 | 
  38 |   async choose(label, option) {
  39 |     await this.modalDropdown(label).click();
  40 |     await this.modal.locator(".max-h-60 > div").filter({ hasText: new RegExp(`^${option}$`) }).click();
  41 |   }
  42 | 
  43 |   async fillSlot({ start, end }) {
  44 |     await this.choose("Mulai", start);
  45 |     await this.choose("Selesai", end);
  46 |   }
  47 | }
  48 | 
```