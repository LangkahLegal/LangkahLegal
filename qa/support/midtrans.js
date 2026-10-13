const SNAP_SCRIPT = "**/snap/snap.js";

const snapScript = (callback) => `
window.snap = {
  pay: function (token, callbacks) {
    window.__snapTokens = (window.__snapTokens || []).concat([token]);
    setTimeout(function () {
      if (callbacks["${callback}"]) callbacks["${callback}"]({});
    }, 50);
  }
};`;

/**
 * Jendela pembayaran Midtrans adalah layanan pihak ketiga yang tidak bisa diisi otomatis,
 * jadi skripnya diganti dengan tiruan yang langsung memanggil hasil yang diminta skenario.
 */
export const midtrans = {
  respondWith: (page, callback) =>
    page.route(SNAP_SCRIPT, (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: snapScript(callback) }),
    ),

  block: (page) => page.route(SNAP_SCRIPT, (route) => route.abort()),

  ready: (page) => page.waitForFunction(() => !!window.snap),

  tokens: (page) => page.evaluate(() => window.__snapTokens || []),
};
