import { loadContinueState, restoreStorage, saveContinueState } from "../support/continue-state.js";
import { account } from "../test_data/accounts.js";
import { After, Before } from "./bdd.js";

/**
 * @continue — skenario meneruskan keadaan browser (sesi login, data sementara) dan catatan
 * `world.shared` dari skenario yang berjalan tepat sebelumnya, tanpa mengulang langkah awalnya.
 */
Before({ tags: "@continue", name: "lanjutkan state skenario sebelumnya" }, async ({ page, world }) => {
  const state = loadContinueState();
  if (!state) {
    throw new Error("Skenario @continue tidak punya state untuk diteruskan. Jalankan bersama skenario sebelumnya.");
  }

  await restoreStorage(page, state);
  world.shared = state.shared;
  world.continuedFrom = state.scenario;
  if (state.accountKey) world.account = account(state.accountKey);
  if (state.localStorage.ll_token) world.session = { access_token: state.localStorage.ll_token };
});

After({ name: "simpan state untuk @continue" }, async ({ $testInfo, page, world }) => {
  await saveContinueState(page, world, $testInfo.title);
});
