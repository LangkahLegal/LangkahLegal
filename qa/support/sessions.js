import { account } from "../test_data/accounts.js";
import { authAdmin } from "./auth-admin.js";
import { API_PREFIX, env } from "./env.js";

const MAX_AGE_MS = 40 * 60 * 1000;
const cache = new Map();

async function loginWith({ email, password }) {
  const response = await fetch(`${env.apiUrl}${API_PREFIX}/auth/login-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Login ${email} gagal (${response.status}): ${await response.text()}`);
  return (await response.json()).data.session;
}

const login = (key) => loginWith(account(key));

/** Masuk dengan kode OTP email, sehingga sesinya bukan hasil login kata sandi. */
async function loginWithOtp({ email }) {
  const { otp } = await authAdmin.generateOtp({ type: "magiclink", email });
  const response = await fetch(`${env.apiUrl}${API_PREFIX}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token: otp, type: "email" }),
  });
  if (!response.ok) throw new Error(`Login OTP ${email} gagal (${response.status}): ${await response.text()}`);
  return (await response.json()).data.session;
}

export const sessions = {
  loginWith,
  loginWithOtp,

  /** Sesi baru yang tidak dibagi dengan skenario lain. */
  fresh: login,

  /** Sesi yang dipakai ulang antar skenario agar tidak login berulang kali. */
  async shared(key) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.createdAt < MAX_AGE_MS) return entry.session;
    const session = await login(key);
    cache.set(key, { session, createdAt: Date.now() });
    return session;
  },

  /** Dipanggil setelah skenario yang mengakhiri sesi (logout, ganti kata sandi). */
  forget: (key) => cache.delete(key),
};
