import { BasePage } from "../base.page.js";

export const FEATURED_SERVICES = ["Tanya AI Langkah", "Eksplorasi Konsultan", "Ajukan Kasus Anonim"];

export class DashboardKlienPage extends BasePage {
  path = "/dashboard/client";

  constructor(page) {
    super(page);
    this.emptyCard = page.getByTestId("consultation-empty");
    this.findConsultantLink = page.getByTestId("consultation-empty-find-btn");
    this.cardMenuButton = page.getByTestId("consultation-card-menu-btn");
    this.cancelOption = page.getByTestId("consultation-card-cancel-btn");
    this.hideOption = page.getByTestId("consultation-card-hide-btn");
    this.payButton = page.getByTestId("consultation-card-action-btn").filter({ hasText: /Lanjut Pembayaran/ });
    this.settingsButton = page.getByTestId("dashboard-settings-btn");
    this.loadErrorMessage = page.getByTestId("dashboard-load-error");
    this.bottomNav = page.getByTestId("bottom-nav");
  }

  greeting(name) {
    return this.page.getByTestId("dashboard-greeting").filter({ hasText: name });
  }

  service(name) {
    return this.page.getByTestId("featured-service-card").filter({ hasText: name });
  }

  statusLabel(label) {
    return this.page.getByTestId("consultation-card-status").filter({ hasText: new RegExp(`^${label}$`) });
  }

  bottomNavLink(name) {
    return this.bottomNav.getByTestId("bottom-nav-link").filter({ hasText: new RegExp(name) });
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
