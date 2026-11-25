import { BasePage } from "../base.page.js";

export class BursaKasusPage extends BasePage {
  path = "/bursa";

  constructor(page) {
    super(page);
    this.cards = page.getByTestId("bursa-card");
    this.listTitle = page.getByTestId("bursa-list-title");
    this.countBadge = page.getByTestId("bursa-count-badge");
    this.claimModal = page.getByTestId("bursa-claim-modal");
    this.confirmClaimButton = page.getByTestId("bursa-claim-confirm-btn");
    this.cancelClaimButton = page.getByTestId("bursa-claim-cancel-btn");
    this.claimedTitle = page.getByTestId("success-title").filter({ hasText: "Kasus Berhasil Diklaim!" });
    this.viewConsultationButton = page.getByTestId("success-action-btn");
    this.backToBursaButton = page.getByTestId("success-secondary-action-btn");
    this.loadFailedMessage = page.getByTestId("bursa-load-error");
    this.emptyState = page.getByTestId("bursa-empty");
  }

  card(idBursa) {
    return this.cards.filter({ has: this.page.getByTestId(`bursa-case-${idBursa}`) });
  }

  description(idBursa) {
    return this.card(idBursa).getByTestId("bursa-card-description");
  }

  async chooseCategory(label) {
    await this.page.getByTestId("bursa-filter-kategori").click();
    await this.page.getByTestId("bursa-filter-kategori-option").filter({ hasText: new RegExp(`^${label}$`) }).click();
  }

  async startClaim(idBursa) {
    await this.card(idBursa).getByTestId("bursa-claim-btn").click();
    await this.claimModal.waitFor();
  }

  async claim(idBursa) {
    await this.startClaim(idBursa);
    await this.confirmClaimButton.click();
  }
}
