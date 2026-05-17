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

  // Konsultan: melihat semua kasus open di bursa
  listOpenCases: async () => {
    const response = await api.get("/cases/");
    return response.data.data;
  },

  // Konsultan: klaim langsung sebuah kasus
  claimCase: async (idBursa) => {
    const response = await api.post(`/cases/${idBursa}/claim`);
    return response.data;
  },
};
