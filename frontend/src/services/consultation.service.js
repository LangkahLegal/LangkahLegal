import supabase from "@/lib/supabase";

export const consultationService = {
    
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
   * Mengupdate status (Khusus Konsultan)
   */
  updateStatus: async (id, newStatus) => {
    const { data, error } = await supabase
      .from("pengajuan_konsultasi") // <-- Ubah ke nama tabel asli
      .update({ status_pengajuan: newStatus })
      .eq("id_pengajuan", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
