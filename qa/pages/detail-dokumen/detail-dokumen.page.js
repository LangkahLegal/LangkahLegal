import { BasePage } from "../base.page.js";

export class DetailDokumenPage extends BasePage {
  path = "/knowledge/detail";

  constructor(page) {
    super(page);
    this.articleListTitle = page.getByTestId("knowledge-article-list-title");
    this.openAllButton = page.getByTestId("knowledge-toggle-all-btn");
    this.editButtons = page.getByTestId("knowledge-article-edit-btn");
    this.editor = page.getByTestId("knowledge-article-input");
    this.saveButton = page.getByTestId("knowledge-article-save-btn");
    this.noDataState = page.getByTestId("knowledge-detail-empty");
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
