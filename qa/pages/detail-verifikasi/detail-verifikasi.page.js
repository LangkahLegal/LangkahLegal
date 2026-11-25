import { BasePage } from "../base.page.js";

export class DetailVerifikasiPage extends BasePage {
  constructor(page) {
    super(page);
    this.approveButton = page.getByTestId("request-accept-btn");
    this.rejectButton = page.getByTestId("request-reject-btn");
    this.approveConfirmTitle = page.getByTestId("verification-approve-modal");
    this.confirmApproveButton = this.approveConfirmTitle.getByTestId("verification-confirm-btn");
    this.confirmRejectButton = page.getByTestId("verification-reject-modal").getByTestId("verification-confirm-btn");
    this.reasonInput = page.getByTestId("verification-reason-input");
    this.notFoundMessage = page.getByTestId("verification-not-found");
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
