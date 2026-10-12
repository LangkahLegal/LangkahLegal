import { ensureAccounts } from "./account-setup.js";
import { clearContinueState } from "./continue-state.js";
import { ensureBackendReady } from "./health.js";
import { saveIdentities } from "./state.js";

/** Dijalankan Playwright satu kali sebelum seluruh suite: menyiapkan akun uji di database. */
export default async function globalSetup() {
  await ensureBackendReady();
  saveIdentities(await ensureAccounts());
  clearContinueState();
}
