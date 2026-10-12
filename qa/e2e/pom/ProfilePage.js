/**
 * Page Object Model — Profile Settings Page
 * Encapsulates /setting/profile interactions
 */

export class ProfilePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/setting/profile');
    // await this.page.waitForLoadState('networkidle');
  }

  async getDisplayName() {
    // The profile form should have a name input
    const nameInput = this.page.locator('input[name="name"], input[name="nama"]').first();
    if (await nameInput.isVisible()) {
      return nameInput.inputValue();
    }
    return null;
  }

  async updateName(newName) {
    const nameInput = this.page.locator('input[name="name"], input[name="nama"]').first();
    await nameInput.fill(newName);
  }

  async save() {
    const saveBtn = this.page.getByRole('button', { name: /simpan/i });
    await saveBtn.click();
  }

  async isConsultantFieldVisible() {
    // Consultant-specific fields like spesialisasi, tarif
    const specField = this.page.locator('input[name="spesialisasi"], textarea[name="spesialisasi"]');
    return specField.isVisible();
  }

  async isLoading() {
    const spinner = this.page.locator('.animate-spin');
    return spinner.isVisible();
  }
}
