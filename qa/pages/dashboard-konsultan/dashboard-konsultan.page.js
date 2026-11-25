import { BasePage } from "../base.page.js";

const SECTION = {
  "Jadwal Terdekat": "consultant-dashboard-next-session-section",
  "Permintaan Baru": "consultant-dashboard-new-requests-section",
};

export class DashboardKonsultanPage extends BasePage {
  path = "/dashboard/consultant";

  constructor(page) {
    super(page);
    this.activeConsultationsLabel = page.getByTestId("stat-card-label").filter({ hasText: "Konsultasi Aktif" });
    this.nextSessionSection = this.section("Jadwal Terdekat");
    this.newRequestsSection = this.section("Permintaan Baru");
    this.rejectionNotice = page.getByTestId("consultant-dashboard-rejection-message");
    this.profileSettingsLink = page.getByTestId("consultant-dashboard-profile-link");
  }

  section(title) {
    return this.page.getByTestId(SECTION[title]);
  }

  greeting(name) {
    return this.page.getByTestId("dashboard-greeting").filter({ hasText: name });
  }

  cardsIn(section) {
    return section.getByTestId("consultation-card");
  }

  detailButtonIn(section) {
    return section.getByTestId("consultation-card-action-btn");
  }
}
