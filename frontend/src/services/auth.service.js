import api from "@/lib/axios";

export const authService = {

  register: async (userData) => {
    const payload = {
      nama: userData.name,
      email: userData.email,
      password: userData.password,
      role: "client", 
    };

    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  // ... fungsi login nanti di sini ...
};
