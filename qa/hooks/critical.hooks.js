import { After, Before } from "./bdd.js";

/**
 * @critical — alur yang tidak boleh rusak. Skenario bertag ini adalah isi regression test
 * (`npm run regression`), dan kegagalannya dilampiri tangkapan layar satu halaman penuh.
 */
Before({ tags: "@critical", name: "tandai sebagai regression" }, async ({ $testInfo }) => {
  $testInfo.annotations.push({ type: "regression", description: "critical" });
});

After({ tags: "@critical", name: "bukti kegagalan critical" }, async ({ $testInfo, page }) => {
  if ($testInfo.errors.length === 0) return;
  const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
  if (screenshot) await $testInfo.attach("critical-gagal", { body: screenshot, contentType: "image/png" });
});
