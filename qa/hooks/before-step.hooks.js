import { BeforeStep } from "./bdd.js";

/** Sebelum setiap langkah: tandai langkah yang sedang berjalan. */
BeforeStep({ name: "tandai langkah berjalan" }, async ({ $step, world }) => {
  world.currentStep = { title: $step.title, startedAt: Date.now() };
});
