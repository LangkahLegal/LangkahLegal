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

  getPendingRequests: async () => {
    const response = await api.get("/consultants/me/requests/pending");
    return response.data;
  },

  getActiveRequests: async () => {
    const response = await api.get("/consultants/me/requests/active");
    return response.data;
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
};