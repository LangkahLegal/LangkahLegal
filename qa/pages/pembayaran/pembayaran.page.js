import { BasePage } from "../base.page.js";

export class PembayaranPage extends BasePage {
  constructor(page) {
    super(page);
    this.container = page.getByTestId("payment-page");
    this.payButton = page.getByTestId("payment-pay-btn");
    this.notPayableNotice = page.getByTestId("payment-not-payable");
    this.costBreakdownTitle = page.getByTestId("payment-breakdown-title");
    this.pricePerSessionLabel = page.getByTestId("payment-price-per-session").filter({ hasText: "Harga Per Sesi (30 Menit)" });
    this.successTitle = page.getByTestId("success-title").filter({ hasText: "Pembayaran Berhasil!" });
    this.backToDashboardButton = page.getByTestId("success-action-btn");
    this.loadFailedTitle = page.getByTestId("payment-load-error");
    this.retryButton = page.getByTestId("payment-retry-btn");
  }

  async pay() {
    await this.payButton.click();
  }

  async payTwice() {
    await this.payButton.click();
    await this.payButton.click({ force: true, timeout: 1_000 }).catch(() => {});
  }
}
