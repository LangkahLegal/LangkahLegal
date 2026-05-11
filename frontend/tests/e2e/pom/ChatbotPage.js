/**
 * Page Object Model — AI Chatbot Page
 * Encapsulates /ai interactions
 */
import { AI_CHAT } from '../utils/selectors.js';

export class ChatbotPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.container = page.locator(AI_CHAT.PAGE);
    this.messagesArea = page.locator(AI_CHAT.MESSAGES);
    this.chatInput = page.locator(AI_CHAT.INPUT);
    this.aiMessages = page.locator(AI_CHAT.AI_MESSAGE);
    this.userMessages = page.locator(AI_CHAT.USER_MESSAGE);
  }

  async goto() {
    await this.page.goto('/ai');
    await this.page.waitForLoadState('networkidle');
  }

  async isLoaded() {
    return this.container.isVisible();
  }

  /** Type a message into the chat input */
  async typeMessage(text) {
    await this.chatInput.fill(text);
  }

  /** Send the current message by pressing Enter */
  async sendMessage() {
    await this.chatInput.press('Enter');
  }

  /** Type and send a message in one step */
  async sendChat(text) {
    await this.typeMessage(text);
    await this.sendMessage();
  }

  /** Wait for AI to respond (loading indicator disappears) */
  async waitForAIResponse(timeout = 60_000) {
    // Wait for the loading/typing indicator to appear then disappear
    try {
      await this.page.locator('.animate-pulse, .animate-spin').first().waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      // The indicator might have already appeared and gone
    }
    // Then wait for it to disappear (AI finished responding)
    await this.page.locator('.animate-pulse >> visible=true').waitFor({ state: 'hidden', timeout });
  }

  /** Get the count of AI message bubbles */
  async getAIMessageCount() {
    return this.aiMessages.count();
  }

  /** Get the count of user message bubbles */
  async getUserMessageCount() {
    return this.userMessages.count();
  }

  /** Get the text of the last AI message */
  async getLastAIMessageText() {
    const messages = await this.aiMessages.all();
    if (messages.length === 0) return null;
    const last = messages[messages.length - 1];
    return last.textContent();
  }

  /** Get the text of the last user message */
  async getLastUserMessageText() {
    const messages = await this.userMessages.all();
    if (messages.length === 0) return null;
    const last = messages[messages.length - 1];
    return last.textContent();
  }

  /** Check if the welcome message is visible */
  async isWelcomeMessageVisible() {
    const welcome = this.page.getByText(/Halo! Saya Kia/i);
    return welcome.isVisible();
  }

  /** Check if pasal references are shown in the last AI message */
  async hasPasalReferences() {
    const refs = this.page.getByText(/Referensi Pasal/i);
    return refs.isVisible();
  }

  /** Check if consultant recommendations are shown */
  async hasConsultantRecommendations() {
    const recs = this.page.getByText(/Rekomendasi Konsultan/i);
    return recs.isVisible();
  }

  /** Check if disclaimer is shown */
  async hasDisclaimer() {
    const disclaimer = this.page.getByText(/bukan nasihat hukum resmi/i);
    return disclaimer.isVisible();
  }

  /** Check if suggested actions / quick replies are visible */
  async getSuggestedActions() {
    const actions = this.page.locator('button:near([data-testid="ai-chat-input"])');
    return actions.count();
  }
}
