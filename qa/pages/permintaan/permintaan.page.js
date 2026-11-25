import { BasePage } from "../base.page.js";

export class PermintaanPage extends BasePage {
  constructor(page) {
    super(page);
    this.title = page.getByTestId("page-header-title").filter({ hasText: "Detail Permintaan" });
    this.acceptButton = page.getByTestId("request-accept-btn");
    this.rejectButton = page.getByTestId("request-reject-btn");
    this.fromBursaBadge = page.getByTestId("request-bursa-badge");
    this.scheduleAndAcceptButton = page.getByTestId("request-schedule-accept-btn");
    this.startSelect = page.getByTestId("request-start-select");
    this.endSelect = page.getByTestId("request-end-select");
    this.noSlotMessage = page.getByTestId("request-slot-empty");
    this.scheduleLink = page.getByTestId("request-schedule-link");
    this.backToDashboardButton = page.getByTestId("success-action-btn");
    this.notFoundMessage = page.getByTestId("request-not-found-message");
  }

  slot(label) {
    return this.page.getByTestId("request-slot-item").filter({ hasText: label });
  }

  async acceptTwice() {
    await this.acceptButton.click();
    await this.acceptButton.click({ timeout: 1_000 }).catch(() => {});
  }

  async schedule({ slotLabel, start, end }) {
    await this.slot(slotLabel).click();
    await this.startSelect.selectOption(start);
    await this.endSelect.selectOption(end);
    await this.scheduleAndAcceptButton.click();
  }
}
