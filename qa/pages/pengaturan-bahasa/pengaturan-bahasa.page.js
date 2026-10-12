import { BasePage } from "../base.page.js";

export class PengaturanBahasaPage extends BasePage {
  path = "/setting/language";

  constructor(page) {
    super(page);
    this.englishOption = page.getByRole("button", { name: /English/ });
    this.saveButton = page.getByRole("button", { name: "Simpan Pengaturan" });
  }
}
