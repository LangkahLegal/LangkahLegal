"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function VerificationCard({ item, onDetail, onReject }) {
  const isPending = item.status === "pending";

  const statusStyles = {
    pending: "bg-secondary-soft text-secondary-text",
    terverifikasi: "bg-success-soft text-success",
    ditolak: "bg-danger-soft text-danger",
  };

  const statusClasses = statusStyles[item.status] || "bg-surface text-muted";

  const subInfo = [
    item.spesialisasi || "Umum",
    item.kota_praktik,
    item.pengalaman_tahun ? `${item.pengalaman_tahun} tahun` : null
  ].filter(Boolean).join(" • ");

  return (
    <div
      className="group p-4 rounded-2xl border border-surface bg-card shadow-soft hover:border-primary/20 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full"
    >
      {/* HEADER SECTION */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">

          <div className="relative shrink-0">
            <div
              className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl overflow-hidden border-2 transition-colors ${isPending ? "border-primary/30" : "border-surface"
                }`}
            >
              <UserAvatar
                src={item.foto_profil}
                name={item.nama_lengkap || "User"}
                alt={item.nama_lengkap || "User"}
                size="md"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-bold text-sm lg:text-[15px] text-main group-hover:text-primary-light transition-colors truncate leading-tight">
              {item.nama_lengkap}
            </h3>

            <div className="flex flex-col mt-1">
              <p className="text-[10px] truncate font-medium uppercase tracking-wider text-muted/70 leading-relaxed">
                {subInfo}
              </p>

              {item.tarif_per_sesi && item.tarif_per_sesi > 0 ? (
                <p className="text-xs font-bold text-primary-light mt-0.5">
                  Rp {item.tarif_per_sesi.toLocaleString("id-ID")}
                </p>
              ) : (
                <p className="text-[10px] font-medium text-muted/50 italic mt-0.5">
                  Baru bergabung
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-md tracking-wider uppercase self-start mt-0.5 ${statusClasses}`}>
          {item.status}
        </span>
      </div>

      {/* FOOTER SECTION */}
      <div className="mt-4 pt-3 border-t border-surface flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-muted text-[9px] sm:text-[10px] font-medium">
          <MaterialIcon name="calendar_today" className="text-sm opacity-70" />
          <span className="truncate">
            {item.waktu_submit?.date || "—"} • {item.waktu_submit?.time || "—"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDetail?.(item);
            }}
            className="!p-0 !h-auto !bg-transparent text-[10px] sm:text-xs transition-all shrink-0 text-primary-light font-bold flex items-center gap-0.5 hover:gap-1"
          >
            <span className="hidden sm:inline">Lihat Detail</span>
            <MaterialIcon
              name="chevron_right"
              className="text-lg group-hover:translate-x-0.5 transition-transform"
            />
          </Button>
        </div>
      </div>
    </div>
  );
}