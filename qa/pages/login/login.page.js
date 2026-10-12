import { BasePage } from "../base.page.js";

export class LoginPage extends BasePage {
  path = "/auth/login";

  constructor(page) {
    super(page);
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-btn");
    this.errorMessage = page.getByTestId("login-error-msg");
    this.googleButton = page.getByTestId("google-login-btn");
    this.showPasswordButton = page.getByRole("button", { name: "Tampilkan password" });
    this.hidePasswordButton = page.getByRole("button", { name: "Sembunyikan password" });
    this.forgotPasswordLink = page.getByRole("link", { name: "Lupa Password?" });
    this.signUpLink = page.getByRole("link", { name: "Daftar" });
  }

  async fill({ email, password }) {
    if (email) await this.emailInput.fill(email);
    if (password) await this.passwordInput.fill(password);
  }

  async login(credentials) {
    await this.fill(credentials);
    await this.submitButton.click();
  }

  emailValidity(flag) {
    return this.emailInput.evaluate((input, name) => input.validity[name], flag);
  }
}
