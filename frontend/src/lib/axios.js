import axios from "axios";

/**
 * Konfigurasi Dasar Axios
 * Mengambil base URL dari environment variable (.env.local)
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const getCookieBase = (maxAgeSeconds) => {
  const parts = [`max-age=${maxAgeSeconds}`, "path=/", "samesite=lax"];
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("secure");
  }
  return parts.join("; ");
};

const setCookieValue = (name, value, maxAgeSeconds = 60 * 60 * 24 * 7) => {
  if (typeof document === "undefined") return;
  const encodedValue = encodeURIComponent(value || "");
  document.cookie = `${name}=${encodedValue}; ${getCookieBase(maxAgeSeconds)}`;
};

const getCookieValue = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const clearCookieValue = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; max-age=0; path=/; samesite=lax`;
};

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || getCookieValue("ll_token");
};

const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token") || getCookieValue("ll_refresh");
};

let refreshPromise = null;

const refreshSession = async () => {
  if (typeof window === "undefined") return null;
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      const session = response?.data?.data?.session;
      if (session?.access_token) {
        localStorage.setItem("token", session.access_token);
        setCookieValue(
          "ll_token",
          session.access_token,
          session.expires_in || 60 * 60,
        );
      }
      if (session?.refresh_token) {
        localStorage.setItem("refresh_token", session.refresh_token);
        setCookieValue("ll_refresh", session.refresh_token, 60 * 60 * 24 * 30);
      }

      return session || null;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      clearCookieValue("ll_token");
      clearCookieValue("ll_refresh");
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
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
      const token = getAuthToken();
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
  async (error) => {
    // Jika server merespon dengan 401 (Unauthorized),
    // biasanya kita ingin paksa user logout atau refresh token.
    if (
      error.response?.status === 401 &&
      !error.config?._retry &&
      !error.config?.url?.includes("/auth/refresh")
    ) {
      error.config._retry = true;
      const session = await refreshSession();
      if (session?.access_token) {
        error.config.headers = error.config.headers || {};
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return api(error.config);
      }
    }

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        console.warn("Sesi berakhir atau tidak valid. Mengarahkan ke Login...");
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        clearCookieValue("ll_token");
        clearCookieValue("ll_refresh");
        // window.location.href = "/auth/login"; // Opsional: Auto-redirect
      }
    }
    return Promise.reject(error);
  },
);

export default api;
