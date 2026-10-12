import { BasePage } from "../base.page.js";

export const FEATURED_SERVICES = ["Tanya AI Langkah", "Eksplorasi Konsultan", "Ajukan Kasus Anonim"];

export class DashboardKlienPage extends BasePage {
  path = "/dashboard/client";

  constructor(page) {
    super(page);
    this.emptyCard = page.getByText("Belum Ada Konsultasi Aktif");
    this.findConsultantLink = page.getByRole("link", { name: /Cari Konsultan/ });
    this.cardMenuButton = page.getByRole("button", { name: "more_vert" });
    this.cancelOption = page.getByRole("button", { name: /BATALKAN/ });
    this.hideOption = page.getByRole("button", { name: /HAPUS/ });
    this.payButton = page.getByRole("button", { name: /Lanjut Pembayaran/ });
    this.settingsButton = page.getByRole("button", { name: "Settings" });
    this.loadErrorMessage = page.getByText(/gagal|error|coba lagi/i).first();
    this.bottomNav = page.locator("footer").filter({ hasText: "Riwayat" });
  }

  greeting(name) {
    return this.page.getByRole("heading", { name });
  }

  service(name) {
    return this.page.getByText(name);
  }

  statusLabel(label) {
    return this.page.getByText(label, { exact: true });
  }

  bottomNavLink(name) {
    return this.bottomNav.getByRole("link", { name: new RegExp(name) });
  }

  async cancelConsultation() {
    await this.cardMenuButton.click();
    await this.cancelOption.click();
  }

  async hideConsultation() {
    await this.cardMenuButton.click();
    await this.hideOption.click();
  }
}
