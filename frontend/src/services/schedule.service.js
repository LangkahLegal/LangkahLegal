import api from "@/lib/axios";

export const scheduleService = {
  // Ambil semua slot jadwal milik konsultan
  getMySchedules: async () => {
    const response = await api.get("/consultants/me/schedules");
    return response.data;
  },

  // Tambah slot baru
  addSchedule: async (payload) => {
    const response = await api.post("/consultants/schedules", payload);
    return response.data.data;
  },

  // Update jam/tanggal slot
  updateSchedule: async (id_jadwal, payload) => {
    const response = await api.put(
      `/consultants/schedules/${id_jadwal}`,
      payload,
    );
    return response.data.data;
  },

  // Hapus slot
  deleteSchedule: async (id_jadwal) => {
    const response = await api.delete(`/consultants/schedules/${id_jadwal}`);
    return response.data;
  },

  // Buka/Tutup slot tertentu
  toggleScheduleSlot: async (id_jadwal, status_tersedia) => {
    const response = await api.patch(
      `/consultants/schedules/${id_jadwal}/toggle`,
      {
        status_tersedia,
      },
    );
    return response.data;
  },

  // Status ketersediaan global konsultan (is_active)
  toggleGlobalActive: async (is_active) => {
    const response = await api.patch("/consultants/me/active-status", {
      is_active,
    });
    return response.data;
  },
};
