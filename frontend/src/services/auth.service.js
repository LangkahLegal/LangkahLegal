import api from "@/lib/axios";

// Catatan: BFF Pattern - Frontend tidak lagi berurusan dengan penyimpanan token!
// Cookie (ll_token, ll_refresh) dikelola sepenuhnya oleh Backend secara HttpOnly.

const getCookieValue = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
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

      return response?.data?.data;
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

      return response?.data?.data;
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

      return response?.data?.data?.session;
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
        window.location.href = data.url;
      }
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal login dengan Google.");
    }
  },

  exchangeCode: async (code) => {
    try {
      const response = await api.post("/auth/exchange-code", { code });
      return response?.data?.data?.session;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal memverifikasi login.");
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");
      return response?.data?.data || null;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal mengambil profil.");
    }
  },

  refreshSession: async () => {
    try {
      // Backend akan otomatis membaca ll_refresh dari cookie HttpOnly
      const response = await api.post("/auth/refresh");
      return response?.data?.data?.session;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal memperbarui sesi.");
    }
  },

  updateRole: async (role) => {
    try {
      const response = await api.post("/auth/role", { role });
      return response?.data?.data || null;
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message;
      throw new Error(message || "Gagal memperbarui role.");
    }
  },

  logout: async () => {
    try {
      // Backend otomatis menghapus cookies saat endpoint ini dipanggil
      await api.post("/auth/logout");
    } catch (error) {
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
