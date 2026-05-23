import axios from "axios";

/**
 * Konfigurasi Dasar Axios
 * Mengambil base URL dari environment variable (.env.local)
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise = null;

const refreshSession = async () => {
  if (typeof window === "undefined") return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // Backend akan otomatis membaca ll_refresh dari cookie
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { 
          withCredentials: true,
          headers: { "Content-Type": "application/json" } 
        },
      );

      return response?.data?.data?.session || null;
    } catch {
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
 * Karena kita menggunakan BFF pattern dengan HttpOnly cookies, 
 * kita tidak perlu lagi menyisipkan Authorization header.
 * Axios akan otomatis mengirim cookie ll_token karena withCredentials: true.
 */
api.interceptors.request.use(
  async (config) => {
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
    if (
      error.response?.status === 401 &&
      !error.config?._retry &&
      !error.config?.url?.includes("/auth/refresh")
    ) {
      error.config._retry = true;
      const session = await refreshSession();
      if (session) {
        // Karena cookies otomatis dikirim, kita cukup retry requestnya
        return api(error.config);
      }
    }

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        console.warn("Sesi berakhir atau tidak valid.");
        // Anda bisa tambahkan logic auto-redirect ke /auth/login di sini jika diperlukan
      }
    }
    return Promise.reject(error);
  },
);

export default api;
