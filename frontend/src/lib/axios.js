import axios from "axios";
import supabase from "@/lib/supabase";

/**
 * Konfigurasi Dasar Axios
 * Mengambil base URL dari environment variable (.env.local)
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

const getCookieValue = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const setCookieValue = (name, value, maxAgeSeconds = 60 * 60 * 24 * 7) => {
  if (typeof document === "undefined") return;
  const parts = [
    `${name}=${encodeURIComponent(value || "")}`,
    `max-age=${maxAgeSeconds}`,
    "path=/",
    "samesite=lax",
  ];
  if (window.location.protocol === "https:") {
    parts.push("secure");
  }
  document.cookie = parts.join("; ");
};

const clearCookieValue = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; max-age=0; path=/; samesite=lax`;
};

const syncSessionToken = async () => {
  if (typeof window === "undefined") return null;
  const { data } = await supabase.auth.getSession();
  const sessionToken = data?.session?.access_token;

  if (!sessionToken) return null;

  if (localStorage.getItem("token") !== sessionToken) {
    localStorage.setItem("token", sessionToken);
  }

  if (getCookieValue("ll_token") !== sessionToken) {
    setCookieValue("ll_token", sessionToken);
  }

  return sessionToken;
};

const getAuthToken = async () => {
  if (typeof window === "undefined") return null;
  const sessionToken = await syncSessionToken();
  return sessionToken || localStorage.getItem("token") || getCookieValue("ll_token");
};

/**
 * Request Interceptor
 * Setiap kali Frontend mengirim request ke API,
 * fungsi ini akan mengecek apakah ada token di localStorage.
 * Jika ada, otomatis diselipkan ke Header Authorization: Bearer <token>
 */
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      const token = await getAuthToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor (Optional tapi Recommended)
 * Menangani error secara terpusat, misalnya jika token kadaluwarsa (401)
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika server merespon dengan 401 (Unauthorized),
    // biasanya kita ingin paksa user logout atau refresh token.
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        console.warn("Sesi berakhir atau tidak valid. Mengarahkan ke Login...");
        localStorage.removeItem("token");
        clearCookieValue("ll_token");
        // window.location.href = "/auth/login"; // Opsional: Auto-redirect
      }
    }
    return Promise.reject(error);
  },
);

export default api;
