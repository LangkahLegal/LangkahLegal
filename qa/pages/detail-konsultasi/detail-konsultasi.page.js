import { BasePage } from "../base.page.js";

export class DetailKonsultasiPage extends BasePage {
  constructor(page) {
    super(page);
    this.zoomSectionTitle = page.getByText("Link Zoom Meetings");
    this.joinButton = page.getByRole("button", { name: "Gabung Sesi Konsultasi" });
    this.startSessionButton = page.getByRole("button", { name: "Mulai Sesi Konsultasi" });
    this.copyLinkButton = page.getByRole("button", { name: "content_copy" });
    this.copiedIndicator = page.getByRole("button", { name: "check" });
    this.addLinkButton = page.getByRole("button", { name: "add_link" });
    this.zoomLinkInput = page.getByPlaceholder("https://zoom.us/j/123456789");
    this.saveLinkButton = page.getByRole("button", { name: "Simpan" });
    this.cancelEditButton = page.getByRole("button", { name: "Batal" });
    this.noLinkMessage = page.getByText("Link belum tersedia");

    this.reviewButton = page.getByRole("button", { name: "Beri Ulasan & Selesaikan" });
    this.reviewModalTitle = page.getByText("Sesi Selesai");
    this.stars = page.getByRole("button", { name: /^star/ });
    this.reviewInput = page.getByPlaceholder("Bagikan pengalaman konsultasi Anda di sini...");
    this.sendReviewButton = page.getByRole("button", { name: "Kirim Ulasan" });

    this.loadFailedMessage = page.getByText("Gagal memuat detail konsultasi.");
    this.retryButton = page.getByRole("button", { name: "Coba Lagi" });
  }

  statusBadge(status) {
    return this.page.getByText(status, { exact: true });
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
