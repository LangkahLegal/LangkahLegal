/**
 * E2E Tests — Admin Dashboard
 * @tags @admin
 *
 * Covers:
 * - Happy path: page loads, stats visible, verification section
 * - Unauthorized access: non-admin roles, unauthenticated users
 */
import { test as authTest, expect as authExpect } from '../fixtures/index.js';
import { test, expect } from '@playwright/test';
import { AdminDashboardPage } from '../pom/AdminDashboardPage.js';

// ═══════════════════════════════════════════════════════════════
// HAPPY PATH
// ═══════════════════════════════════════════════════════════════

authTest.describe('Admin Dashboard — Happy Path @admin', () => {
  authTest('should display admin dashboard with stats cards', async ({ adminPage }) => {
    const adminDash = new AdminDashboardPage(adminPage);
    await adminDash.goto();

    authExpect(await adminDash.isLoaded()).toBeTruthy();

    // Should have stat cards
    const stats = await adminDash.getStatCards();
    authExpect(stats.length).toBeGreaterThan(0);
  });

  authTest('should show overview statistics (users, clients, consultants)', async ({ adminPage }) => {
    const adminDash = new AdminDashboardPage(adminPage);
    await adminDash.goto();

    // Check for key stat labels
    const totalUsers = adminPage.getByText(/Total User/i);
    const totalClients = adminPage.getByText(/Total Client/i);
    const totalConsultants = adminPage.getByText(/Total Konsultan/i);

    await authExpect(totalUsers).toBeVisible();
    await authExpect(totalClients).toBeVisible();
    await authExpect(totalConsultants).toBeVisible();
  });

  authTest('should show pending verification section', async ({ adminPage }) => {
    const adminDash = new AdminDashboardPage(adminPage);
    await adminDash.goto();

    const isVisible = await adminDash.isVerificationSectionVisible();
    authExpect(isVisible).toBeTruthy();
  });

  authTest('should show transaction monitoring section', async ({ adminPage }) => {
    const adminDash = new AdminDashboardPage(adminPage);
    await adminDash.goto();

    const isVisible = await adminDash.isTransactionMonitoringVisible();
    authExpect(isVisible).toBeTruthy();
  });

  authTest('should display pending verification count in stat card', async ({ adminPage }) => {
    const adminDash = new AdminDashboardPage(adminPage);
    await adminDash.goto();

    const pendingText = await adminDash.getPendingVerificationText();
    authExpect(pendingText).toBeTruthy();
    authExpect(pendingText).toContain('Pending');
  });
});

// ═══════════════════════════════════════════════════════════════
// UNAUTHORIZED ACCESS
// ═══════════════════════════════════════════════════════════════

test.describe('Admin Dashboard — Unauthorized Access @admin', () => {
  test('should redirect to login when accessing admin dashboard without session', async ({ page }) => {
    await page.goto('/dashboard/admin');
    await page.waitForURL('**/auth/login**', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });
});

authTest.describe('Admin Dashboard — Role Guard @admin', () => {
  authTest('client should be redirected from admin dashboard', async ({ clientPage }) => {
    await clientPage.goto('/dashboard/admin');
    await clientPage.waitForURL('**/dashboard/client**', { timeout: 15_000 });
    authExpect(clientPage.url()).toContain('/dashboard/client');
  });

  authTest('consultant should be redirected from admin dashboard', async ({ consultantPage }) => {
    await consultantPage.goto('/dashboard/admin');
    await consultantPage.waitForURL('**/dashboard/consultant**', { timeout: 15_000 });
    authExpect(consultantPage.url()).toContain('/dashboard/consultant');
  });
});
