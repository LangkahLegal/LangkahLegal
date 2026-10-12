/**
 * Auth fixtures — provides pre-authenticated page contexts for each role.
 * Uses API-based login for speed (skips UI login flow).
 */
import { test as base } from '@playwright/test';
import { loginViaAPI, injectSession, getProfile } from '../utils/api-helper.js';
import { ACCOUNTS } from '../utils/test-data.js';

/**
 * Extended test fixture with authenticated pages for each role.
 *
 * Usage:
 *   test('my test', async ({ clientPage }) => { ... })
 *   test('my test', async ({ consultantPage }) => { ... })
 *   test('my test', async ({ adminPage }) => { ... })
 */
export const test = base.extend({
  /** Authenticated client page */
  clientPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await loginViaAPI(ACCOUNTS.client.email, ACCOUNTS.client.password);
    await injectSession(page, session, 'client');
    await use(page);
    await context.close();
  },

  /** Authenticated consultant page */
  consultantPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await loginViaAPI(ACCOUNTS.consultant.email, ACCOUNTS.consultant.password);
    await injectSession(page, session, 'konsultan');
    await use(page);
    await context.close();
  },

  /** Authenticated admin page */
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const session = await loginViaAPI(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await injectSession(page, session, 'admin');
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
