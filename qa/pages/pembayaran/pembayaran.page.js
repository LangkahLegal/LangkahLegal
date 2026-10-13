import { BasePage } from "../base.page.js";

export class PembayaranPage extends BasePage {
  constructor(page) {
    super(page);
    this.container = page.getByTestId("payment-page");
    this.payButton = page.getByTestId("payment-pay-btn");
    this.costBreakdownTitle = page.getByText("Rincian Biaya");
    this.pricePerSessionLabel = page.getByText("Harga Per Sesi (30 Menit)");
    this.successTitle = page.getByText("Pembayaran Berhasil!");
    this.backToDashboardButton = page.getByRole("button", { name: "Kembali ke Dashboard" });
    this.loadFailedTitle = page.getByText("Gagal Memuat Pembayaran");
    this.retryButton = page.getByRole("button", { name: "Coba Lagi" });
  }

  async pay() {
    await this.payButton.click();
  }

  async payTwice() {
    await this.payButton.click();
    await this.payButton.click({ force: true, timeout: 1_000 }).catch(() => {});
  }
}
