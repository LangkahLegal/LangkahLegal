import api from "@/lib/axios";
import {
  clearAuthSession,
  getStoredOAuthVerifier,
  getStoredRefreshToken,
  setAuthSession,
  setStoredOAuthVerifier,
  setStoredRole,
} from "@/lib/authStorage";

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
      if (data?.session) {
        setAuthSession(data.session);
      }

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
      if (data?.session) {
        setAuthSession(data.session);
      }

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

      const session = response?.data?.data?.session || null;
      if (session) {
        setAuthSession(session);
      }

      return session;
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
      if (data?.code_verifier) {
        setStoredOAuthVerifier(data.code_verifier);
      }
      if (typeof window !== "undefined") {
        window.location.href = data.url;
      }
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal login dengan Google.");
    }
  },

  exchangeCode: async (code) => {
    try {
      const code_verifier = getStoredOAuthVerifier();
      const response = await api.post("/auth/exchange-code", {
        code,
        code_verifier,
      });
      const session = response?.data?.data?.session || null;
      if (session) {
        setAuthSession(session);
        setStoredOAuthVerifier(null);
      }
      return session;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal memverifikasi login.");
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");
      const profile = response?.data?.data || null;
      if (profile?.role) {
        setStoredRole(profile.role);
      }
      return profile;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal mengambil profil.");
    }
  },

  refreshSession: async () => {
    try {
      const refreshToken = getStoredRefreshToken();
      const response = await api.post("/auth/refresh", {
        refresh_token: refreshToken,
      });
      const session = response?.data?.data?.session || null;
      if (session) {
        setAuthSession(session);
      }
      return session;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal memperbarui sesi.");
    }
  },

  updateRole: async (role) => {
    try {
      const response = await api.post("/auth/role", { role });
      if (role) {
        setStoredRole(role);
      }
      return response?.data?.data || null;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal memperbarui role.");
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
      clearAuthSession();
    } catch (error) {
      clearAuthSession();
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal logout.");
    }
  },

  forgotPassword: async ({ email, emailRedirectTo }) => {
    try {
      await api.post("/auth/forgot-password", {
        email,
        emailRedirectTo,
      });
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal mengirim link reset password.");
    }
  },

  resetPassword: async ({ newPassword }) => {
    try {
      await api.post("/auth/reset-password", {
        new_password: newPassword,
      });
    } catch (error) {
      let message = error?.response?.data?.detail || error?.message;
      // Handle array of errors from FastAPI 422 Unprocessable Entity
      if (Array.isArray(message)) {
        message = message.map(err => err.msg).join(", ");
      }
      throw new Error(message || "Gagal reset password.");
    }
  },
};
