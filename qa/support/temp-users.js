import { TEMP_USERS } from "../test_data/auth.data.js";
import { authAdmin } from "./auth-admin.js";
import { db, eq } from "./database.js";
import { env } from "./env.js";

const uniqueEmail = () => `${TEMP_USERS.emailPrefix}.${Date.now()}@${TEMP_USERS.emailDomain}`;

/** Menghapus profil aplikasi milik sebuah email, tanpa menyentuh akun autentikasinya. */
export async function removeProfile(email) {
  const profile = await db.first("users", { email: eq(email) }, "id_user");
  if (!profile) return;
  await db.remove("konsultan", { id_user: eq(profile.id_user) });
  await db.remove("users", { id_user: eq(profile.id_user) });
}

export async function removeTempUser({ email, userId }) {
  await removeProfile(email);
  await authAdmin.deleteUser(userId);
}

/** Calon pengguna yang sudah mendaftar tetapi belum memverifikasi email. */
export async function createPendingSignup(role) {
  const email = uniqueEmail();
  const { otp, userId } = await authAdmin.generateOtp({
    type: "signup",
    email,
    password: env.accountPassword,
    name: TEMP_USERS.signupName,
  });
  return { email, role, otp, userId };
}

/** Pengguna terdaftar yang baru saja meminta tautan reset kata sandi. */
export async function createRecoveryUser() {
  const email = uniqueEmail();
  const user = await authAdmin.createUser({ email, password: env.accountPassword, name: TEMP_USERS.recoveryName });
  const { otp } = await authAdmin.generateOtp({ type: "recovery", email });
  return { email, otp, userId: user.id };
}

/** Klien sekali pakai yang sudah terdaftar penuh, untuk skenario yang mengubah akun (mis. kata sandi). */
export async function createTempClient() {
  const email = uniqueEmail();
  const name = TEMP_USERS.clientName;
  const user = await authAdmin.createUser({ email, password: env.accountPassword, name });
  const profile = { auth_user_id: user.id, email, nama: name, role: "client" };
  // Database bisa saja sudah membuat baris profil saat akun autentikasi dibuat.
  const existing = await db.first("users", { email: eq(email) }, "id_user");
  if (existing) await db.update("users", { id_user: eq(existing.id_user) }, profile);
  else await db.insert("users", profile);
  return { email, name, role: "client", password: env.accountPassword, userId: user.id };
}

/** Jaring pengaman: menghapus pengguna sementara yang tertinggal dari skenario yang terhenti. */
export async function removeLeftoverTempUsers() {
  const leftovers = await authAdmin.listByEmailPrefix(`${TEMP_USERS.emailPrefix}.`);
  for (const user of leftovers) await removeTempUser({ email: user.email, userId: user.id });
  return leftovers.length;
}
