import { BasePage } from "../base.page.js";

export class ResetKataSandiPage extends BasePage {
  path = "/auth/reset-password";

  constructor(page) {
    super(page);
    this.newPasswordInput = page.locator('input[name="newPassword"]');
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    this.confirmPasswordLabel = page.getByText("Konfirmasi Password Baru");
    this.submitButton = page.getByRole("button", { name: "Simpan Password Baru" });
    this.invalidLinkTitle = page.getByRole("heading", { name: "Link Tidak Valid" });
    this.requestNewLink = page.getByRole("link", { name: "Minta Link Baru" });
    this.expiredMessage = page.getByText(/sudah kadaluarsa/);
    this.inputs = page.locator("input");
  }

  async openWithToken({ token, email }) {
    await this.page.goto(`${this.path}?token=${token}&type=recovery&email=${encodeURIComponent(email)}`);
  }

  async submit({ password = "", confirmation = "" } = {}) {
    await this.newPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmation);
    await this.submitButton.click();
  }

  /** Menunggu sebuah pesan tampil; mengembalikan false bila tidak pernah tampil. */
  showsMessage(text) {
    return this.page
      .getByText(text)
      .waitFor({ state: "visible", timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
  }

  inputIds() {
    return this.inputs.evaluateAll((inputs) => inputs.map((input) => input.id));
  }
}
