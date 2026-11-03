import { BasePage } from "../base.page.js";

export class TanyaAiPage extends BasePage {
  path = "/ai";

  constructor(page) {
    super(page);
    this.title = page.getByRole("heading", { name: "Kia" });
    this.onlineStatus = page.getByText("Online");
    this.input = page.getByTestId("ai-chat-input");
    this.sendButton = page.getByRole("button", { name: "send" });
    this.aiMessages = page.getByTestId("ai-message");
    this.userMessages = page.getByTestId("user-message");
    this.typingIndicator = page.getByText("Kia sedang membaca kronologi Anda...");
    this.loginRequiredMessage = page.getByText(/Silakan login terlebih dahulu/);
    this.historyToggle = page.getByRole("button", { name: "Toggle riwayat chat" });
    this.newConsultationButton = page.getByRole("button", { name: /Konsultasi Baru/ });
    this.scheduleButton = page.getByRole("button", { name: "Jadwalkan" });
    this.consultationDraft = page.getByTestId("ai-consultation-draft");
    this.sources = page.getByTestId("ai-source-item");
    this.sourceModal = page.getByTestId("ai-source-modal");
    this.officialTextTab = page.getByRole("button", { name: "Naskah resmi" });
    this.openPdfLink = page.getByRole("link", { name: /Buka PDF/ });
    this.bpkLink = page.getByRole("link", { name: /Lihat di JDIH BPK/ });
    this.preferenceForm = page.getByTestId("ai-preference-form");
    this.budgetMin = page.getByTestId("preferensi-budget-min");
    this.budgetMax = page.getByTestId("preferensi-budget-max");
    this.searchConsultantButton = page.getByRole("button", { name: "Cari konsultan" });
    this.skipPreferenceButton = page.getByRole("button", { name: /Lewati, tampilkan semua/ });
    this.consultantSlots = page.getByTestId("ai-consultant-slot");
    this.consultantSchedule = page.getByTestId("ai-consultant-schedule");
  }

  get lastAiMessage() {
    return this.aiMessages.last();
  }

  async ask(question) {
    await this.input.fill(question);
    await this.input.press("Enter");
  }

  preferenceChip(label) {
    return this.preferenceForm.getByRole("button", { name: label, exact: true });
  }

  async fillPreference({ budgetMin, budgetMax, hari, waktu }) {
    await this.budgetMin.fill(budgetMin);
    await this.budgetMax.fill(budgetMax);
    if (hari) await this.preferenceChip(hari).click();
    if (waktu) await this.preferenceChip(waktu).click();
  }

  quickReply(label) {
    return this.page.getByRole("button", { name: label });
  }

  savedSession(title) {
    return this.page.locator("div.group", { hasText: title });
  }

  /** Menghapus sesi butuh dua kali klik: tombol hapus, lalu konfirmasinya. */
  async startDeleting(title) {
    const row = this.savedSession(title);
    await row.hover();
    await row.getByRole("button").click();
  }

  async confirmDeleting(title) {
    await this.savedSession(title).getByRole("button", { name: "delete_forever" }).click();
  }
}
