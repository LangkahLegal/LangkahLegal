import { BasePage } from "../base.page.js";

export class VerifikasiOtpPage extends BasePage {
  path = "/auth/verify";

  constructor(page) {
    super(page);
    this.boxes = page.getByTestId("otp-digit-input");
    this.verifyButton = page.getByTestId("otp-verify-btn");
    this.resendButton = page.getByTestId("otp-resend-btn");
  }

  box(position) {
    return this.boxes.nth(position - 1);
  }

  async fillCode(code) {
    for (const [index, character] of [...code].entries()) await this.boxes.nth(index).fill(character);
  }

  async verify(code) {
    await this.fillCode(code);
    await this.verifyButton.click();
  }

  async paste(text) {
    await this.box(1).focus();
    await this.page.evaluate((value) => {
      const clipboard = new DataTransfer();
      clipboard.setData("text", value);
      document.activeElement.dispatchEvent(new ClipboardEvent("paste", { clipboardData: clipboard, bubbles: true }));
    }, text);
  }

  code() {
    return this.boxes.evaluateAll((inputs) => inputs.map((input) => input.value).join(""));
  }
}
