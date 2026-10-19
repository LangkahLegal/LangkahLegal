import api from "@/lib/axios";

export const consultantService = {
  getConsultantDetail: async (id) => {
    const response = await api.get(`/consultants/${id}`);
    return response.data.data;
  },

  getConsultantSchedules: async (id) => {
    const response = await api.get(`/consultants/${id}/schedules`);
    return response.data.data;
  },

  getMySchedules: async () => {
    const response = await api.get("/consultants/me/schedules");
    return response.data;
  },

  getPendingRequests: async () => {
    const response = await api.get("/consultants/me/requests/pending");
    return response.data;
  },

  // Filter, pencarian, dan urutan dikerjakan backend; nilai "semua" atau kosong tidak dikirim.
  getActiveRequests: async (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value && value !== "semua"),
    );
    const response = await api.get("/consultants/me/requests/active", { params });
    return response.data;
  },

  // Sesi terjadwal terdekat yang belum lewat (ditentukan backend, waktu WIB).
  getNextSession: async () => {
    const response = await api.get("/consultants/me/next-session");
    return response.data.data;
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get("/consultants/me/dashboard-stats");
      // Menghasilkan: { total_income, total_klien, total_klien_aktif }
      return response.data;
    } catch (error) {
      console.error("Gagal load statistik dashboard:", error);
      throw error;
    }
  },

  getClientList: async () => {
    try {
      const response = await api.get("/consultants/me/clients");
      return response.data;
    } catch (error) {
      console.error("Gagal load daftar klien:", error);
      throw error;
    }
  },

  getHistory: async () => {
    try {
      const response = await api.get("/consultants/me/history");
      return response.data;
    } catch (error) {
      console.error("Gagal load riwayat konsultan:", error);
      throw error;
    }
  },

  // Ambil slot waktu tersedia dari backend untuk tanggal & durasi tertentu.
  getAvailableSlots: async (idKonsultan, tanggal, durasi = 30) => {
    const response = await api.get(`/consultants/${idKonsultan}/available-slots`, {
      params: { tanggal, durasi },
    });
    return response.data;
  },
};
