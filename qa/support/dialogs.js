import { expect } from "@playwright/test";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FEEDBACK_SELECTOR = '[data-testid="toast"], [data-testid="confirm-dialog"]';

/** Dijalankan di browser: laporkan setiap toast dan dialog konfirmasi yang muncul, sebelum sempat hilang. */
function watchFeedback(selector) {
  const seen = new WeakSet();
  const report = (el) => {
    if (seen.has(el)) return;
    seen.add(el);
    const isToast = el.dataset.testid === "toast";
    const text = el.querySelector('[data-testid$="-message"]')?.textContent ?? el.textContent;
    window.__llFeedback({ type: isToast ? `toast:${el.dataset.variant}` : "confirm", message: text.trim() });
  };
  const scan = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches(selector)) report(node);
    node.querySelectorAll(selector).forEach(report);
  };
  new MutationObserver((mutations) => mutations.forEach((m) => m.addedNodes.forEach(scan))).observe(document, {
    childList: true,
    subtree: true,
  });
}

/** Merekam toast, dialog konfirmasi aplikasi, dan dialog bawaan browser (yang seharusnya tidak pernah muncul). */
export class Dialogs {
  static async attach(page) {
    const dialogs = new Dialogs(page);
    await page.exposeBinding("__llFeedback", (_source, entry) => dialogs.messages.push(entry));
    await page.addInitScript(watchFeedback, FEEDBACK_SELECTOR);
    return dialogs;
  }

  constructor(page) {
    this.page = page;
    this.messages = [];
    page.on("dialog", async (dialog) => {
      this.messages.push({ type: `browser:${dialog.type()}`, message: dialog.message() });
      await dialog.dismiss();
    });
  }

  async waitFor(text, timeout = 15_000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const hit = this.messages.find(({ message }) => message.includes(text));
      if (hit) return hit.message;
      await sleep(50);
    }
    throw new Error(`Pemberitahuan "${text}" tidak muncul. Yang muncul: ${JSON.stringify(this.messages)}`);
  }

  async accept(text) {
    await this.#answer(text, "confirm-dialog-accept");
  }

  async dismiss(text) {
    await this.#answer(text, "confirm-dialog-cancel");
  }

  async #answer(text, buttonTestId) {
    const dialog = this.page.getByTestId("confirm-dialog");
    await expect(dialog.getByTestId("confirm-dialog-message")).toContainText(text);
    await dialog.getByTestId(buttonTestId).click();
    await expect(dialog).toBeHidden();
  }
}
