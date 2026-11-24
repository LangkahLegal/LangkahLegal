import axios from "axios";
import { clearAuthSession, clearLegacyTokens, hasStoredSession, setAuthSession } from "@/lib/authStorage";
import { BACKEND_API_URL } from "@/lib/backendUrl";

// Di browser API dipanggil lewat domain frontend sendiri (rewrite di next.config.mjs),
// sehingga cookie sesi httpOnly dari backend menjadi cookie first-party.
const API_BASE_URL = typeof window === "undefined" ? BACKEND_API_URL : "/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
});

if (typeof window !== "undefined") {
  clearLegacyTokens();
}

let refreshPromise = null;

const refreshSession = async () => {
  if (typeof window === "undefined") return false;
  if (refreshPromise) return refreshPromise;
  if (!hasStoredSession()) return false;

  refreshPromise = (async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {});
      const session = response?.data?.data?.session || null;
      if (session) setAuthSession(session);
      return true;
    } catch (error) {
      const status = error?.response?.status;
      // Hanya bersihkan sesi jika server secara eksplisit menolak refresh token (400 atau 401).
      // Jangan logout otomatis pada error jaringan atau error 5xx dari server.
      if (status === 400 || status === 401) {
        clearAuthSession();
        if (!window.location.pathname.startsWith("/auth/")) {
          window.location.replace("/auth/login");
        }
      }
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

/**
 * Response Interceptor
 * Bila token akses kedaluwarsa (401), perbarui sesi sekali lalu ulangi permintaannya.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login-password")
    ) {
      originalRequest._retry = true;
      if (await refreshSession()) {
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        console.warn("Sesi berakhir atau tidak valid.");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
