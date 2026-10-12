import { BasePage } from "../base.page.js";

export class DashboardAdminPage extends BasePage {
  path = "/dashboard/admin";

  constructor(page) {
    super(page);
    this.container = page.getByTestId("admin-dashboard");
    this.allDoneState = page.getByText("Selesai!");
    this.detailButton = page.getByRole("button", { name: /Lihat Detail|chevron_right/ }).first();
  }

  /** Kartu statistik berisi label dan angkanya dalam satu blok. */
  statCard(label) {
    return this.page.locator("div", { has: this.page.getByText(label, { exact: true }) }).last();
  }
}
