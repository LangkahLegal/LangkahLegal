const ACCESS_TOKEN_KEYS = ["ll_token", "token"];
const REFRESH_TOKEN_KEYS = ["ll_refresh", "refresh_token"];
const ROLE_KEYS = ["ll_role", "role"];
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

export const getStoredAccessToken = () => readFirst(ACCESS_TOKEN_KEYS);

export const getStoredRefreshToken = () => readFirst(REFRESH_TOKEN_KEYS);

export const getStoredRole = () => readFirst(ROLE_KEYS);

/** Benar bila sesi sekarang didapat dari login email + password (bukan Google atau tautan reset). */
export const isPasswordSession = () => {
  try {
    const payload = getStoredAccessToken().split(".")[1];
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return (claims.amr || []).some((entry) => entry?.method === "password");
  } catch {
    return false;
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

  const accessToken = session.access_token || null;
  const refreshToken = session.refresh_token || null;
  // `session.user.role` milik Supabase selalu "authenticated"; itu bukan peran aplikasi.
  const role =
    [
      session?.user?.user_metadata?.role,
      session?.user_metadata?.role,
      session?.role,
    ].find((candidate) => APP_ROLES.includes(candidate)) || null;

  if (accessToken) {
    ACCESS_TOKEN_KEYS.forEach((key) => window.localStorage.setItem(key, accessToken));
  }

  if (refreshToken) {
    REFRESH_TOKEN_KEYS.forEach((key) => window.localStorage.setItem(key, refreshToken));
  }

  if (role) {
    ROLE_KEYS.forEach((key) => window.localStorage.setItem(key, role));
  }

  notifyAuthChange();
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;

  [...ACCESS_TOKEN_KEYS, ...REFRESH_TOKEN_KEYS, ...ROLE_KEYS].forEach((key) => {
    window.localStorage.removeItem(key);
  });

  window.sessionStorage.removeItem(OAUTH_VERIFIER_KEY);
  window.sessionStorage.removeItem("pending_auth");
  window.sessionStorage.removeItem("pending_role");
  window.localStorage.removeItem("ll_cached_profile");

  notifyAuthChange();
};
