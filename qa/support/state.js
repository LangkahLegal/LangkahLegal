import fs from "node:fs";
import path from "node:path";
import { STATE_DIR } from "./env.js";

const STATE_FILE = path.join(STATE_DIR, "identities.json");

export function saveIdentities(identities) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(identities, null, 2));
}

let cached;

/** Identitas akun uji di database (id_user, id_konsultan) hasil global setup. */
export function identity(key) {
  cached ??= JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  if (!cached[key]) throw new Error(`Identitas akun "${key}" belum dibuat oleh global setup.`);
  return cached[key];
}
