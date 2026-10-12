import { BasePage } from "../base.page.js";

export class DetailVerifikasiPage extends BasePage {
  constructor(page) {
    super(page);
    this.approveButton = page.getByRole("button", { name: /Terima/ });
    this.rejectButton = page.getByRole("button", { name: /Tolak/ }).first();
    this.approveConfirmTitle = page.getByText("Verifikasi Konsultan?");
    this.confirmApproveButton = page.getByRole("button", { name: "Ya, Verifikasi" });
    this.confirmRejectButton = page.getByRole("button", { name: "Ya, Tolak" });
    this.reasonInput = page.getByPlaceholder("Masukkan alasan penolakan agar konsultan mengetahuinya...");
    this.notFoundMessage = page.getByText("Data Konsultan Tidak Ditemukan");
  }

  async approve() {
    await this.approveButton.click();
    await this.approveConfirmTitle.waitFor();
    await this.confirmApproveButton.click();
  }

  async startRejecting() {
    await this.rejectButton.click();
    await this.reasonInput.waitFor();
  }
}
