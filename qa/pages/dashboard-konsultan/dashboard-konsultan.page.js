import { BasePage } from "../base.page.js";

export class DashboardKonsultanPage extends BasePage {
  path = "/dashboard/consultant";

  constructor(page) {
    super(page);
    this.activeConsultationsLabel = page.getByText("Konsultasi Aktif");
    this.nextSessionSection = this.section("Jadwal Terdekat");
    this.newRequestsSection = this.section("Permintaan Baru");
    this.rejectionNotice = page.getByText("Pengajuan Verifikasi Ditolak");
    this.profileSettingsLink = page.getByText("Pengaturan Profil");
  }

  section(title) {
    return this.page.locator("section", { has: this.page.getByRole("heading", { name: title }) });
  }

  greeting(name) {
    return this.page.getByRole("heading", { name });
  }

  cardsIn(section) {
    return section.locator("div.group", { has: this.page.locator("h3") });
  }

  detailButtonIn(section) {
    return section.getByRole("button", { name: /Lihat Detail/ });
  }
}
