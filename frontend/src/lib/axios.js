import axios from "axios";
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  setAuthSession,
} from "@/lib/authStorage";

/**
 * Konfigurasi Dasar Axios
 * Mengambil base URL dari environment variable (.env.local)
 */
const normalizeApiBaseUrl = (rawUrl) => {
  if (!rawUrl) {
    // Gunakan backend localhost jika berjalan di development environment
    const isDevNode = process.env.NODE_ENV === "development";
    const isDevBrowser = typeof window !== "undefined" && 
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      
    if (isDevNode || isDevBrowser) {
      return "http://localhost:8000/api/v1";
    }
    return "https://langkahlegal-production.up.railway.app/api/v1";
  }

  try {
    const parsed = new URL(rawUrl);
    const isLocalhost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    if (!isLocalhost && parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    if (typeof rawUrl === "string" && rawUrl.includes("up.railway.app")) {
      return rawUrl.startsWith("http://")
        ? rawUrl.replace(/^http:\/\//, "https://")
        : rawUrl;
    }

    return rawUrl;
  }
};

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

let refreshPromise = null;

const refreshSession = async () => {
  if (typeof window === "undefined") return null;
  if (refreshPromise) return refreshPromise;

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        {
          withCredentials: false,
          headers: { "Content-Type": "application/json" },
        },
      );

      const session = response?.data?.data?.session || null;
      if (session) {
        setAuthSession(session);
      }

      return session;
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
 * Token disimpan di browser storage dan dikirim via Authorization header.
 */
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      const accessToken = getStoredAccessToken();
      if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor
 * Menangani error secara terpusat, misalnya jika token kadaluwarsa (401)
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
      const session = await refreshSession();
      if (session?.access_token) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        if (typeof originalRequest.headers.set === "function") {
          originalRequest.headers.set(
            "Authorization",
            `Bearer ${session.access_token}`,
          );
        }
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
