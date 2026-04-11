import api from "@/lib/axios";

// REVISI: Nama variabel disamakan dengan yang di-import Dashboard (consultationService)
export const consultationService = {
 
  getConsultantCatalog: async (spesialisasi = null) => {
    try {
      const params =
        spesialisasi && spesialisasi !== "semua" ? { spesialisasi } : {};
      const response = await api.get("/consultants", { params });
      return response.data.data;
    } catch (error) {
      console.error("Gagal memuat katalog:", error);
      throw error;
    }
  },

  getConsultations: async () => {
    const response = await api.get("/consultations/");
    return response.data.data;
  },

  createConsultation: async (payload) => {
    const response = await api.post("/consultations/", payload);
    return response.data;
  },

  getConsultationDetail: async (id) => {
    const response = await api.get(`/consultations/${id}`);
    return response.data.data;
  },

  respondToConsultation: async (id, statusPersetujuan) => {
    const response = await api.put(`/consultations/${id}/respond`, {
      status_persetujuan: statusPersetujuan,
    });
    return response.data;
  },

  rateConsultation: async (id, payload) => {
    const response = await api.post(`/consultations/${id}/rating`, payload);
    return response.data;
  },

  updateStatus: async (id, newStatus) => {
    const response = await api.put(`/consultations/${id}/status`, null, {
      params: { new_status: newStatus },
    });
    return response.data;
  },
};
