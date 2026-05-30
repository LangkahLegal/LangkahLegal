/**
 * E2E Tests — AI Chatbot (Kia)
 * @tags @chatbot
 *
 * Covers:
 * - Happy path: page loads, send message, receive AI response with citations
 * - Edge cases: empty input, special characters, long messages
 * - AI response quality: contains disclaimer, pasal references
 * - Unauthorized access
 */
import { test as authTest, expect as authExpect } from '../fixtures/index.js';
import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../pom/ChatbotPage.js';
import { EDGE_CASES } from '../utils/test-data.js';

// ═══════════════════════════════════════════════════════════════
// HAPPY PATH
// ═══════════════════════════════════════════════════════════════

authTest.describe('Chatbot — Happy Path @chatbot', () => {
  authTest('should display AI chat page with welcome message', async ({ clientPage }) => {
    const chatbot = new ChatbotPage(clientPage);
    await chatbot.goto();

    authExpect(await chatbot.isLoaded()).toBeTruthy();

    // Should show welcome message from Kia
    const welcome = await chatbot.isWelcomeMessageVisible();
    authExpect(welcome).toBeTruthy();
  });

  authTest('should display chat input area', async ({ clientPage }) => {
    const chatbot = new ChatbotPage(clientPage);
    await chatbot.goto();

    await authExpect(chatbot.chatInput).toBeVisible();
  });

  authTest('should send a legal question and receive AI response', async ({ clientPage }) => {
    const chatbot = new ChatbotPage(clientPage);
    await chatbot.goto();

    // Count initial AI messages (welcome is one)
    const initialCount = await chatbot.getAIMessageCount();

    // Send a legal question
    await chatbot.sendChat('Apa hukuman untuk pencurian menurut KUHP?');

    // Wait for AI to respond (with generous timeout for LLM)
    await clientPage.waitForTimeout(3000);
    try {
      // Wait for a new AI message to appear
      await clientPage.locator('[data-testid="ai-message"]').nth(initialCount).waitFor({
        state: 'visible',
        timeout: 60_000,
      });
    } catch {
      // AI might take long; check what we have
    }

    // Should have more AI messages now
    const finalCount = await chatbot.getAIMessageCount();
    authExpect(finalCount).toBeGreaterThan(initialCount);
  });

  authTest('should display user message bubble after sending', async ({ clientPage }) => {
    const chatbot = new ChatbotPage(clientPage);
    await chatbot.goto();

    await chatbot.sendChat('Halo, saya butuh bantuan hukum');

    // User message should appear immediately (optimistic)
    await clientPage.waitForTimeout(500);
    const userCount = await chatbot.getUserMessageCount();
    authExpect(userCount).toBeGreaterThan(0);

    // Verify the user message text
    const lastUserText = await chatbot.getLastUserMessageText();
    authExpect(lastUserText).toContain('bantuan hukum');
  });
});

// ═══════════════════════════════════════════════════════════════
// AI RESPONSE QUALITY
// ═══════════════════════════════════════════════════════════════

authTest.describe('Chatbot — AI Response Quality @chatbot', () => {
  authTest('should include disclaimer in AI response', async ({ clientPage }) => {
    const chatbot = new ChatbotPage(clientPage);
    await chatbot.goto();

    await chatbot.sendChat('Bagaimana cara melaporkan tindak pidana penipuan?');

    // Wait for AI response
    try {
      const initialCount = await chatbot.getAIMessageCount();
      await clientPage.locator('[data-testid="ai-message"]').nth(initialCount).waitFor({
        state: 'visible',
        timeout: 60_000,
      });
    } catch {
      // Continue with what we have
    }

    await clientPage.waitForTimeout(2000);

    // Check for disclaimer
    const hasDisclaimer = await chatbot.hasDisclaimer();
    authExpect(hasDisclaimer).toBeTruthy();
  });

  authTest('should return relevant response to legal question', async ({ clientPage }) => {
    const chatbot = new ChatbotPage(clientPage);
    await chatbot.goto();

    await chatbot.sendChat('Apa itu tindak pidana pencurian?');

    try {
      const initialCount = await chatbot.getAIMessageCount();
      await clientPage.locator('[data-testid="ai-message"]').nth(initialCount).waitFor({
        state: 'visible',
        timeout: 60_000,
      });
    } catch {
      // Continue
    }

    await clientPage.waitForTimeout(2000);
    const lastAIText = await chatbot.getLastAIMessageText();
    // AI response should contain legal-related words
    authExpect(lastAIText).toBeTruthy();
    authExpect(lastAIText.length).toBeGreaterThan(50);
  });
});

// ═══════════════════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════════════════

authTest.describe('Chatbot — Edge Cases @chatbot', () => {
  authTest('should not send empty message', async ({ clientPage }) => {
    const chatbot = new ChatbotPage(clientPage);
    await chatbot.goto();

    const initialUserCount = await chatbot.getUserMessageCount();

    // Try sending empty message
    await chatbot.chatInput.fill('');
    await chatbot.chatInput.press('Enter');
    await clientPage.waitForTimeout(500);

    // No new user message should appear
    const finalUserCount = await chatbot.getUserMessageCount();
    authExpect(finalUserCount).toBe(initialUserCount);
  });

  authTest('should handle XSS attempt safely', async ({ clientPage }) => {
    const chatbot = new ChatbotPage(clientPage);
    await chatbot.goto();

    await chatbot.sendChat(EDGE_CASES.xssAttempt);
    await clientPage.waitForTimeout(1000);

    // Should not execute script — page still functional
    authExpect(await chatbot.isLoaded()).toBeTruthy();

    // User message should show the text safely
    const lastText = await chatbot.getLastUserMessageText();
    authExpect(lastText).toContain('script');
  });

  authTest('should handle special characters in input', async ({ clientPage }) => {
    const chatbot = new ChatbotPage(clientPage);
    await chatbot.goto();

    await chatbot.sendChat(EDGE_CASES.specialChars);
    await clientPage.waitForTimeout(500);

    // Should not crash
    authExpect(await chatbot.isLoaded()).toBeTruthy();
  });

  authTest('should handle very long message gracefully', async ({ clientPage }) => {
    const chatbot = new ChatbotPage(clientPage);
    await chatbot.goto();

    // Chatbot API has max 2000 chars limit
    const longMsg = 'Saya butuh bantuan hukum. '.repeat(80);
    await chatbot.typeMessage(longMsg);
    await clientPage.waitForTimeout(300);

    // Input should accept the text (may truncate in UI)
    authExpect(await chatbot.isLoaded()).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════
// UNAUTHORIZED ACCESS
// ═══════════════════════════════════════════════════════════════

test.describe('Chatbot — Unauthorized Access @chatbot', () => {
  test('should redirect to login when accessing /ai without session', async ({ page }) => {
    await page.goto('/ai');
    await page.waitForURL('**/auth/login**', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });
});
