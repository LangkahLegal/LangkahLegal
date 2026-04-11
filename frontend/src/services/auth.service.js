import api from "@/lib/axios";

const getCookieBase = (maxAgeSeconds) => {
  const parts = [`max-age=${maxAgeSeconds}`, "path=/", "samesite=lax"];
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("secure");
  }
  return parts.join("; ");
};

const setCookie = (name, value, maxAgeSeconds = 60 * 60 * 24 * 7) => {
  if (typeof document === "undefined") return;
  const encodedValue = encodeURIComponent(value || "");
  document.cookie = `${name}=${encodedValue}; ${getCookieBase(maxAgeSeconds)}`;
};

const getCookieValue = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const clearCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; max-age=0; path=/; samesite=lax`;
};

const saveSessionTokens = (session) => {
  if (typeof window === "undefined") return;
  if (session?.access_token) {
    localStorage.setItem("token", session.access_token);
    setCookie("ll_token", session.access_token, session.expires_in || 60 * 60);
  }
  if (session?.refresh_token) {
    localStorage.setItem("refresh_token", session.refresh_token);
    setCookie("ll_refresh", session.refresh_token, 60 * 60 * 24 * 30);
  }
};

const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token") || getCookieValue("ll_refresh");
};

const clearAuthStorage = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  clearCookie("ll_token");
  clearCookie("ll_role");
  clearCookie("ll_refresh");
};

const saveRoleCookie = (role) => {
  if (!role) {
    clearCookie("ll_role");
    return;
  }
  setCookie("ll_role", role);
};

export const authService = {
  signUpWithPassword: async ({
    email,
    password,
    name,
    role,
    emailRedirectTo,
  }) => {
    try {
      const response = await api.post("/auth/signup", {
        email,
        password,
        name,
        role,
        emailRedirectTo,
      });

      const data = response?.data?.data;
      saveSessionTokens(data?.session);
      return data;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal mendaftar.");
    }
  },

  sendOtpLogin: async ({ email, emailRedirectTo }) => {
    try {
      await api.post("/auth/login-otp", {
        email,
        emailRedirectTo,
      });
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal mengirim OTP.");
    }
  },

  resendSignupOtp: async ({ email, emailRedirectTo }) => {
    try {
      await api.post("/auth/resend-signup-otp", {
        email,
        emailRedirectTo,
      });
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal mengirim ulang OTP.");
    }
  },

  verifyOtp: async ({ email, token, type = "email" }) => {
    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        token,
        type,
      });

      const data = response?.data?.data;
      saveSessionTokens(data?.session);
      return data;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Kode OTP tidak valid.");
    }
  },

  loginWithPassword: async ({ email, password }) => {
    try {
      const response = await api.post("/auth/login-password", {
        email,
        password,
      });

      const data = response?.data?.data;
      saveSessionTokens(data?.session);
      return data?.session;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal login.");
    }
  },

  signInWithGoogle: async ({ redirectTo }) => {
    try {
      const response = await api.post("/auth/oauth/google", {
        redirectTo,
      });
      const data = response?.data?.data;
      if (!data?.url) {
        throw new Error("Gagal menyiapkan login Google.");
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ll_oauth_verifier", data.code_verifier || "");
        window.location.href = data.url;
      }
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal login dengan Google.");
    }
  },

  getSession: async () => {
    try {
      if (typeof window === "undefined") return null;
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code") || "";
      const codeVerifier = sessionStorage.getItem("ll_oauth_verifier") || "";

      if (!code || !codeVerifier) return null;

      const response = await api.get("/auth/session", {
        params: {
          code,
          code_verifier: codeVerifier,
        },
      });

      sessionStorage.removeItem("ll_oauth_verifier");

      const data = response?.data?.data;
      saveSessionTokens(data?.session);
      return data?.session;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal mengambil sesi.");
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");
      const data = response?.data?.data || null;
      saveRoleCookie(data?.role);
      return data;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal mengambil profil.");
    }
  },

  refreshSession: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;

      const response = await api.post("/auth/refresh", {
        refresh_token: refreshToken,
      });

      const data = response?.data?.data;
      saveSessionTokens(data?.session);
      return data?.session;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal memperbarui sesi.");
    }
  },

  updateRole: async (role) => {
    try {
      const response = await api.post("/auth/role", { role });
      const data = response?.data?.data || null;
      saveRoleCookie(role);
      return data;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal memperbarui role.");
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal logout.");
    } finally {
      clearAuthStorage();
    }
  },
};
