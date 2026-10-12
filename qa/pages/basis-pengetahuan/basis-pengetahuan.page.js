import { BasePage } from "../base.page.js";

export class BasisPengetahuanPage extends BasePage {
  path = "/knowledge";

  constructor(page) {
    super(page);
    this.rows = page.locator("tbody tr");
    this.searchInput = page.getByPlaceholder("Cari nama undang-undang atau dokumen...");
    this.nextPageButton = page.getByTitle("Selanjutnya");
    this.pageInput = page.locator("input.w-10");
    this.addButton = page.getByRole("button", { name: /Tambah Dokumen/ });
    this.processingBanner = page.getByText(/Sistem sedang memproses ekstraksi/);

    this.nameInput = page.getByPlaceholder("Contoh: Undang-Undang Perlindungan Data Pribadi");
    this.numberInput = page.getByPlaceholder("Contoh: 27");
    this.yearInput = page.getByPlaceholder("Contoh: 2022");
    this.categoryDropdown = page.getByText("Pilih Kategori");
    this.legalStatusDropdown = page.getByText("Pilih Status Hukum");
    this.fileInput = page.locator('input[type="file"][accept=".pdf"]');
    this.uploadButton = page.getByRole("button", { name: "Unggah", exact: true });
    this.replaceTitle = page.getByText("Ganti Dokumen");
    this.replaceButton = page.getByRole("button", { name: "Ganti", exact: true });

    this.deleteConfirmTitle = page.getByText("Hapus Dokumen?");
    this.confirmDeleteButton = page.getByRole("button", { name: "Ya, Hapus" });
  }

  row(text) {
    return this.rows.filter({ hasText: text });
  }

  categoryFilter(label) {
    return this.page.getByRole("button", { name: label, exact: true });
  }

  option(label) {
    return this.page.locator(".max-h-60 > div").filter({ hasText: new RegExp(`^${label}$`) });
  }

  async search(keyword) {
    await this.searchInput.pressSequentially(keyword, { delay: 60 });
  }

  async fillUploadForm({ name, number, year, category, legalStatus, file }) {
    await this.nameInput.fill(name);
    await this.numberInput.fill(number);
    await this.yearInput.fill(year);
    await this.categoryDropdown.click();
    await this.option(category).click();
    await this.legalStatusDropdown.click();
    await this.option(legalStatus).click();
    await this.fileInput.setInputFiles(file);
  }

  async goToPage(number) {
    await this.pageInput.fill(String(number));
    await this.pageInput.press("Enter");
  }
}
