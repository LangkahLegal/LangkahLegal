import api from "@/lib/axios";

export const caseService = {
  // Client: posting kasus anonim ke bursa (dengan file upload)
  createCase: async (payload, files = []) => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    files?.forEach((file) => {
      formData.append("dokumen_pendukung_files", file);
    });

    const { data } = await api.post("/cases/", formData);
    return data;
  },

  // Konsultan: melihat kasus open di bursa. Filter, pencarian, dan urutan dikerjakan backend;
  // nilai "semua" atau kosong tidak dikirim.
  listOpenCases: async (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value && value !== "semua"),
    );
    const response = await api.get("/cases/", { params });
    return { data: response.data.data, total: response.data.total };
  },

  // Konsultan: klaim langsung sebuah kasus
  claimCase: async (idBursa) => {
    const response = await api.post(`/cases/${idBursa}/claim`);
    return response.data;
  },
};
