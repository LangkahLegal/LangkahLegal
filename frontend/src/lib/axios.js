import axios from "axios";

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

/**
 * Request Interceptor
 * Setiap kali Frontend mengirim request ke API,
 * fungsi ini akan mengecek apakah ada token di localStorage.
 * Jika ada, otomatis diselipkan ke Header Authorization: Bearer <token>
 */
api.interceptors.request.use(
  (config) => {
    // Pastikan kode berjalan di sisi client (browser)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
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
        // window.location.href = "/auth/login"; // Opsional: Auto-redirect
      }
    }
    return Promise.reject(error);
  },
);

export default api;
