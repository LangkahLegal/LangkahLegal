import { BasePage } from "../base.page.js";

const exactText = (text) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);

export class TanyaAiPage extends BasePage {
  path = "/ai";

  constructor(page) {
    super(page);
    this.title = page.getByTestId("ai-chat-title");
    this.onlineStatus = page.getByTestId("ai-chat-status").filter({ hasText: "Online" });
    this.input = page.getByTestId("ai-chat-input");
    this.sendButton = page.getByTestId("ai-chat-send-btn");
    this.aiMessages = page.getByTestId("ai-message");
    this.userMessages = page.getByTestId("user-message");
    this.typingIndicator = page.getByTestId("ai-typing-indicator");
    this.loginRequiredMessage = this.aiMessages.filter({ hasText: /Silakan login terlebih dahulu/ });
    this.historyToggle = page.getByTestId("ai-history-toggle-btn");
    this.newConsultationButton = page.getByTestId("ai-new-chat-btn");
    this.scheduleButton = page.getByTestId("ai-consultant-schedule-btn");
    this.consultationDraft = page.getByTestId("ai-consultation-draft");
    this.sources = page.getByTestId("ai-source-item");
    this.sourceModal = page.getByTestId("ai-source-modal");
    this.officialTextTab = page.getByTestId("ai-source-tab-naskah");
    this.openPdfLink = page.getByTestId("ai-source-pdf-link");
    this.bpkLink = page.getByTestId("ai-source-bpk-link");
    this.preferenceForm = page.getByTestId("ai-preference-form");
    this.budgetMin = page.getByTestId("preferensi-budget-min");
    this.budgetMax = page.getByTestId("preferensi-budget-max");
    this.searchConsultantButton = page.getByTestId("ai-preference-submit-btn");
    this.skipPreferenceButton = page.getByTestId("ai-preference-skip-btn");
    this.consultantSlots = page.getByTestId("ai-consultant-slot");
    this.consultantSchedule = page.getByTestId("ai-consultant-schedule");
  }

  get lastAiMessage() {
    return this.aiMessages.last();
  }

  get lastAiMessageContent() {
    return this.lastAiMessage.getByTestId("ai-message-content");
  }

  async ask(question) {
    await this.input.fill(question);
    await this.input.press("Enter");
  }

  preferenceChip(label) {
    return this.preferenceForm.getByTestId("ai-preference-chip").filter({ hasText: exactText(label) });
  }

  async fillPreference({ budgetMin, budgetMax, hari, waktu }) {
    await this.budgetMin.fill(budgetMin);
    await this.budgetMax.fill(budgetMax);
    if (hari) await this.preferenceChip(hari).click();
    if (waktu) await this.preferenceChip(waktu).click();
  }


  savedSession(title) {
    return this.page.getByTestId("ai-session-item").filter({ hasText: title });
  }

  /** Menghapus sesi butuh dua kali klik: tombol hapus, lalu konfirmasinya. */
  async startDeleting(title) {
    const row = this.savedSession(title);
    await row.hover();
    await row.getByTestId("ai-session-delete-btn").click();
  }

  async confirmDeleting(title) {
    await this.savedSession(title).getByTestId("ai-session-delete-confirm-btn").click();
  }
}
