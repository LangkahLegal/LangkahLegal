import api from "@/lib/axios";

export const scheduleService = {
  // 1. Ambil jadwal milik saya (Konsultan)
  getSchedules: async () => {
    try {
      const response = await api.get("/consultants/me/schedules"); // TAMBAHKAN /me
      return response.data; 
    } catch (error) {
      console.error("Gagal mengambil jadwal:", error);
      throw error;
    }
  },

  // 2. Tambah jadwal baru
  addSchedule: async (payload) => {
    try {
      const response = await api.post("/consultants/schedules", payload);
      return response.data;
    } catch (error) {
      console.error("Gagal menambahkan jadwal:", error);
      throw error;
    }
  },

  // 3. Update Detail (Jam/Tanggal)
  updateSchedule: async (id_jadwal, payload) => {
    try {
      const response = await api.put(`/consultants/schedules/${id_jadwal}`, payload);
      return response.data;
    } catch (error) {
      console.error("Gagal memperbarui jadwal:", error);
      throw error;
    }
  },

  // 4. Update Status Per Slot (Tersedia/Tutup)
  toggleScheduleSlot: async (id_jadwal, status_tersedia) => {
    try {
      const response = await api.patch(`/consultants/schedules/${id_jadwal}/toggle`, {
        status_tersedia: status_tersedia
      });
      return response.data;
    } catch (error) {
      console.error("Gagal toggle status slot:", error);
      throw error;
    }
  },

  // 5. Delete Jadwal
  deleteSchedule: async (id_jadwal) => {
    try {
      const response = await api.delete(`/consultants/schedules/${id_jadwal}`);
      return response.data;
    } catch (error) {
      console.error("Gagal menghapus jadwal:", error);
      throw error;
    }
  },

  // 6. Toggle Global (Is Active)
  toggleGlobalActive: async (is_active) => {
    try {
      const response = await api.patch("/consultants/me/active-status", { is_active });
      return response.data;
    } catch (error) {
      console.error("Gagal mengubah status global:", error);
      throw error;
    }
  },
};