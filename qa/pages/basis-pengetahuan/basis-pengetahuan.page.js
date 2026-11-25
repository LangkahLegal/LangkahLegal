import { BasePage } from "../base.page.js";

export class BasisPengetahuanPage extends BasePage {
  path = "/knowledge";

  constructor(page) {
    super(page);
    this.rows = page.getByTestId("knowledge-row");
    this.searchInput = page.getByTestId("knowledge-search-input");
    this.nextPageButton = page.getByTestId("pagination-next-btn");
    this.pageInput = page.getByTestId("pagination-page-input");
    this.addButton = page.getByTestId("knowledge-add-btn");
    this.processingBanner = page.getByTestId("knowledge-processing-banner");

    this.nameInput = page.getByTestId("knowledge-name-input");
    this.numberInput = page.getByTestId("knowledge-number-input");
    this.yearInput = page.getByTestId("knowledge-year-input");
    this.categoryDropdown = page.getByTestId("knowledge-category-dropdown");
    this.legalStatusDropdown = page.getByTestId("knowledge-legal-status-dropdown");
    this.fileInput = page.getByTestId("knowledge-file-input");
    this.uploadButton = page.getByTestId("knowledge-upload-btn");
    this.replaceTitle = page.getByTestId("knowledge-replace-modal");
    this.replaceButton = page.getByTestId("knowledge-replace-btn");

    this.deleteConfirmTitle = page.getByTestId("knowledge-delete-modal");
    this.confirmDeleteButton = page.getByTestId("knowledge-delete-confirm-btn");
  }

  row(text) {
    return this.rows.filter({ hasText: text });
  }

  deleteButton(text) {
    return this.row(text).getByTestId("knowledge-row-delete-btn");
  }

  replaceButtonFor(text) {
    return this.row(text).getByTestId("knowledge-row-replace-btn");
  }

  categoryFilter(label) {
    return this.page.getByTestId("knowledge-category-btn").filter({ hasText: new RegExp(`^${label}$`) });
  }

  option(dropdownTestId, label) {
    return this.page.getByTestId(`${dropdownTestId}-option`).filter({ hasText: new RegExp(`^${label}$`) });
  }

  async search(keyword) {
    await this.searchInput.pressSequentially(keyword, { delay: 60 });
  }

  async fillUploadForm({ name, number, year, category, legalStatus, file }) {
    await this.nameInput.fill(name);
    await this.numberInput.fill(number);
    await this.yearInput.fill(year);
    await this.categoryDropdown.click();
    await this.option("knowledge-category-dropdown", category).click();
    await this.legalStatusDropdown.click();
    await this.option("knowledge-legal-status-dropdown", legalStatus).click();
    await this.fileInput.setInputFiles(file);
  }

  async goToPage(number) {
    await this.pageInput.fill(String(number));
    await this.pageInput.press("Enter");
  }
}
