import { BasePage } from "../base.page.js";

export class BursaKasusPage extends BasePage {
  path = "/bursa";

  constructor(page) {
    super(page);
    this.cards = page.getByTestId("bursa-card");
    this.listTitle = page.getByText("Bursa Kasus Tersedia");
    this.countBadge = page.getByText(/^\d+ Kasus$/);
    this.claimModal = page.getByTestId("bursa-claim-modal");
    this.confirmClaimButton = page.getByTestId("bursa-claim-confirm-btn");
    this.cancelClaimButton = page.getByTestId("bursa-claim-cancel-btn");
    this.claimedTitle = page.getByText("Kasus Berhasil Diklaim!");
    this.viewConsultationButton = page.getByRole("button", { name: "Lihat Detail Konsultasi" });
    this.backToBursaButton = page.getByRole("button", { name: "Kembali ke Bursa" });
    this.loadFailedMessage = page.getByText(/Gagal memuat data bursa/);
    this.emptyState = page.getByText("Bursa Kosong");
  }

  card(idBursa) {
    return this.page.locator(`[data-case-id="${idBursa}"]`);
  }

  description(idBursa) {
    return this.card(idBursa).getByTestId("bursa-card-description");
  }

  async chooseCategory(label) {
    await this.page.getByTestId("bursa-filter-kategori").click();
    await this.page.locator("div.cursor-pointer", { hasText: new RegExp(`^${label}$`) }).click();
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
