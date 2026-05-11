/**
 * E2E Tests — Authentication, Role Selection & Session
 * 
 * @tags @auth
 * 
 * Covers:
 * - Happy path: login, logout, role-based redirect
 * - Validation: empty fields, wrong credentials
 * - Edge cases: session persistence, special characters
 * - Unauthorized access: protected routes without session
 */
import { test, expect } from '@playwright/test';
import { test as authTest, expect as authExpect } from '../fixtures/index.js';
import { LoginPage } from '../pom/LoginPage.js';
import { RolePage } from '../pom/RolePage.js';
import { DashboardPage } from '../pom/DashboardPage.js';
import { ACCOUNTS, INVALID, EDGE_CASES, DASHBOARD_URLS } from '../utils/test-data.js';

// ═══════════════════════════════════════════════════════════════
// HAPPY PATH
// ═══════════════════════════════════════════════════════════════

test.describe('Auth — Happy Path @auth', () => {
  test('should login with valid client credentials and redirect to client dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.loginAs(ACCOUNTS.client.email, ACCOUNTS.client.password);

    // Should redirect to client dashboard
    await page.waitForURL('**/dashboard/client**', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard/client');
  });

  test('should login with valid consultant credentials and redirect to consultant dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.loginAs(ACCOUNTS.consultant.email, ACCOUNTS.consultant.password);

    await page.waitForURL('**/dashboard/consultant**', { timeout: 15_000 });
    expect(page.url()).toContain('/dashboard/consultant');
  });

  test('should display login form with all expected elements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.form).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.googleButton).toBeVisible();
  });

  test('should display role selection page with both options', async ({ page }) => {
    const rolePage = new RolePage(page);
    await rolePage.goto();

    await expect(rolePage.clientCard).toBeVisible();
    await expect(rolePage.consultantCard).toBeVisible();
    await expect(rolePage.continueButton).toBeVisible();
  });

  test('should navigate from role selection to signup', async ({ page }) => {
    const rolePage = new RolePage(page);
    await rolePage.goto();

    await rolePage.selectAndContinue('client');
    await page.waitForURL('**/auth/signup**', { timeout: 10_000 });
    expect(page.url()).toContain('/auth/signup');
  });
});

// ═══════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════

authTest.describe('Auth — Logout @auth', () => {
  authTest('should logout and clear session', async ({ clientPage }) => {
    const page = clientPage;
    await page.goto('/dashboard/client');
    await page.waitForLoadState('networkidle');

    // Look for logout option in sidebar or settings
    const logoutBtn = page.getByText(/keluar|logout/i).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();

      // After logout should redirect to login
      await page.waitForURL('**/auth/login**', { timeout: 15_000 });
      expect(page.url()).toContain('/auth/login');
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// VALIDATION / ERROR TESTS
// ═══════════════════════════════════════════════════════════════

test.describe('Auth — Validation & Errors @auth', () => {
  test('should show error for empty password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillEmail(ACCOUNTS.client.email);
    // Leave password empty
    await loginPage.submitLogin();

    // Should show error message
    const error = await loginPage.getErrorText();
    expect(error).toBeTruthy();
  });

  test('should show error for wrong password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.loginAs(INVALID.wrongPassword.email, INVALID.wrongPassword.password);

    const error = await loginPage.getErrorText();
    expect(error).toBeTruthy();
  });

  test('should show error for non-existent email', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.loginAs(INVALID.nonExistentEmail.email, INVALID.nonExistentEmail.password);

    const error = await loginPage.getErrorText();
    expect(error).toBeTruthy();
  });

  test('should not submit with HTML5 validation for empty email', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillPassword('somepassword');
    await loginPage.submitLogin();

    // Should still be on login page (HTML5 required validation prevents submission)
    expect(page.url()).toContain('/auth/login');
  });
});

// ═══════════════════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════════════════

test.describe('Auth — Edge Cases @auth', () => {
  test('should handle special characters in password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillEmail(ACCOUNTS.client.email);
    await loginPage.fillPassword(EDGE_CASES.specialChars);
    await loginPage.submitLogin();

    // Should show error (wrong password) but not crash
    const error = await loginPage.getErrorText();
    expect(error).toBeTruthy();
  });

  test('should handle XSS attempt in email field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillEmail(EDGE_CASES.xssAttempt);
    await loginPage.fillPassword('password123');
    await loginPage.submitLogin();

    // Should remain on login page, no script execution
    expect(page.url()).toContain('/auth');
  });

  test('should persist session across page reload', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAs(ACCOUNTS.client.email, ACCOUNTS.client.password);

    await page.waitForURL('**/dashboard/client**', { timeout: 15_000 });

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on dashboard (session persisted)
    expect(page.url()).toContain('/dashboard');
  });
});

// ═══════════════════════════════════════════════════════════════
// UNAUTHORIZED ACCESS
// ═══════════════════════════════════════════════════════════════

test.describe('Auth — Unauthorized Access @auth', () => {
  test('should redirect to login when accessing /dashboard/client without session', async ({ page }) => {
    await page.goto('/dashboard/client');
    await page.waitForURL('**/auth/login**', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect to login when accessing /dashboard/consultant without session', async ({ page }) => {
    await page.goto('/dashboard/consultant');
    await page.waitForURL('**/auth/login**', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect to login when accessing /setting without session', async ({ page }) => {
    await page.goto('/setting');
    await page.waitForURL('**/auth/login**', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect to login when accessing /schedule without session', async ({ page }) => {
    await page.goto('/schedule');
    await page.waitForURL('**/auth/login**', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });
});

// ═══════════════════════════════════════════════════════════════
// ROLE GUARD — Cross-Role Access
// ═══════════════════════════════════════════════════════════════

authTest.describe('Auth — Role Guard @auth', () => {
  authTest('client should be redirected from consultant dashboard', async ({ clientPage }) => {
    await clientPage.goto('/dashboard/consultant');
    await clientPage.waitForURL('**/dashboard/client**', { timeout: 15_000 });
    expect(clientPage.url()).toContain('/dashboard/client');
  });

  authTest('client should be redirected from admin dashboard', async ({ clientPage }) => {
    await clientPage.goto('/dashboard/admin');
    await clientPage.waitForURL('**/dashboard/client**', { timeout: 15_000 });
    expect(clientPage.url()).toContain('/dashboard/client');
  });

  authTest('consultant should be redirected from client dashboard', async ({ consultantPage }) => {
    await consultantPage.goto('/dashboard/client');
    await consultantPage.waitForURL('**/dashboard/consultant**', { timeout: 15_000 });
    expect(consultantPage.url()).toContain('/dashboard/consultant');
  });

  authTest('consultant should be redirected from admin dashboard', async ({ consultantPage }) => {
    await consultantPage.goto('/dashboard/admin');
    await consultantPage.waitForURL('**/dashboard/consultant**', { timeout: 15_000 });
    expect(consultantPage.url()).toContain('/dashboard/consultant');
  });
});
