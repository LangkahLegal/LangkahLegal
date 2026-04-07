import api from "@/lib/axios";

export const userService = {
  getSettings: async () => {
    const res = await api.get("/users/me/settings");
    return res.data;
  },

  getFullProfile: async () => {
    const res = await api.get("/users/me/profile/full");
    return res.data;
  },

  updateProfile: async (payload) => {
    const res = await api.put("/users/me/profile/update", payload);
    return res.data;
  },
};