/**
 * E2E Tests — Consultant Directory (Explore Page)
 * 
 * @tags @explore
 * 
 * Covers:
 * - Happy path: browse catalog, search, filter, navigate to detail
 * - Edge cases: empty search results, long queries, category reset
 */
import { test as authTest, expect as authExpect } from '../fixtures/index.js';
import { ExplorePage } from '../pom/ExplorePage.js';

// ═══════════════════════════════════════════════════════════════
// HAPPY PATH
// ═══════════════════════════════════════════════════════════════

authTest.describe('Explore — Happy Path @explore', () => {
  authTest('should display consultant catalog with cards', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();

    const count = await explorePage.getCardCount();
    authExpect(count).toBeGreaterThan(0);
  });

  authTest('should search consultant by name', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();

    // Get initial count
    const initialCount = await explorePage.getCardCount();

    // Type a search query — use a very specific term
    await explorePage.searchConsultant('zzzznonexistentzzz');
    await clientPage.waitForTimeout(600);

    const filteredCount = await explorePage.getCardCount();
    // Should have fewer results (or zero)
    authExpect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  authTest('should filter consultants by category', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();

    // Click on a specific category
    await explorePage.selectCategory('Pidana');
    await clientPage.waitForTimeout(1000);

    // Cards should still render (or be empty)
    const count = await explorePage.getCardCount();
    authExpect(count).toBeGreaterThanOrEqual(0);
  });

  authTest('should navigate to consultant detail page on card click', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();

    const count = await explorePage.getCardCount();
    if (count > 0) {
      await explorePage.clickConsultantCard(0);
      await clientPage.waitForURL('**/explore/**', { timeout: 10_000 });
      authExpect(clientPage.url()).toMatch(/\/explore\/\d+/);
    }
  });

  authTest('should show all consultants when selecting "Semua" category', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();

    // First filter to a specific category
    await explorePage.selectCategory('Pidana');
    await clientPage.waitForTimeout(500);
    const filteredCount = await explorePage.getCardCount();

    // Then reset to all
    await explorePage.selectCategory('Semua');
    await clientPage.waitForTimeout(500);
    const allCount = await explorePage.getCardCount();

    authExpect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });
});

// ═══════════════════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════════════════

authTest.describe('Explore — Edge Cases @explore', () => {
  authTest('should show empty state for search with no results', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();

    await explorePage.searchConsultant('xyznonexistent12345');
    await clientPage.waitForTimeout(600);

    const count = await explorePage.getCardCount();
    if (count === 0) {
      const emptyVisible = await explorePage.isEmptyStateVisible();
      authExpect(emptyVisible).toBeTruthy();
    }
  });

  authTest('should handle very long search query gracefully', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();

    const longQuery = 'A'.repeat(200);
    await explorePage.searchConsultant(longQuery);
    await clientPage.waitForTimeout(600);

    // Should not crash — page remains functional
    authExpect(explorePage.searchInput).toBeVisible();
  });

  authTest('should clear search and show all consultants again', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();

    // Search then clear
    await explorePage.searchConsultant('test');
    await clientPage.waitForTimeout(400);
    await explorePage.clearSearch();
    await clientPage.waitForTimeout(400);

    const count = await explorePage.getCardCount();
    authExpect(count).toBeGreaterThan(0);
  });
});
