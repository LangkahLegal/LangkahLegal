const ACCESS_TOKEN_KEYS = ["ll_token", "token"];
const REFRESH_TOKEN_KEYS = ["ll_refresh", "refresh_token"];
const ROLE_KEYS = ["ll_role", "role"];
const OAUTH_VERIFIER_KEY = "pending_oauth_verifier";

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

export const setStoredRole = (role) => {
  if (typeof window === "undefined" || !role) return;

  ROLE_KEYS.forEach((key) => window.localStorage.setItem(key, role));
};

export const setAuthSession = (session) => {
  if (typeof window === "undefined" || !session) return;

  const accessToken = session.access_token || null;
  const refreshToken = session.refresh_token || null;
  const role =
    session?.user?.role || session?.user_metadata?.role || session?.role || null;

  if (accessToken) {
    ACCESS_TOKEN_KEYS.forEach((key) => window.localStorage.setItem(key, accessToken));
  }

  if (refreshToken) {
    REFRESH_TOKEN_KEYS.forEach((key) => window.localStorage.setItem(key, refreshToken));
  }

  if (role) {
    setStoredRole(role);
  }
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;

  [...ACCESS_TOKEN_KEYS, ...REFRESH_TOKEN_KEYS, ...ROLE_KEYS].forEach((key) => {
    window.localStorage.removeItem(key);
  });

  window.sessionStorage.removeItem(OAUTH_VERIFIER_KEY);
  window.sessionStorage.removeItem("pending_auth");
  window.sessionStorage.removeItem("pending_role");
};
