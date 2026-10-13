import { ensureBackendReady } from "../support/health.js";
import { BeforeAll } from "./bdd.js";

/** Sekali per worker: tidak ada gunanya menjalankan skenario bila backend tidak siap. */
BeforeAll({ name: "pastikan backend siap" }, async () => {
  await ensureBackendReady();
});
