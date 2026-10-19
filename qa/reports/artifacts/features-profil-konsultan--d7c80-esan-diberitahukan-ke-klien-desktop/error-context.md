# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: features\profil-konsultan\profil-konsultan.feature.spec.js >> Profil konsultan dan pemesanan konsultasi >> Penolakan backend saat memesan diberitahukan ke klien
- Location: .features-gen\features\profil-konsultan\profil-konsultan.feature.spec.js:80:3

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('button[class*="!w-16"]:not([disabled])').first()

```

# Test source

```ts
  1  | import { BasePage } from "../base.page.js";
  2  | 
  3  | export class ProfilKonsultanPage extends BasePage {
  4  |   constructor(page) {
  5  |     super(page);
  6  |     this.verifiedBadge = page.getByText("✅ Verified");
  7  |     this.scheduleTitle = page.getByText("Pilih Jadwal Sesi");
  8  |     this.availableDates = page.locator('button[class*="!w-16"]:not([disabled])');
  9  |     this.startTimeTrigger = page
  10 |       .locator("div.space-y-3", { has: page.locator("label", { hasText: "Jam Mulai" }) })
  11 |       .locator("div.cursor-pointer")
  12 |       .first();
  13 |     this.timeOptions = page.locator(".max-h-60 > div");
  14 |     this.descriptionInput = page.getByPlaceholder("Ceritakan detail permasalahan hukum Anda di sini...");
  15 |     this.fileInput = page.locator('input[type="file"]');
  16 |     this.bookButton = page.getByRole("button", { name: "Booking Konsultasi" });
  17 |     this.processingButton = page.getByRole("button", { name: /Memproses/ });
  18 |     this.successTitle = page.getByText("Permintaan Booking Berhasil Terkirim!");
  19 |     this.backToDashboardButton = page.getByRole("button", { name: "Kembali ke Dashboard" });
  20 |     this.notFoundMessage = page.getByText(/tidak ditemukan/i);
  21 |   }
  22 | 
  23 |   async openFor(idKonsultan) {
  24 |     await this.page.goto(`/explore/${idKonsultan}`);
  25 |   }
  26 | 
  27 |   heading(name) {
  28 |     return this.page.getByRole("heading", { name });
  29 |   }
  30 | 
  31 |   timeOption(time) {
  32 |     return this.timeOptions.filter({ hasText: new RegExp(`^${time}`) });
  33 |   }
  34 | 
  35 |   attachment(fileName) {
  36 |     return this.page.getByText(fileName);
  37 |   }
  38 | 
  39 |   async openStartTimes() {
> 40 |     await this.availableDates.first().click();
     |                                       ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  41 |     await this.startTimeTrigger.click();
  42 |   }
  43 | 
  44 |   async pickSchedule(startTime) {
  45 |     await this.openStartTimes();
  46 |     await this.timeOption(startTime).click();
  47 |   }
  48 | 
  49 |   async attach(file) {
  50 |     await this.fileInput.setInputFiles(file);
  51 |   }
  52 | 
  53 |   async removeAttachment(fileName) {
  54 |     const row = this.attachment(fileName).locator("xpath=ancestor::div[contains(@class,'relative')][1]");
  55 |     await row.getByRole("button", { name: "more_vert" }).click();
  56 |     await this.page.getByRole("button", { name: /Hapus Berkas/ }).click();
  57 |   }
  58 | 
  59 |   async book({ start, description, document }) {
  60 |     if (start) await this.pickSchedule(start);
  61 |     if (description !== undefined) await this.descriptionInput.fill(description);
  62 |     if (document) await this.attach(document);
  63 |     await this.bookButton.click();
  64 |   }
  65 | }
  66 | 
```