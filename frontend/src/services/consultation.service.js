import supabase from "@/lib/supabase";
import api from "@/lib/axios";

// REVISI: Nama variabel disamakan dengan yang di-import Dashboard (consultationService)
export const consultationService = {
  /**
   * 1. DOMAIN: KATALOG (FastAPI via Axios)
   * Digunakan untuk halaman 'Cari Konsultan'
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

  /**
   * 2. DOMAIN: PENGAJUAN (Supabase SDK)
   * Digunakan untuk 'ConsultationCard' di Dashboard
   */
  getConsultations: async () => {
    const { data, error } = await supabase
      .from("pengajuan_konsultasi")
      .select(
        `
        id_pengajuan,
        status_pengajuan,
        deskripsi_kasus,
        created_at,
        jadwal_ketersediaan:id_jadwal (
          tanggal,
          jam_mulai,
          jam_selesai,
          konsultan:id_konsultan (
            nama_lengkap,
            spesialisasi,
            foto_profile
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching consultations:", error.message);
      throw error;
    }
    return data;
  },

  /**
   * Mengupdate status pengajuan
   */
  updateStatus: async (id, newStatus) => {
    const { data, error } = await supabase
      .from("pengajuan_konsultasi")
      .update({ status_pengajuan: newStatus })
      .eq("id_pengajuan", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
