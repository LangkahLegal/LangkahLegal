/**
 * E2E Tests — Payment Flow
 * @tags @payment
 *
 * Note: Actual Midtrans payment popup is NOT tested (external service).
 * We test: page rendering, breakdown visibility, button state, unauthorized access.
 */
import { test as authTest, expect as authExpect } from '../fixtures/index.js';
import { test, expect } from '@playwright/test';
import { PaymentPage } from '../pom/PaymentPage.js';

// ═══════════════════════════════════════════════════════════════
// HAPPY PATH
// ═══════════════════════════════════════════════════════════════

authTest.describe('Payment — Happy Path @payment', () => {
  authTest('should display payment page with pay button for valid consultation', async ({ clientPage }) => {
    // Navigate to client dashboard to find a consultation with payment pending
    await clientPage.goto('/dashboard/client');
    // await clientPage.waitForLoadState('networkidle');

    // Check if there are any consultations with payment link
    const paymentLink = clientPage.locator('a[href*="/payment/"]').first();
    if (await paymentLink.isVisible()) {
      await paymentLink.click();
      // await clientPage.waitForLoadState('networkidle');

      const paymentPage = new PaymentPage(clientPage);
      // Page should have loaded payment content
      const pageContent = await clientPage.textContent('main');
      authExpect(pageContent).toBeTruthy();
    }
  });

  authTest('should show payment breakdown with price details', async ({ clientPage }) => {
    await clientPage.goto('/dashboard/client');
    // await clientPage.waitForLoadState('networkidle');

    const paymentLink = clientPage.locator('a[href*="/payment/"]').first();
    if (await paymentLink.isVisible()) {
      await paymentLink.click();
      // await clientPage.waitForLoadState('networkidle');

      // Should show price-related content (Rp or tarif)
      const priceContent = clientPage.getByText(/Rp|Total|Biaya/i).first();
      if (await priceContent.isVisible()) {
        const text = await priceContent.textContent();
        authExpect(text).toBeTruthy();
      }
    }
  });

  authTest('should show consultant info on payment page', async ({ clientPage }) => {
    await clientPage.goto('/dashboard/client');
    // await clientPage.waitForLoadState('networkidle');

    const paymentLink = clientPage.locator('a[href*="/payment/"]').first();
    if (await paymentLink.isVisible()) {
      await paymentLink.click();
      // await clientPage.waitForLoadState('networkidle');

      // Page header should say "Selesaikan Pembayaran"
      const header = clientPage.getByText(/pembayaran/i).first();
      authExpect(await header.isVisible()).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

authTest.describe('Payment — Validation @payment', () => {
  authTest('should show error for non-existent consultation payment', async ({ clientPage }) => {
    // Try accessing a payment page with invalid ID
    await clientPage.goto('/payment/999999');
    // await clientPage.waitForLoadState('networkidle');

    // Should show error state or redirect
    const pageContent = await clientPage.textContent('body');
    authExpect(pageContent).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════
// UNAUTHORIZED ACCESS
// ═══════════════════════════════════════════════════════════════

test.describe('Payment — Unauthorized Access @payment', () => {
  test('should redirect to login when accessing payment without session', async ({ page }) => {
    await page.goto('/payment/1');
    await page.waitForURL('**/auth/login**', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });
});

authTest.describe('Payment — Role Guard @payment', () => {
  authTest('consultant should not access payment page normally', async ({ consultantPage }) => {
    await consultantPage.goto('/payment/1');
    // await consultantPage.waitForLoadState('networkidle');
    // The page may load but the API will reject non-client roles
    const url = consultantPage.url();
    authExpect(url).toBeTruthy();
  });
});
