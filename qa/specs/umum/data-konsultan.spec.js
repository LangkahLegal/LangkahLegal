import { Given } from "../../hooks/bdd.js";
import { setKonsultan } from "../../support/seed.js";
import { ACCOUNTS } from "../../test_data/accounts.js";
import { REJECTION_REASON } from "../../test_data/konsultan.data.js";

Given("verifikasi konsultan baru ditolak dengan sebuah alasan", async ({ world }) => {
  const original = ACCOUNTS["konsultan baru"].konsultan;
  await setKonsultan("konsultan baru", { status_verifikasi: "ditolak", alasan_penolakan: REJECTION_REASON });
  world.cleanups.push(() =>
    setKonsultan("konsultan baru", { status_verifikasi: original.status_verifikasi, alasan_penolakan: null }),
  );
});

Given("konsultan baru baru saja mengajukan verifikasi", async ({ world }) => {
  const original = ACCOUNTS["konsultan baru"].konsultan;
  const pending = { status_verifikasi: original.status_verifikasi, alasan_penolakan: null };
  // Daftar admin diurutkan dari perubahan terbaru, jadi pengajuan ini muncul paling atas.
  await setKonsultan("konsultan baru", { ...pending, updated_at: new Date().toISOString() });
  world.cleanups.push(() => setKonsultan("konsultan baru", pending));
});
