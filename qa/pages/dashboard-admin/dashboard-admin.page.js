import { BasePage } from "../base.page.js";

export class DashboardAdminPage extends BasePage {
  path = "/dashboard/admin";

  constructor(page) {
    super(page);
    this.container = page.getByTestId("admin-dashboard");
    this.allDoneState = page.getByTestId("admin-dashboard-verification-empty");
    this.detailButton = page.getByTestId("verification-card-detail-btn").first();
  }

  /** Kartu statistik berisi label dan angkanya dalam satu blok. */
  statCard(label) {
    return this.page.getByTestId("stat-card").filter({ hasText: label });
  }
}
