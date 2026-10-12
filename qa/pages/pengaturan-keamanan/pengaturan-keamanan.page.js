import { BasePage } from "../base.page.js";

export class PengaturanKeamananPage extends BasePage {
  path = "/setting/security";

  constructor(page) {
    super(page);
    this.newPasswordInput = page.getByLabel("Kata Sandi Baru", { exact: true });
    this.confirmPasswordInput = page.getByLabel("Konfirmasi Kata Sandi Baru");
    this.currentPasswordInput = page.getByLabel(/Kata Sandi Saat Ini|Password Lama/);
    this.saveButton = page.getByRole("button", { name: "Simpan Kata Sandi" });
  }

  async fill({ password, confirmation }) {
    await this.newPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmation);
  }

  async change(values) {
    await this.fill(values);
    await this.saveButton.click();
  }
}
