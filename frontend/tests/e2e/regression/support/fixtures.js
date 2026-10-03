/**
 * Fixture untuk suite regression LangkahLegal.
 *
 *  api        : MockApi (backend di-mock di level jaringan)
 *  dialogs    : rekaman alert()/confirm(); set `dialogs.confirmResult=false` untuk menolak confirm
 *  pageErrors : uncaught exception di browser (deteksi crash)
 *  loginAs    : seed sesi (localStorage) + handler default untuk role tertentu
 *
 * Semua request ke host eksternal (Google Fonts, ui-avatars, Midtrans, ImgBB, dll)
 * dilayani lokal agar test hermetis & deterministik.
 */
import { test as base, expect } from "@playwright/test";
import { MockApi } from "./mock-api.js";
import { session, PIXEL_PNG } from "./mock-data.js";

const MIDTRANS_STUB = `
window.snap = {
  pay: function (token, cb) {
    window.__snapCalls = (window.__snapCalls || []).concat([token]);
    var mode = window.__snapMode || "success";
    setTimeout(function () {
      if (mode === "success" && cb.onSuccess) cb.onSuccess({});
      else if (mode === "pending" && cb.onPending) cb.onPending({});
      else if (mode === "error" && cb.onError) cb.onError({});
    }, 50);
  }
};`;

const isLocal = (url) => ["localhost", "127.0.0.1"].includes(url.hostname);

async function fulfillExternal(route) {
  const req = route.request();
  const url = new URL(req.url());
  const type = req.resourceType();

  // Font ikon Material Symbols diambil dari jaringan agar layout realistis
  // (set E2E_OFFLINE=1 untuk memblokirnya dan menguji fallback tanpa CDN).
  if (!process.env.E2E_OFFLINE && /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    return route.continue().catch(() => route.abort());
  }
  if (url.pathname.endsWith("/snap/snap.js")) {
    return route.fulfill({ status: 200, contentType: "application/javascript", body: MIDTRANS_STUB });
  }
  if (type === "image") return route.fulfill({ status: 200, contentType: "image/png", body: PIXEL_PNG });
  if (type === "stylesheet") return route.fulfill({ status: 200, contentType: "text/css", body: "" });
  if (type === "script") return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  if (type === "document") {
    return route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<html><body><h1 data-testid="external-page">External: ${url.hostname}</h1></body></html>`,
    });
  }
  return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "blocked by e2e" }) });
}

export const STORAGE_ROLE = { client: "client", konsultan: "konsultan", consultant: "konsultan", admin: "admin" };

/** Seed sesi login ke localStorage sebelum script aplikasi berjalan (sekali per tab). */
export async function seedSession(page, role, { withRole = true } = {}) {
  const r = STORAGE_ROLE[role];
  const s = session(r);
  await page.addInitScript(
    ({ access, refresh, role, withRole }) => {
      try {
        if (window.sessionStorage.getItem("__e2e_seeded")) return;
        ["ll_token", "token"].forEach((k) => localStorage.setItem(k, access));
        ["ll_refresh", "refresh_token"].forEach((k) => localStorage.setItem(k, refresh));
        if (withRole) ["ll_role", "role"].forEach((k) => localStorage.setItem(k, role));
        window.sessionStorage.setItem("__e2e_seeded", "1");
      } catch {
        /* storage diblokir */
      }
    },
    { access: s.access_token, refresh: s.refresh_token, role: r, withRole },
  );
}

export const test = base.extend({
  _hermetic: [
    async ({ page }, use) => {
      await page.route((url) => !isLocal(url), fulfillExternal);
      await use();
    },
    { auto: true },
  ],

  api: async ({ page }, use) => {
    const api = new MockApi(page);
    await api.install();
    await use(api);
  },

  dialogs: async ({ page }, use) => {
    const state = { messages: [], confirmResult: true };
    page.on("dialog", async (dialog) => {
      state.messages.push({ type: dialog.type(), message: dialog.message() });
      if (dialog.type() === "confirm" && !state.confirmResult) await dialog.dismiss();
      else await dialog.accept();
    });
    state.last = () => state.messages[state.messages.length - 1]?.message;
    state.waitFor = async (re, timeout = 8000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const hit = state.messages.find((m) => (re instanceof RegExp ? re.test(m.message) : m.message.includes(re)));
        if (hit) return hit.message;
        await new Promise((r) => setTimeout(r, 50));
      }
      throw new Error(`Dialog "${re}" tidak muncul. Dialog yang muncul: ${JSON.stringify(state.messages)}`);
    };
    await use(state);
  },

  pageErrors: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await use(errors);
  },

  loginAs: async ({ page, api }, use) => {
    await use(async (role, opts = {}) => {
      await seedSession(page, role, opts);
      if (role === "client") api.asClient();
      else if (role === "konsultan" || role === "consultant") api.asConsultant();
      else if (role === "admin") api.asAdmin();
    });
  },
});

export { expect };

/**
 * Bangun judul + metadata test case untuk laporan.
 * @param {string} id  ID test case, mis. "AUTH-001"
 * @param {string} title
 * @param {{feature:string,type:string,input:string,expected:string,tags?:string[]}} meta
 */
export function tc(id, title, meta) {
  const annotation = [
    { type: "feature", description: meta.feature },
    { type: "category", description: meta.type },
    { type: "input", description: meta.input },
    { type: "expected", description: meta.expected },
  ];
  return [`${id} ${title}`, { tag: ["@regression", ...(meta.tags || [])], annotation }];
}

/**
 * Tandai test sebagai cacat yang sudah diketahui (test.fail) agar suite regression tetap hijau
 * namun otomatis memberi tahu bila cacat sudah diperbaiki. Set E2E_STRICT=1 untuk menonaktifkan.
 */
export function knownDefect(bugId) {
  base.info().annotations.push({ type: "bug", description: bugId });
  if (!process.env.E2E_STRICT) base.fail(true, `Known defect ${bugId}`);
}

/** Pastikan halaman tidak crash (error boundary Next.js production). */
export async function expectNoCrash(page) {
  await expect(page.getByText(/Application error|client-side exception/i)).toHaveCount(0);
}
