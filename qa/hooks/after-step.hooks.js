import { env } from "../support/env.js";
import { AfterStep } from "./bdd.js";

/**
 * Setelah setiap langkah: catat durasinya ke jejak skenario.
 * Dengan SIT_STEP_SCREENSHOT=1, tangkapan layar tiap langkah ikut masuk ke laporan.
 */
AfterStep({ name: "catat jejak langkah" }, async ({ $step, $testInfo, page, world }) => {
  const startedAt = world.currentStep?.startedAt ?? Date.now();
  world.trail.push({ title: $step.title, durationMs: Date.now() - startedAt });

  if (env.stepScreenshot) {
    await $testInfo.attach($step.title, { body: await page.screenshot(), contentType: "image/png" });
  }
});
