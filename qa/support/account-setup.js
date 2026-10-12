import { ACCOUNTS } from "../test_data/accounts.js";
import { authAdmin } from "./auth-admin.js";
import { db, eq } from "./database.js";
import { env } from "./env.js";

async function ensureAuthUser({ email, name }) {
  const existing = await authAdmin.findByEmail(email);
  if (!existing) return authAdmin.createUser({ email, name, password: env.accountPassword });
  await authAdmin.setPassword(existing.id, env.accountPassword);
  return existing;
}

async function ensureProfile({ email, name, role }, authUserId) {
  const values = { auth_user_id: authUserId, email, nama: name, role };
  const existing = await db.first("users", { email: eq(email) }, "id_user");
  if (!existing) return db.insert("users", values);
  const [updated] = await db.update("users", { id_user: eq(existing.id_user) }, values);
  return updated;
}

async function ensureKonsultan(profile, idUser) {
  const existing = await db.first("konsultan", { id_user: eq(idUser) }, "id_konsultan");
  if (!existing) return db.insert("konsultan", { ...profile, id_user: idUser });
  const [updated] = await db.update("konsultan", { id_konsultan: eq(existing.id_konsultan) }, profile);
  return updated;
}

/** Membuat akun uji bila belum ada dan mengembalikan identitasnya di database. */
export async function ensureAccounts() {
  const identities = {};
  for (const [key, definition] of Object.entries(ACCOUNTS)) {
    const authUser = await ensureAuthUser(definition);
    const identity = { authUserId: authUser.id };

    if (definition.role) {
      const profile = await ensureProfile(definition, authUser.id);
      identity.idUser = profile.id_user;
      if (definition.konsultan) {
        identity.idKonsultan = (await ensureKonsultan(definition.konsultan, profile.id_user)).id_konsultan;
      }
    } else {
      await db.remove("users", { email: eq(definition.email) });
    }
    identities[key] = identity;
  }
  return identities;
}
