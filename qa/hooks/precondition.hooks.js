import { presetSessionStorage } from "../support/browser.js";
import { createPendingSignup, createRecoveryUser, createTempClient, removeTempUser } from "../support/temp-users.js";
import { Before } from "./bdd.js";

const TAG = /^@precondition:(.+)$/;

/**
 * @precondition:<nama> — prasyarat yang disiapkan sebelum skenario dimulai,
 * sehingga langkah Given di file .feature hanya berisi hal yang penting bagi pembaca.
 */
const PRECONDITIONS = {
  "login-klien": ({ auth }) => auth.signIn("klien"),
  "login-konsultan": ({ auth }) => auth.signIn("konsultan"),
  "login-admin": ({ auth }) => auth.signIn("admin"),

  /** Klien sekali pakai yang sudah login; dipakai skenario yang mengubah akunnya sendiri. */
  "login-klien-sementara": async ({ auth, world }) => {
    world.tempUser = await createTempClient();
    world.cleanups.push(() => removeTempUser(world.tempUser));
    await auth.signInWith(world.tempUser);
  },

  /** Klien sekali pakai yang masuk tanpa kata sandi (lewat kode OTP), seperti pengguna Google. */
  "login-klien-sementara-tanpa-kata-sandi": async ({ auth, world }) => {
    world.tempUser = await createTempClient();
    world.cleanups.push(() => removeTempUser(world.tempUser));
    await auth.signInWithOtp(world.tempUser);
  },

  /** Pengguna sekali pakai yang baru meminta tautan reset; tersedia sebagai world.tempUser. */
  "pengguna-reset-kata-sandi": async ({ world }) => {
    world.tempUser = await createRecoveryUser();
    world.cleanups.push(() => removeTempUser(world.tempUser));
  },

  /** Calon konsultan yang sudah mendaftar dan menunggu OTP; tersedia sebagai world.newUser. */
  "calon-konsultan-menunggu-otp": async ({ page, world }) => {
    world.newUser = await createPendingSignup("konsultan");
    world.cleanups.push(() => removeTempUser(world.newUser));
    const { email, role } = world.newUser;
    await presetSessionStorage(page, { pending_auth: JSON.stringify({ email, role, flow: "signup" }) });
  },
};

Before({ name: "siapkan precondition" }, async ({ $tags, auth, page, world }) => {
  for (const tag of $tags) {
    const name = tag.match(TAG)?.[1];
    if (!name) continue;

    const prepare = PRECONDITIONS[name];
    if (!prepare) {
      throw new Error(`Precondition "${name}" tidak dikenal. Pilihan: ${Object.keys(PRECONDITIONS).join(", ")}`);
    }
    await prepare({ auth, page, world });
  }
});
