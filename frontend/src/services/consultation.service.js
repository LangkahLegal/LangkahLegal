import api from "@/lib/axios";

// REVISI: Nama variabel disamakan dengan yang di-import Dashboard (consultationService)
export const consultationService = {
  /**
   * Mengirim pengajuan konsultasi baru.
   * Mendukung upload file dokumen pendukung secara otomatis.
   * @param {Object} payload - Data pengajuan (id_jadwal, deskripsi, jam_mulai, jam_selesai, link_drive)
   * @param {File[]} files - Array of File objects (opsional)
   */

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

  createConsultation: async (payload, files = []) => {
    try {
      const formData = new FormData();

      // 1. Append Text Fields dari payload
      formData.append("id_jadwal", payload.id_jadwal);
      formData.append("deskripsi_kasus", payload.deskripsi_kasus);
      formData.append("jam_mulai", payload.jam_mulai);
      formData.append("jam_selesai", payload.jam_selesai);

      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      // 2. Append Multiple Files (jika ada)
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("dokumen_pendukung_files", file);
        });
      }

      // 3. Eksekusi Post
      // Axios akan otomatis mengatur 'Content-Type': 'multipart/form-data'
      const response = await api.post("/consultations/", formData);

      return response.data;
    } catch (error) {
      console.error("Gagal mengirim pengajuan konsultasi:", error);
      throw error;
    }
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

  getBookedSlots: async (id_konsultan) => {
    try {
      const response = await api.get(
        // Ubah dari 'consultants' menjadi 'consultations' agar sesuai prefix backend
        `/consultations/${id_konsultan}/booked-slots`,
      );
      return response.data.data;
    } catch (error) {
      console.error("Gagal mengambil data jadwal terisi:", error);
      throw error;
    }
  },

  // --- CRUD Dokumen Pendukung ---

  getDocuments: async (id_pengajuan) => {
    try {
      const response = await api.get(`/consultations/${id_pengajuan}/documents`);
      return response.data;
    } catch (error) {
      console.error("Gagal memuat dokumen:", error);
      throw error;
    }
  },

  uploadDocuments: async (id_pengajuan, files) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("dokumen_pendukung_files", file);
      });
      const response = await api.post(`/consultations/${id_pengajuan}/documents`, formData);
      return response.data;
    } catch (error) {
      console.error("Gagal upload dokumen:", error);
      throw error;
    }
  },

  deleteDocument: async (id_pengajuan, id_dokumen) => {
    try {
      const response = await api.delete(`/consultations/${id_pengajuan}/documents/${id_dokumen}`);
      return response.data;
    } catch (error) {
      console.error("Gagal hapus dokumen:", error);
      throw error;
    }
  },
};
