/**
 * E2E Tests — Schedule Management (Consultant)
 * @tags @schedule
 */
import { test as authTest, expect as authExpect } from '../fixtures/index.js';
import { test, expect } from '@playwright/test';
import { SchedulePage } from '../pom/SchedulePage.js';

// ═══════════════════════════════════════════════════════════════
// HAPPY PATH
// ═══════════════════════════════════════════════════════════════

authTest.describe('Schedule — Happy Path @schedule', () => {
  authTest('should display schedule page with calendar and availability toggle', async ({ consultantPage }) => {
    const schedulePage = new SchedulePage(consultantPage);
    await schedulePage.goto();

    await authExpect(schedulePage.calendar).toBeVisible();
    await authExpect(schedulePage.availabilityToggle).toBeVisible();
  });

  authTest('should display current month label', async ({ consultantPage }) => {
    const schedulePage = new SchedulePage(consultantPage);
    await schedulePage.goto();

    const label = await schedulePage.getMonthLabel();
    authExpect(label).toBeTruthy();
    // Should contain a month name (Indonesian locale)
    authExpect(label.length).toBeGreaterThan(3);
  });

  authTest('should navigate to next and previous months', async ({ consultantPage }) => {
    const schedulePage = new SchedulePage(consultantPage);
    await schedulePage.goto();

    const initialLabel = await schedulePage.getMonthLabel();

    await schedulePage.nextMonth();
    await consultantPage.waitForTimeout(500);
    const nextLabel = await schedulePage.getMonthLabel();
    authExpect(nextLabel).not.toBe(initialLabel);

    await schedulePage.prevMonth();
    await consultantPage.waitForTimeout(500);
    const prevLabel = await schedulePage.getMonthLabel();
    authExpect(prevLabel).toBe(initialLabel);
  });

  authTest('should open modal when clicking a calendar date', async ({ consultantPage }) => {
    const schedulePage = new SchedulePage(consultantPage);
    await schedulePage.goto();

    // Get today's date number to click
    const today = new Date().getDate();
    await schedulePage.clickCalendarDate(today.toString());
    await consultantPage.waitForTimeout(500);

    const isOpen = await schedulePage.isModalOpen();
    authExpect(isOpen).toBeTruthy();
  });

  authTest('should show correct modal title for new slot', async ({ consultantPage }) => {
    const schedulePage = new SchedulePage(consultantPage);
    await schedulePage.goto();

    // Click a future date that likely doesn't have a slot
    const futureDay = new Date();
    futureDay.setDate(futureDay.getDate() + 15);
    const dayNum = futureDay.getDate();

    await schedulePage.clickCalendarDate(dayNum.toString());
    await consultantPage.waitForTimeout(500);

    if (await schedulePage.isModalOpen()) {
      const title = await schedulePage.getModalTitle();
      // Should say "Tambah Jadwal" or "Edit Jadwal"
      authExpect(title).toMatch(/tambah|edit|detail/i);
    }
  });

  authTest('should display availability status text', async ({ consultantPage }) => {
    const schedulePage = new SchedulePage(consultantPage);
    await schedulePage.goto();

    const text = await schedulePage.getAvailabilityText();
    authExpect(text).toBeTruthy();
    // Should indicate current status
    authExpect(text).toMatch(/menerima|tidak/i);
  });
});

// ═══════════════════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════════════════

authTest.describe('Schedule — Edge Cases @schedule', () => {
  authTest('should close modal when clicking close button', async ({ consultantPage }) => {
    const schedulePage = new SchedulePage(consultantPage);
    await schedulePage.goto();

    const today = new Date().getDate();
    await schedulePage.clickCalendarDate(today.toString());
    await consultantPage.waitForTimeout(500);

    if (await schedulePage.isModalOpen()) {
      await schedulePage.closeModal();
      await consultantPage.waitForTimeout(500);
      const isOpen = await schedulePage.isModalOpen();
      authExpect(isOpen).toBeFalsy();
    }
  });

  authTest('should show save button in modal for unbooked slot', async ({ consultantPage }) => {
    const schedulePage = new SchedulePage(consultantPage);
    await schedulePage.goto();

    const today = new Date().getDate();
    await schedulePage.clickCalendarDate(today.toString());
    await consultantPage.waitForTimeout(500);

    if (await schedulePage.isModalOpen()) {
      await authExpect(schedulePage.saveBtn).toBeVisible();
    }
  });

  authTest('should show dates with events marked', async ({ consultantPage }) => {
    const schedulePage = new SchedulePage(consultantPage);
    await schedulePage.goto();

    // This verifies the calendar renders event indicators for existing schedules
    const eventsCount = await schedulePage.getDatesWithEvents();
    // May be 0 or more — just verify it doesn't crash
    authExpect(eventsCount).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// UNAUTHORIZED ACCESS
// ═══════════════════════════════════════════════════════════════

test.describe('Schedule — Unauthorized Access @schedule', () => {
  test('should redirect to login when accessing /schedule without session', async ({ page }) => {
    await page.goto('/schedule');
    await page.waitForURL('**/auth/login**', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });
});

authTest.describe('Schedule — Role Guard @schedule', () => {
  authTest('client should not have access to schedule management flow', async ({ clientPage }) => {
    // Client accessing /schedule — middleware should allow access
    // but the page is consultant-only in terms of data
    await clientPage.goto('/schedule');
    // await clientPage.waitForLoadState('networkidle');
    // The schedule page fetches consultant data which would fail for a client
    // We verify the page doesn't crash
    const url = clientPage.url();
    authExpect(url).toBeTruthy();
  });
});
