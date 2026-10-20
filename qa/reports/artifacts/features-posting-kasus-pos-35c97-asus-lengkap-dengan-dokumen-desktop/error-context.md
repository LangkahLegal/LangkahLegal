# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: features\posting-kasus\posting-kasus.feature.spec.js >> Posting kasus ke bursa >> Klien memposting kasus lengkap dengan dokumen
- Location: .features-gen\features\posting-kasus\posting-kasus.feature.spec.js:11:3

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('button[class*="!w-16"]').filter({ hasText: /^\D+20$/ })

```

# Test source

```ts
  1  | import { BasePage } from "../base.page.js";
  2  | 
  3  | const MONTH_NAMES = [
  4  |   "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  5  |   "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  6  | ];
  7  | 
  8  | export class PostingKasusPage extends BasePage {
  9  |   path = "/bursa/post";
  10 | 
  11 |   constructor(page) {
  12 |     super(page);
  13 |     this.container = page.getByTestId("bursa-post-page");
  14 |     this.title = page.getByText("Ajukan Kasus ke Ruang Publik");
  15 |     this.anonymousNote = page.getByText("secara anonim");
  16 |     this.descriptionInput = page.getByTestId("bursa-description-input");
  17 |     this.submitButton = page.getByTestId("bursa-post-submit-btn");
  18 |     this.fileInput = page.locator('input[type="file"]');
  19 |     this.dateButtons = page.locator('button[class*="!w-16"]');
  20 |     this.monthTrigger = this.dropdown("Bulan");
  21 |     this.startTimeTrigger = this.dropdown("Jam Mulai");
  22 |     this.timeOptions = page.locator(".max-h-60 > div");
  23 |     this.successTitle = page.getByText("Kasus Berhasil Diposting ke Ruang Publik!");
  24 |     this.backToDashboardButton = page.getByRole("button", { name: "Kembali ke Dashboard" });
  25 |   }
  26 | 
  27 |   dropdown(label) {
  28 |     return this.page
  29 |       .locator("div.space-y-3", { has: this.page.locator("label", { hasText: label }) })
  30 |       .locator("div.cursor-pointer")
  31 |       .first();
  32 |   }
  33 | 
  34 |   categoryButton(name) {
  35 |     return this.page.getByRole("button", { name, exact: true });
  36 |   }
  37 | 
  38 |   timeOption(time) {
  39 |     return this.timeOptions.filter({ hasText: new RegExp(`^${time}`) });
  40 |   }
  41 | 
  42 |   attachment(fileName) {
  43 |     return this.page.getByText(fileName);
  44 |   }
  45 | 
  46 |   /** @param {string} date tanggal YYYY-MM-DD; bulan diganti dulu bila berbeda dari bulan ini */
  47 |   async pickDate(date, today) {
  48 |     const [, month, day] = date.split("-").map(Number);
  49 |     if (Number(today.split("-")[1]) !== month) {
  50 |       await this.monthTrigger.click();
  51 |       await this.page.locator(".max-h-52 > div").filter({ hasText: new RegExp(`^${MONTH_NAMES[month - 1]}`, "i") }).click();
  52 |     }
> 53 |     await this.dateButtons.filter({ hasText: new RegExp(`^\\D+${day}$`) }).click();
     |                                                                            ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  54 |   }
  55 | 
  56 |   async openStartTimes() {
  57 |     await this.startTimeTrigger.click();
  58 |   }
  59 | 
  60 |   async pickStartTime(time) {
  61 |     await this.openStartTimes();
  62 |     await this.timeOption(time).click();
  63 |   }
  64 | 
  65 |   async attach(file) {
  66 |     await this.fileInput.setInputFiles(file);
  67 |   }
  68 | }
  69 | 
```