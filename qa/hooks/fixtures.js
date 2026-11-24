import { test as base } from "playwright-bdd";
import { PAGE_OBJECTS } from "../pages/index.js";
import { account } from "../test_data/accounts.js";
import { Dialogs } from "../support/dialogs.js";
import { Network } from "../support/network.js";
import { sessions } from "../support/sessions.js";
import { seedSessionCookies } from "../support/browser.js";
import { env } from "../support/env.js";

const pageObjectFixtures = Object.fromEntries(
  Object.entries(PAGE_OBJECTS).map(([name, PageObject]) => [name, async ({ page }, use) => use(new PageObject(page))]),
);

const seedSession = (page, session, role) => seedSessionCookies(page, env.baseUrl, session, role);

export const test = base.extend({
  ...pageObjectFixtures,

  network: [
    async ({ page }, use) => {
      const network = new Network(page);
      network.install();
      await use(network);
    },
    { auto: true },
  ],

  dialogs: [async ({ page }, use) => use(new Dialogs(page)), { auto: true }],

  pageErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
    },
    { auto: true },
  ],

  /** Catatan antar-langkah dalam satu skenario. */
  world: async ({}, use) => use({ cleanups: [], shared: {}, trail: [] }),

  auth: async ({ page, world }, use) => {
    const signIn = async (key, { fresh = false, withRole = true, override = {} } = {}) => {
      const session = await (fresh ? sessions.fresh(key) : sessions.shared(key));
      await seedSession(page, { ...session, ...override }, withRole ? account(key).role : null);
      world.account = account(key);
      world.session = session;
      return session;
    };
    /** Masuk sebagai pengguna di luar akun uji tetap, mis. pengguna sementara. */
    const signInWith = async (user) => {
      const session = await sessions.loginWith(user);
      await seedSession(page, session, user.role);
      world.account = user;
      world.session = session;
      return session;
    };
    const signInWithOtp = async (user) => {
      const session = await sessions.loginWithOtp(user);
      await seedSession(page, session, user.role);
      world.account = user;
      world.session = session;
      return session;
    };
    await use({ signIn, signInWith, signInWithOtp, forget: sessions.forget });
  },
});
