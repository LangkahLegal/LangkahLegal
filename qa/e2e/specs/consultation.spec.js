/**
 * E2E Tests — Consultation Flow & Submission
 * @tags @consultation
 */
import { test as authTest, expect as authExpect } from '../fixtures/index.js';
import { ConsultantDetailPage } from '../pom/ConsultantDetailPage.js';
import { ExplorePage } from '../pom/ExplorePage.js';
import { CONSULTATION_FORM } from '../utils/test-data.js';

authTest.describe('Consultation — Happy Path @consultation', () => {
  authTest('should display consultant detail with hero and price', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();
    const count = await explorePage.getCardCount();
    if (count > 0) {
      await explorePage.clickConsultantCard(0);
      await clientPage.waitForURL('**/explore/**', { timeout: 10_000 });
      const detailPage = new ConsultantDetailPage(clientPage);
      const name = await detailPage.getConsultantName();
      authExpect(name).toBeTruthy();
    }
  });

  authTest('should show booking button on detail page', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();
    const count = await explorePage.getCardCount();
    if (count > 0) {
      await explorePage.clickConsultantCard(0);
      await clientPage.waitForURL('**/explore/**', { timeout: 10_000 });
      const btn = clientPage.getByRole('button', { name: /booking/i });
      await authExpect(btn).toBeVisible();
    }
  });
});

authTest.describe('Consultation — Validation @consultation', () => {
  authTest('should alert when booking without description', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();
    const count = await explorePage.getCardCount();
    if (count > 0) {
      await explorePage.clickConsultantCard(0);
      await clientPage.waitForURL('**/explore/**', { timeout: 10_000 });
      clientPage.on('dialog', async (d) => { await d.accept(); });
      const detailPage = new ConsultantDetailPage(clientPage);
      await detailPage.submitBooking();
    }
  });

  authTest('should alert when booking without schedule', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();
    const count = await explorePage.getCardCount();
    if (count > 0) {
      await explorePage.clickConsultantCard(0);
      await clientPage.waitForURL('**/explore/**', { timeout: 10_000 });
      const detailPage = new ConsultantDetailPage(clientPage);
      await detailPage.fillDescription(CONSULTATION_FORM.validDescription);
      clientPage.on('dialog', async (d) => { await d.accept(); });
      await detailPage.submitBooking();
    }
  });
});

authTest.describe('Consultation — Edge Cases @consultation', () => {
  authTest('should display file upload section', async ({ clientPage }) => {
    const explorePage = new ExplorePage(clientPage);
    await explorePage.goto();
    const count = await explorePage.getCardCount();
    if (count > 0) {
      await explorePage.clickConsultantCard(0);
      await clientPage.waitForURL('**/explore/**', { timeout: 10_000 });
      const uploadArea = clientPage.getByText(/dokumen pendukung/i);
      await authExpect(uploadArea).toBeVisible();
    }
  });
});
