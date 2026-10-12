const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Merekam alert()/confirm() browser dan menjawabnya sesuai keinginan skenario. */
export class Dialogs {
  constructor(page) {
    this.messages = [];
    this.acceptConfirm = true;
    page.on("dialog", async (dialog) => {
      this.messages.push({ type: dialog.type(), message: dialog.message() });
      if (dialog.type() === "confirm" && !this.acceptConfirm) await dialog.dismiss();
      else await dialog.accept();
    });
  }

  async waitFor(text, timeout = 15_000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const hit = this.messages.find(({ message }) => message.includes(text));
      if (hit) return hit.message;
      await sleep(50);
    }
    throw new Error(`Dialog "${text}" tidak muncul. Yang muncul: ${JSON.stringify(this.messages)}`);
  }
}
