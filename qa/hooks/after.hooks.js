import { After } from "./bdd.js";

/** Saat hook After berjalan status akhir belum ditetapkan, jadi kegagalan dikenali dari galat yang tercatat. */
const failed = (testInfo) => testInfo.errors.length > 0;

const describeStep = ({ title, durationMs }) => `${String(durationMs).padStart(6)} ms  ${title}`;

const describeRequest = ({ method, path, status }) => `${status ?? "---"}  ${method} ${path}`;

const asText = (lines) => ({ body: lines.join("\n"), contentType: "text/plain" });

/**
 * Setelah setiap skenario: lampirkan jejak langkah, permintaan API, dan dialog bila gagal,
 * lalu jalankan pembersihan data yang didaftarkan skenario.
 * Hook ini didefinisikan paling awal sehingga berjalan paling akhir.
 */
After({ name: "lampirkan jejak dan bersihkan data" }, async ({ $testInfo, world, network, dialogs }) => {
  if (failed($testInfo)) {
    await $testInfo.attach("jejak-langkah", asText(world.trail.map(describeStep)));
    await $testInfo.attach("permintaan-api", asText(network.requests.map(describeRequest)));
    await $testInfo.attach("dialog", asText(dialogs.messages.map(({ type, message }) => `${type}: ${message}`)));
  }
  for (const cleanup of world.cleanups.reverse()) await cleanup();
});
