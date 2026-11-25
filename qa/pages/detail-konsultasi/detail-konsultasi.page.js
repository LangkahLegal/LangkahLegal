import { BasePage } from "../base.page.js";

export class DetailKonsultasiPage extends BasePage {
  constructor(page) {
    super(page);
    this.zoomSectionTitle = page.getByTestId("zoom-link-title");
    this.joinButton = page.getByTestId("zoom-join-session-btn");
    this.startSessionButton = page.getByTestId("zoom-start-session-btn");
    this.copyLinkButton = page.getByTestId("zoom-copy-btn");
    this.copiedIndicator = page.getByTestId("zoom-copied-btn");
    this.addLinkButton = page.getByTestId("zoom-add-link-btn");
    this.zoomLinkInput = page.getByTestId("zoom-link-input");
    this.saveLinkButton = page.getByTestId("zoom-save-btn");
    this.cancelEditButton = page.getByTestId("zoom-cancel-btn");
    this.noLinkMessage = page.getByTestId("zoom-link-empty");

    this.reviewButton = page.getByTestId("consultation-review-btn");
    this.reviewModalTitle = page.getByTestId("rating-modal-title");
    this.stars = page.getByTestId("rating-star-btn");
    this.reviewInput = page.getByTestId("rating-review-input");
    this.sendReviewButton = page.getByTestId("rating-submit-btn");

    this.loadFailedMessage = page.getByTestId("consultation-load-error");
    this.retryButton = page.getByTestId("consultation-retry-btn");
  }

  statusBadge(status) {
    return this.page.getByTestId("consultation-status-badge").filter({ hasText: new RegExp(`^${status}$`) });
  }

  async openReviewForm() {
    await this.reviewButton.click();
    await this.reviewModalTitle.waitFor();
  }

  async writeReview({ stars, text }) {
    if (stars) await this.stars.nth(stars - 1).click();
    if (text) await this.reviewInput.fill(text);
  }

  async saveZoomLink(link) {
    await this.addLinkButton.click();
    await this.zoomLinkInput.fill(link);
    await this.saveLinkButton.click();
  }
}
