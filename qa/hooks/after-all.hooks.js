import { removeLeftoverTempUsers } from "../support/temp-users.js";
import { AfterAll } from "./bdd.js";

/** Sekali per worker: membersihkan pengguna sementara yang tertinggal dari skenario yang terhenti. */
AfterAll({ name: "hapus pengguna sementara yang tertinggal" }, async () => {
  await removeLeftoverTempUsers();
});
