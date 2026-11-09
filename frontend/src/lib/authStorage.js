// Token sesi disimpan backend sebagai cookie httpOnly; browser hanya menyimpan penanda yang bukan rahasia.
const SESSION_KEY = "ll_session";
const LOGIN_METHOD_KEY = "ll_login_method";
const ROLE_KEYS = ["ll_role", "role"];
const LEGACY_TOKEN_KEYS = ["ll_token", "token", "ll_refresh", "refresh_token"];
const OAUTH_VERIFIER_KEY = "pending_oauth_verifier";
const APP_ROLES = ["client", "konsultan", "admin"];

const readFirst = (keys) => {
  if (typeof window === "undefined") return null;

  for (const key of keys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return null;
};

export const clearLegacyTokens = () => {
  if (typeof window === "undefined") return;
  LEGACY_TOKEN_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

export const hasStoredSession = () => readFirst([SESSION_KEY]) === "1";

export const getStoredRole = () => readFirst(ROLE_KEYS);

/** Benar bila sesi sekarang didapat dari login email + password (bukan Google atau tautan reset). */
export const isPasswordSession = () => readFirst([LOGIN_METHOD_KEY]) === "password";

const loginMethodOf = (accessToken) => {
  try {
    const payload = accessToken.split(".")[1];
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return (claims.amr || []).some((entry) => entry?.method === "password") ? "password" : "other";
  } catch {
    return null;
  }
};

export const getStoredOAuthVerifier = () => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(OAUTH_VERIFIER_KEY);
};

export const setStoredOAuthVerifier = (verifier) => {
  if (typeof window === "undefined") return;

  if (verifier) {
    window.sessionStorage.setItem(OAUTH_VERIFIER_KEY, verifier);
  } else {
    window.sessionStorage.removeItem(OAUTH_VERIFIER_KEY);
  }
};

const notifyAuthChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-storage-change"));
  }
};

export const setStoredRole = (role) => {
  if (typeof window === "undefined" || !role) return;

  ROLE_KEYS.forEach((key) => window.localStorage.setItem(key, role));
  notifyAuthChange();
};

export const setAuthSession = (session) => {
  if (typeof window === "undefined" || !session) return;

  // `session.user.role` milik Supabase selalu "authenticated"; itu bukan peran aplikasi.
  const role =
    [
      session?.user?.user_metadata?.role,
      session?.user_metadata?.role,
      session?.role,
    ].find((candidate) => APP_ROLES.includes(candidate)) || null;
  const loginMethod = session.access_token ? loginMethodOf(session.access_token) : null;

  clearLegacyTokens();
  window.localStorage.setItem(SESSION_KEY, "1");
  if (loginMethod) window.localStorage.setItem(LOGIN_METHOD_KEY, loginMethod);
  if (role) ROLE_KEYS.forEach((key) => window.localStorage.setItem(key, role));

  notifyAuthChange();
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;

  [SESSION_KEY, LOGIN_METHOD_KEY, ...ROLE_KEYS, ...LEGACY_TOKEN_KEYS].forEach((key) => {
    window.localStorage.removeItem(key);
  });

  window.sessionStorage.removeItem(OAUTH_VERIFIER_KEY);
  window.sessionStorage.removeItem("pending_auth");
  window.sessionStorage.removeItem("pending_role");
  window.localStorage.removeItem("ll_cached_profile");
  window.localStorage.removeItem("ll_consultation_draft");

  notifyAuthChange();
};
