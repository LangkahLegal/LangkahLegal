"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

export default function ConsultationCard({
  data,
  onCancel,
  onHide,
  role = "client",
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("dark-tech");
  const router = useRouter();

  // --- 1. THEME DETECTION FOR FALLBACK URL ---
  useEffect(() => {
    const detectTheme = () => {
      const htmlClasses = document.documentElement.classList;
      if (htmlClasses.contains("theme-white-modern"))
        return "theme-white-modern";
      return "dark-tech";
    };
    setCurrentTheme(detectTheme());
  }, []);

  const themeColors = {
    "dark-tech": { bg: "1f1d35", color: "ada3ff" },
    "theme-white-modern": { bg: "f3f1eb", color: "2d1e17" },
  };

  const activeColors = themeColors[currentTheme] || themeColors["dark-tech"];

  // --- 2. HELPERS & CONFIG ---
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString.split("T")[0]);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return null;
    }
  };

  const statusConfig = {
    pending: { label: "Pending", color: "bg-primary/10 text-primary-light" },
    menunggu_pembayaran: {
      label: "Menunggu Pembayaran",
      color: "bg-amber-500/10 text-amber-500", // Disesuaikan sedikit agar lebih kontras di light mode
    },
    terjadwal: {
      label: "Terjadwal",
      color: "bg-emerald-500/10 text-emerald-600", // Disesuaikan sedikit agar lebih kontras di light mode
    },
    selesai: { label: "Selesai", color: "bg-muted/10 text-muted" },
    dibatalkan: { label: "Batal", color: "bg-danger/10 text-danger" },
    ditolak: { label: "Ditolak", color: "bg-danger/20 text-danger" },
  };

  const currentStatus = statusConfig[data?.status_pengajuan] || {
    label: "Unknown",
    color: "bg-muted/10 text-muted",
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
  const displayName = konsultan?.nama_lengkap || "User";

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName,
  )}&background=${activeColors.bg}&color=${activeColors.color}&size=128&bold=true`;

  const handleMainAction = () => {
    const status = data?.status_pengajuan;
    const id = data?.id_pengajuan;
    if (!id) return;

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
      className={`group p-4 sm:p-5 rounded-[2rem] border transition-all duration-500 relative overflow-visible ${
        isActive
          ? "bg-primary/5 border-primary/20 shadow-soft"
          : "bg-card border-surface hover:border-primary/20"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar Section */}
        <div className="relative shrink-0">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 transition-colors ${
              isActive ? "border-primary/30" : "border-surface"
            }`}
          >
            <img
              src={konsultan?.foto_profil || fallbackUrl}
              alt={displayName}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.src = fallbackUrl;
              }}
            />
          </div>
          {isActive && data?.status_pengajuan === "terjadwal" && (
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-bg rounded-full animate-pulse" />
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col gap-2 truncate">
              <h3 className="font-headline font-bold text-sm sm:text-base text-main group-hover:text-primary-light transition-colors truncate">
                {displayName}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${currentStatus.color}`}
                >
                  {currentStatus.label}
                </span>
              </div>
            </div>

            {/* Menu Dropdown */}
            <div className="relative">
              <Button
                variant="icon"
                onClick={() => setShowMenu(!showMenu)}
                className="!p-1 !bg-transparent hover:!bg-surface"
              >
                <MaterialIcon
                  name="more_vert"
                  className="text-xl text-muted group-hover:text-main"
                />
              </Button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-dropdown border border-surface rounded-2xl shadow-soft z-20 overflow-hidden animate-fade-in backdrop-blur-xl">
                    {canCancel && (
                      <button
                        onClick={() => {
                          onCancel?.();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-danger hover:bg-danger/10 border-b border-surface"
                      >
                        <MaterialIcon name="cancel" className="text-lg" />
                        BATALKAN
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onHide?.();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-muted hover:bg-surface"
                    >
                      <MaterialIcon name="visibility_off" className="text-lg" />
                      HAPUS
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-6 pt-4 border-t border-surface flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-muted text-[10px] sm:text-xs font-semibold">
          <MaterialIcon name="calendar_today" className="text-sm opacity-70" />
          <span className="truncate">
            {jadwal?.tanggal
              ? `${formatDate(jadwal.tanggal)} • ${data?.jam_mulai?.substring(0, 5)} - ${data?.jam_selesai?.substring(0, 5)}`
              : "Jadwal belum tersedia"}
          </span>
        </div>

        <Button
          variant="ghost"
          onClick={handleMainAction}
          className={`!p-0 !h-auto !bg-transparent !text-xs sm:!text-sm hover:gap-3 transition-all ${
            isActive || isWaitingPayment
              ? "text-primary-light"
              : "text-muted hover:text-primary-light"
          }`}
        >
          <span className="hidden sm:inline">
            {isWaitingPayment ? "Lanjut Pembayaran" : "Lihat Detail"}
          </span>
          <MaterialIcon name="chevron_right" className="text-xl" />
        </Button>
      </div>
    </div>
  );
}
