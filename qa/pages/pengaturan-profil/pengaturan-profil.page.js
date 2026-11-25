import { BasePage } from "../base.page.js";

export class PengaturanProfilPage extends BasePage {
  path = "/setting/profile";

  constructor(page) {
    super(page);
    this.nameInput = page.getByTestId("profile-name-input");
    this.emailInput = page.getByTestId("profile-email-input");
    this.credentialsTitle = page.getByTestId("profile-credentials-title");
    this.feeInput = page.getByTestId("profile-fee-input");
    this.experienceInput = page.getByTestId("profile-experience-input");
    this.cityInput = page.getByTestId("profile-city-input");
    this.specializationDropdown = page.getByTestId("profile-specialization-dropdown");
    this.specializationOptions = page.getByTestId("profile-specialization-dropdown-option");
    this.portfolioInput = page.getByTestId("profile-portfolio-input");
    this.photoInput = page.getByTestId("profile-photo-input");
    this.avatar = page.getByTestId("profile-avatar");
    this.saveButton = page.getByTestId("profile-save-btn");
    this.rejectionNotice = page.getByTestId("profile-rejection-message");
  }

  async chooseSpecialization(name) {
    await this.specializationDropdown.click();
    await this.specializationOptions.filter({ hasText: new RegExp(`^${name}$`) }).click();
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
