import fs from "node:fs";
import path from "node:path";
import { STATE_DIR } from "./env.js";

const STATE_FILE = path.join(STATE_DIR, "continue.json");

const readStorage = () => ({
  url: location.href,
  localStorage: Object.fromEntries(Object.entries(localStorage)),
  sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
});

const writeStorage = (state) => {
  const marker = "__sit_continued";
  if (sessionStorage.getItem(marker)) return;
  Object.entries(state.localStorage).forEach(([key, value]) => localStorage.setItem(key, value));
  Object.entries(state.sessionStorage).forEach(([key, value]) => sessionStorage.setItem(key, value));
  sessionStorage.setItem(marker, "1");
};

export function clearContinueState() {
  fs.rmSync(STATE_FILE, { force: true });
}

/** Menyimpan keadaan akhir sebuah skenario agar skenario bertag @continue bisa meneruskannya. */
export async function saveContinueState(page, world, scenario) {
  const storage = await page.evaluate(readStorage).catch(() => null);
  if (!storage) return clearContinueState();

  fs.mkdirSync(STATE_DIR, { recursive: true });
  const state = { scenario, ...storage, accountKey: world.account?.key ?? null, shared: world.shared };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function loadContinueState() {
  if (!fs.existsSync(STATE_FILE)) return null;
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
}

export const restoreStorage = (page, state) => page.addInitScript(writeStorage, state);
