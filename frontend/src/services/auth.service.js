import api from "@/lib/axios";
import { jwtDecode } from "jwt-decode";

export const authService = {
  register: async (userData) => {
    const payload = {
      nama: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role || "client",
    };

    const { data } = await api.post("/auth/register", payload);
    return data;
  },

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });

    localStorage.setItem("token", data.access_token);
    const decoded = jwtDecode(data.access_token);

    return {
      success: true,
      role: decoded.role || "client",
    };
  },

  logout: () => {
    localStorage.removeItem("token");
    window.location.href = "/auth/login";
  },
};
