import { MaterialIcon } from "@/components/ui";

export default function ConsultationCard({ data }) {
  const statusConfig = {
    pending: { label: "MENUNGGU KONFIRMASI", color: "bg-indigo-400", glow: "shadow-indigo-500/50" },
    menunggu_pembayaran: { label: "MENUNGGU PEMBAYARAN", color: "bg-amber-400", glow: "shadow-amber-500/50" },
    terjadwal: { label: "TERJADWAL", color: "bg-emerald-400", glow: "shadow-emerald-500/50" },
    selesai: { label: "SELESAI", color: "bg-slate-400", glow: "shadow-slate-500/50" },
    dibatalkan: { label: "DIBATALKAN", color: "bg-rose-400", glow: "shadow-rose-500/50" },
    ditolak: { label: "DITOLAK", color: "bg-rose-600", glow: "shadow-rose-700/50" },
  };

  const currentStatus = statusConfig[data?.status_pengajuan] || {
    label: "STATUS TIDAK DIKENAL", color: "bg-gray-500", glow: "",
  };

  const jadwal = data?.jadwal_ketersediaan;
  const konsultan = jadwal?.konsultan;

  return (
    <section className="glass-card bg-gradient-to-br from-primary/90 to-primary-light/30 border border-muted/30 p-6 rounded-[2rem] space-y-6 relative overflow-hidden">
      {/* Badge Status Dinamis */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-main/20 text-main font-semibold text-xs lg:text-xs uppercase tracking-widest transition-all">
          <div className={`w-2 h-2 rounded-full ${currentStatus.color} shadow-sm ${currentStatus.glow}`} />
          {currentStatus.label}
        </div>
        <button className="btn-icon hover:bg-white/10 p-1 rounded-full transition-colors">
          <MaterialIcon name="more_vert" className="text-main text-2xl" />
        </button>
      </div>

      <h2 className="text-xl font-headline font-bold text-main">
        Konsultasi Terdekat
      </h2>

      {/* Profil Konsultan */}
      <div className="bg-main/10 p-4 rounded-xl flex items-center gap-4 border border-white/5">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/20 border border-white/10">
          <img
            src={konsultan?.foto_profile || "/api/placeholder/48/48"}
            alt={konsultan?.nama_lengkap}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-0.5 flex-1">
          <p className="text-main font-headline font-semibold text-sm">
            {konsultan?.nama_lengkap || "Nama Konsultan"}
          </p>
          <p className="text-muted text-xs leading-relaxed">
            {konsultan?.spesialisasi || "Pakar Hukum"}
          </p>
        </div>
      </div>

      {/* Info Waktu */}
      <div className="flex items-center gap-2.5 text-muted text-xs bg-black/10 p-3 rounded-lg">
        <MaterialIcon name="calendar_today" className="text-xl text-primary-light" />
        <span className="font-medium">
          {jadwal?.tanggal
            ? `${jadwal.tanggal} | ${jadwal.jam_mulai} - ${jadwal.jam_selesai} WIB`
            : "Jadwal belum tersedia"}
        </span>
      </div>
    </section>
  );
}