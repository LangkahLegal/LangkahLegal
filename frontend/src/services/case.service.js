import api from "@/lib/axios";

export const caseService = {
  createCase: async (payload) => {
    const response = await api.post("/cases", payload);
    return response.data;
  },

  listOpenCases: async () => {
    const response = await api.get("/cases");
    return response.data.data;
  },

  sendBid: async (idBursa, payload) => {
    const response = await api.post(`/cases/${idBursa}/bids`, payload);
    return response.data;
  },

  acceptBid: async (idPenawaran) => {
    const response = await api.put(`/cases/bids/${idPenawaran}/accept`);
    return response.data;
  },

  listBids: async (idBursa) => {
    const response = await api.get(`/cases/${idBursa}/bids`);
    return response.data.data;
  },
};
