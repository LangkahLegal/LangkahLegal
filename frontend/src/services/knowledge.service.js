import api from "@/lib/axios";

// Knowledge base untuk semua user yang login (bukan endpoint admin).
export const knowledgeService = {
  getPasal: async (idDokumen) => {
    const response = await api.get(`/knowledge/pasal/${idDokumen}`);
    return response.data;
  },
};
