/**
 * E2E Tests — Profile / Account Management
 * 
 * @tags @profile
 * 
 * Covers:
 * - Happy path: view profile, update name
 * - Validation: consultant-specific fields
 * - Unauthorized access: profile without login
 */
import { test as authTest, expect as authExpect } from '../fixtures/index.js';
import { test, expect } from '@playwright/test';
import { ProfilePage } from '../pom/ProfilePage.js';

// ═══════════════════════════════════════════════════════════════
// HAPPY PATH
// ═══════════════════════════════════════════════════════════════

authTest.describe('Profile — Happy Path @profile', () => {
  authTest('client should view profile settings page', async ({ clientPage }) => {
    const profilePage = new ProfilePage(clientPage);
    await profilePage.goto();

    // Profile page should load without errors
    // await clientPage.waitForLoadState('networkidle');
    const url = clientPage.url();
    expect(url).toContain('/setting/profile');
  });

  authTest('consultant should view profile with professional fields', async ({ consultantPage }) => {
    const profilePage = new ProfilePage(consultantPage);
    await profilePage.goto();

    // await consultantPage.waitForLoadState('networkidle');
    
    // Consultant should see professional fields
    const isConsultant = await profilePage.isConsultantFieldVisible();
    expect(isConsultant).toBeTruthy();
  });

  authTest('client should see basic profile without consultant fields', async ({ clientPage }) => {
    const profilePage = new ProfilePage(clientPage);
    await profilePage.goto();

    // await clientPage.waitForLoadState('networkidle');
    
    // Client should NOT see consultant-specific fields
    const isConsultant = await profilePage.isConsultantFieldVisible();
    expect(isConsultant).toBeFalsy();
  });
});

// ═══════════════════════════════════════════════════════════════
// UNAUTHORIZED ACCESS
// ═══════════════════════════════════════════════════════════════

test.describe('Profile — Unauthorized Access @profile', () => {
  test('should redirect to login when accessing profile without session', async ({ page }) => {
    await page.goto('/setting/profile');
    await page.waitForURL('**/auth/login**', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect to login when accessing settings root without session', async ({ page }) => {
    await page.goto('/setting');
    await page.waitForURL('**/auth/login**', { timeout: 15_000 });
    expect(page.url()).toContain('/auth/login');
  });
});
