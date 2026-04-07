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

  getDashboardStats: async () => {
    const response = await api.get("/consultants/me/dashboard-stats");
    return response.data;
  },

  getPendingRequests: async () => {
    const response = await api.get("/consultants/me/requests/pending");
    return response.data;
  },

  getActiveRequests: async () => {
    const response = await api.get("/consultants/me/requests/active");
    return response.data;
  },
};
