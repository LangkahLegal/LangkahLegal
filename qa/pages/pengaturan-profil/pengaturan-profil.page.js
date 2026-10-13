import { BasePage } from "../base.page.js";

export class PengaturanProfilPage extends BasePage {
  path = "/setting/profile";

  constructor(page) {
    super(page);
    this.nameInput = page.getByPlaceholder("John Doe");
    this.emailInput = page.getByPlaceholder("example@langkahlegal.id");
    this.credentialsTitle = page.getByText("Kredensial Profesional");
    this.feeInput = page.getByPlaceholder("Rp 150.000");
    this.experienceInput = page.getByPlaceholder("Contoh: 5");
    this.cityInput = page.locator("label", { hasText: /^Kota Praktik$/ }).locator("xpath=following-sibling::input");
    this.specializationDropdown = page
      .locator("div.space-y-3", { has: page.locator("label", { hasText: /^Spesialisasi$/ }) })
      .locator("div.cursor-pointer")
      .first();
    this.portfolioInput = page.locator('input[type="file"][accept=".pdf"]');
    this.photoInput = page.locator('input[type="file"][accept="image/*"]');
    this.avatar = page.getByAltText("Profile");
    this.saveButton = page.getByRole("button", { name: "Simpan Perubahan" });
    this.rejectionNotice = page.getByText("Pengajuan Verifikasi Ditolak");
  }

  async chooseSpecialization(name) {
    await this.specializationDropdown.click();
    await this.page.locator(".max-h-60 > div").filter({ hasText: new RegExp(`^${name}$`) }).click();
  }

  async fillCredentials({ fee, experience, specialization, city, portfolio }) {
    if (fee) await this.feeInput.fill(fee);
    if (experience) await this.experienceInput.fill(experience);
    if (specialization) await this.chooseSpecialization(specialization);
    if (city) await this.cityInput.fill(city);
    if (portfolio) await this.portfolioInput.setInputFiles(portfolio);
  }

  async save() {
    await this.saveButton.click();
  }
}
