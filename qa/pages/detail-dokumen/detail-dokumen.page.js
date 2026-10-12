import { BasePage } from "../base.page.js";

export class DetailDokumenPage extends BasePage {
  path = "/knowledge/detail";

  constructor(page) {
    super(page);
    this.articleListTitle = page.getByText("Daftar Pasal");
    this.openAllButton = page.getByRole("button", { name: /Buka Semua/ });
    this.editButtons = page.getByRole("button", { name: /Edit Pasal/ });
    this.editor = page.locator("textarea");
    this.saveButton = page.getByRole("button", { name: "Simpan", exact: true });
    this.noDataState = page.getByText("Tidak Ada Data");
  }

  async openFor(frbrUri) {
    await this.page.goto(`${this.path}?uri=${encodeURIComponent(frbrUri)}`);
  }

  /** Daftar pasal memakai transisi 300 ms; tunggu selesai agar tombol simpan tidak bergeser saat diklik. */
  async editFirstArticle(text) {
    await this.openAllButton.click();
    await this.editButtons.first().click();
    await this.editor.fill(text);
    await this.page.waitForTimeout(400);
    await this.saveButton.click();
  }
}
