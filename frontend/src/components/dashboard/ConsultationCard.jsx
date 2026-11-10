"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function ConsultationCard({
  data,
  onCancel,
  onHide,
  role = "client",
}) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

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
    pending: {
      label: "Pending",
      color: "bg-primary-soft text-primary-text",
    },
    berlangsung: {
      label: "Berlangsung",
      color: "bg-primary-soft text-primary-text",
    },
    menunggu_pembayaran: {
      label: "Menunggu Pembayaran",
      color: "bg-secondary-soft text-secondary-text",
    },
    terjadwal: {
      label: "Terjadwal",
      color: "bg-info-soft text-info-text",
    },
    selesai: {
      label: "Selesai",
      color: "bg-success-soft text-success",
    },
    dibatalkan: {
      label: "Batal",
      color: "bg-danger-soft text-danger",
    },
    ditolak: {
      label: "Ditolak",
      color: "bg-danger-soft text-danger border border-danger/20",
    },
  };

  const currentStatus = statusConfig[data?.status_pengajuan] || {
    label: "Unknown",
    color: "bg-surface text-muted",
  };

  const isWaitingPayment =
    role === "client" && data?.status_pengajuan === "menunggu_pembayaran";
  const isActive = [
    "pending",
    "berlangsung",
    "terjadwal",
    "menunggu_pembayaran",
  ].includes(data?.status_pengajuan);
  const canCancel =
    role === "client" &&
    ["pending", "menunggu_pembayaran"].includes(data?.status_pengajuan);

  const jadwal = data?.jadwal_ketersediaan;
  const konsultan = jadwal?.konsultan;
  const displayName =
    konsultan?.nama_lengkap ||
    data?.konsultan?.nama_lengkap ||
    data?.users?.nama ||
    "User";
  const isBursaClaim = !!data?.id_bursa;
  // Tanggal bisa dari jadwal_ketersediaan ATAU langsung dari tanggal_pengajuan
  const tanggalDisplay = jadwal?.tanggal || data?.tanggal_pengajuan;

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
      className="group p-4 rounded-2xl border border-surface bg-card shadow-soft hover:border-primary/20 transition-all duration-500 relative overflow-visible flex flex-col justify-between h-full"
    >
      <div className="flex items-start gap-3">
        {/* Avatar Section */}
        <div className="relative shrink-0">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 transition-colors ${
              isActive ? "border-primary/30" : "border-surface"
            }`}
          >
            <UserAvatar
              src={konsultan?.foto_profil}
              name={displayName}
              alt={displayName}
              size="md"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
          {isActive && data?.status_pengajuan === "terjadwal" && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-info border-2 border-bg rounded-full animate-pulse" />
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col gap-1.5 truncate">
              <h3 className="font-headline font-bold text-sm sm:text-[15px] text-main group-hover:text-primary-light transition-colors truncate">
                {displayName}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${currentStatus.color}`}
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
      <div className="mt-3 pt-2.5 border-t border-surface flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 text-muted text-[11px] sm:text-xs font-semibold">
          <MaterialIcon name="calendar_today" className="text-sm opacity-70" />
          <span className="truncate">
            {tanggalDisplay
              ? `${formatDate(tanggalDisplay)} • ${data?.jam_mulai?.substring(0, 5)} - ${data?.jam_selesai?.substring(0, 5)}`
              : isBursaClaim
                ? "Dari Bursa Kasus — menunggu penjadwalan"
                : "Jadwal belum tersedia"}
          </span>
        </div>

        <Button
          variant="ghost"
          onClick={handleMainAction}
          className={`!p-0 !h-auto !bg-transparent !text-xs hover:gap-2 transition-all ${
            isActive || isWaitingPayment
              ? "text-primary-light"
              : "text-muted hover:text-primary-light"
          }`}
        >
          <span className="hidden sm:inline">
            {isWaitingPayment ? "Lanjut Pembayaran" : "Lihat Detail"}
          </span>
          <MaterialIcon name="chevron_right" className="text-lg" />
        </Button>
      </div>
    </div>
  );
}
