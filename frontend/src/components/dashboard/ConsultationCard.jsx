"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/Icons";

export default function ConsultationCard({
  data,
  onCancel,
  onHide,
  role = "client",
}) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const dateOnly = dateString.split("T")[0];
    const date = new Date(dateOnly);

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusConfig = {
    pending: { label: "Pending", color: "bg-indigo-500/20 text-indigo-300" },
    menunggu_pembayaran: {
      label: "Menunggu Pembayaran",
      color: "bg-amber-500/20 text-amber-300",
    },
    terjadwal: {
      label: "Terjadwal",
      color: "bg-emerald-500/20 text-emerald-300",
    },
    selesai: { label: "Selesai", color: "bg-slate-500/20 text-slate-300" },
    dibatalkan: { label: "Batal", color: "bg-rose-500/20 text-rose-300" },
    ditolak: { label: "Ditolak", color: "bg-rose-700/20 text-rose-400" },
  };

  const currentStatus = statusConfig[data?.status_pengajuan] || {
    label: "Unknown",
    color: "bg-gray-500/20 text-gray-300",
  };

  const isWaitingPayment =
    role === "client" && data?.status_pengajuan === "menunggu_pembayaran";

  const isActive = ["pending", "terjadwal", "menunggu_pembayaran"].includes(
    data?.status_pengajuan,
  );

  const canCancel =
    role === "client" &&
    ["pending", "menunggu_pembayaran"].includes(data?.status_pengajuan);

  const jadwal = data?.jadwal_ketersediaan;
  const konsultan = jadwal?.konsultan;

  // --- LOGIC FALLBACK AVATAR ---
  const displayName = konsultan?.nama_lengkap || "User";
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName,
  )}&background=1f1d35&color=ada3ff&size=128`;

  const handleMainAction = () => {
    const status = data?.status_pengajuan;
    const id = data.id_pengajuan;

    if (role === "konsultan" && status === "pending") {
      router.push(`/request/${id}`);
    } else if (role === "client" && status === "menunggu_pembayaran") {
      router.push(`/payment/${id}`);
    } else {
      router.push(`/consultation/${id}`);
    }
  };

  return (
    <div
      className={`group p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 relative overflow-visible ${
        isActive
          ? "bg-[#6f59fe]/10 border-[#6f59fe]/30 shadow-[0_10px_30px_rgba(111,89,254,0.1)]"
          : "bg-[#1f1d35]/50 border-white/5 hover:border-[#6f59fe]/20"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden border-2 ${
              isActive ? "border-[#797498]/30" : "border-white/10"
            }`}
          >
            {/* IMPLEMENTASI LOGIC FOTO PROFIL */}
            <img
              src={konsultan?.foto_profil || fallbackUrl}
              alt={displayName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.target.src = fallbackUrl;
              }}
            />
          </div>
          {isActive && data?.status_pengajuan === "terjadwal" && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0e0c1e] rounded-full animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col gap-2 truncate">
              <h3 className="font-bold text-sm sm:text-base text-[#e8e2fc] group-hover:text-white transition-colors truncate leading-tight">
                {displayName}
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${currentStatus.color}`}
                >
                  {currentStatus.label}
                </span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <MaterialIcon
                  name="more_vert"
                  className="text-lg text-[#aca8c1]"
                />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-40 bg-[#1f1d35] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden backdrop-blur-xl">
                    {canCancel && (
                      <button
                        onClick={() => {
                          onCancel();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[10px] font-bold text-rose-400 hover:bg-rose-500/10 border-b border-white/5"
                      >
                        <MaterialIcon name="cancel" className="text-sm" />
                        BATALKAN
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onHide();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[10px] font-bold text-[#aca8c1] hover:bg-white/5"
                    >
                      <MaterialIcon name="visibility_off" className="text-sm" />
                      HAPUS
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 sm:mt-6 pt-4 border-t border-white/5 flex justify-between items-center gap-2">
        <div className="flex items-center gap-1.5 text-[#aca8c1] text-[10px] sm:text-xs font-medium">
          <MaterialIcon
            name="calendar_today"
            className="text-xs sm:text-sm text-[#bab7c7]"
          />
          <span className="truncate">
            {jadwal?.tanggal
              ? `${formatDate(jadwal.tanggal)} • ${data.jam_mulai?.substring(0, 5)} - ${data.jam_selesai?.substring(0, 5)}`
              : "Jadwal belum tersedia"}
          </span>
        </div>

        <button
          onClick={handleMainAction}
          className={`flex items-center gap-0.5 sm:gap-1 font-bold text-[11px] sm:text-sm transition-all shrink-0 w-fit ${
            isActive || isWaitingPayment
              ? "text-[#ada3ff]"
              : "text-[#aca8c1] hover:text-[#ada3ff]"
          }`}
        >
          <span className="hidden sm:inline">
            {isWaitingPayment ? "Lanjut Pembayaran" : "Lihat Detail"}
          </span>
          <MaterialIcon name="chevron_right" className="text-lg sm:text-xl" />
        </button>
      </div>
    </div>
  );
}
