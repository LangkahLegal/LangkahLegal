import { useState } from "react";
import { MaterialIcon } from "@/components/ui";

export default function ConsultationCard({ data, onCancel, onHide }) {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = {
    pending: {
      label: "MENUNGGU KONFIRMASI",
      color: "bg-indigo-400",
      glow: "shadow-indigo-500/50",
    },
    menunggu_pembayaran: {
      label: "MENUNGGU PEMBAYARAN",
      color: "bg-amber-400",
      glow: "shadow-amber-500/50",
    },
    terjadwal: {
      label: "TERJADWAL",
      color: "bg-emerald-400",
      glow: "shadow-emerald-500/50",
    },
    selesai: {
      label: "SELESAI",
      color: "bg-slate-400",
      glow: "shadow-slate-500/50",
    },
    dibatalkan: {
      label: "DIBATALKAN",
      color: "bg-rose-400",
      glow: "shadow-rose-500/50",
    },
    ditolak: {
      label: "DITOLAK",
      color: "bg-rose-600",
      glow: "shadow-rose-700/50",
    },
  };

  const currentStatus = statusConfig[data?.status_pengajuan] || {
    label: "STATUS TIDAK DIKENAL",
    color: "bg-gray-500",
    glow: "",
  };

  // Logika: Tombol batal hanya muncul jika pending atau menunggu_pembayaran
  const canCancel = ["pending", "menunggu_pembayaran"].includes(
    data?.status_pengajuan,
  );

  const jadwal = data?.jadwal_ketersediaan;
  const konsultan = jadwal?.konsultan;

  return (
    <section className="glass-card bg-gradient-to-br from-primary/90 to-primary-light/30 border border-muted/30 p-6 rounded-[2rem] space-y-6 relative overflow-visible">
      <div className="flex justify-between items-center relative">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-main/20 text-main font-semibold text-xs uppercase tracking-widest transition-all">
          <div
            className={`w-2 h-2 rounded-full ${currentStatus.color} shadow-sm ${currentStatus.glow}`}
          />
          {currentStatus.label}
        </div>

        {/* Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`btn-icon hover:bg-white/10 p-1 rounded-full transition-colors ${showMenu ? "bg-white/10" : ""}`}
          >
            <MaterialIcon name="more_vert" className="text-main text-2xl" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-[#1f1d35] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden backdrop-blur-xl">
                {canCancel && (
                  <button
                    onClick={() => {
                      onCancel();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors border-b border-white/5"
                  >
                    <MaterialIcon name="cancel" className="text-lg" />
                    BATALKAN SESI
                  </button>
                )}
                <button
                  onClick={() => {
                    onHide();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-muted hover:bg-white/5 transition-colors"
                >
                  <MaterialIcon name="visibility_off" className="text-lg" />
                  HAPUS DARI UI
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <h2 className="text-xl font-headline font-bold text-main">
        Konsultasi Terdekat
      </h2>

      {/* Profil Konsultan */}
      <div className="bg-main/10 p-4 rounded-xl flex items-center gap-4 border border-white/5">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/20 border border-white/10">
          <img
            src={konsultan?.foto_profil || "/api/placeholder/48/48"}
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

      {/* Info Waktu - Format: Tanggal | HH:mm - HH:mm WIB */}
      <div className="flex items-center gap-2.5 text-muted text-xs bg-black/10 p-3 rounded-lg">
        <MaterialIcon
          name="calendar_today"
          className="text-xl text-primary-light"
        />
        <span className="font-medium">
          {jadwal?.tanggal
            ? `${jadwal.tanggal} | ${data.jam_mulai?.substring(0, 5)} - ${data.jam_selesai?.substring(0, 5)} WIB`
            : "Jadwal belum tersedia"}
        </span>
      </div>
    </section>
  );
}
