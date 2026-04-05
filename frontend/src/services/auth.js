// src/services/auth.js

// Sesuaikan dengan URL dan prefix dari backend
const BASE_URL = "http://localhost:8000/api/v1/auth";

export const authService = {
  // Fungsi Login
  login: async (email, password) => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Gagal melakukan login");
    }
    return response.json();
  },

  // Fungsi Register Client
  registerClient: async (data) => {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: data.name, 
        email: data.email,
        password: data.password,
        role: "client"
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Gagal mendaftar sebagai client");
    }
    return response.json();
  },

  // Fungsi Register Konsultan
  registerConsultant: async (data) => {
    const response = await fetch(`${BASE_URL}/consultant/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: data.name,
        email: data.email,
        password: data.password,
        kota_praktik: data.city,
        // array ["Pidana", "Perdata"] jadi string "Pidana, Perdata"
        spesialisasi: data.specialization.join(", "), 
        // string angka jadi Integer murni sesuai permintaan database
        pengalaman_tahun: parseInt(data.experience), 
        tarif_per_sesi: parseInt(data.rate) 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Gagal mendaftar sebagai konsultan");
    }
    return response.json();
  }
};