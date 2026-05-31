"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/providers/ThemeProvider";

const getSafeAvatarSrc = (url, fallbackUrl) => {
  if (!url) return fallbackUrl;

  try {
    const parsed = new URL(url);
    const safeHosts = new Set([
      "ui-avatars.com",
      "lh3.googleusercontent.com",
      "images.unsplash.com",
      "supabase.co",
      "*.supabase.co",
      "storage.googleapis.com",
      "res.cloudinary.com",
    ]);

    if (parsed.hostname === "i.ibb.co" || parsed.hostname.endsWith(".ibb.co")) {
      return fallbackUrl;
    }

    const isSafeHost =
      safeHosts.has(parsed.hostname) ||
      parsed.hostname.endsWith(".supabase.co");

    return parsed.protocol === "https:" && isSafeHost ? url : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
};

export default function VerificationCard({ item, onDetail, onReject }) {
  const { theme } = useTheme();
  const currentTheme = theme || "dark-tech";

  const themeColors = {
    "dark-tech": { bg: "1f1d35", color: "ada3ff" },
    "theme-white-modern": { bg: "f3f1eb", color: "2d1e17" },
  };

  const activeColors = themeColors[currentTheme] || themeColors["dark-tech"];

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    item.nama_lengkap || "User",
  )}&background=${activeColors.bg}&color=${activeColors.color}&size=128&bold=true`;
  const avatarSrc = getSafeAvatarSrc(item.foto_profil, fallbackUrl);

  const isPending = item.status === "pending";

  const statusStyles = {
    pending: "bg-primary/10 text-primary-light",
    terverifikasi: "bg-emerald-500/10 text-emerald-500",
    ditolak: "bg-danger/10 text-danger",
  };

  const statusClasses = statusStyles[item.status] || "bg-surface text-muted";

  const getInitial = (name) => {
    if (!name) return "";
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  };

  const subInfo = [
    item.spesialisasi || "Umum",
    item.kota_praktik,
    item.pengalaman_tahun ? `${item.pengalaman_tahun} tahun` : null
  ].filter(Boolean).join(" • ");

  return (
    <div
      className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${isPending
          ? "bg-primary/5 border-primary/20 shadow-soft"
          : "bg-card border-surface hover:border-primary/20"
        }`}
    >
      {/* HEADER SECTION */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">

          <div className="relative shrink-0">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 transition-colors ${isPending ? "border-primary/30" : "border-surface"
                }`}
            >
              <img
                src={avatarSrc}
                alt={item.nama_lengkap}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  if (e.currentTarget.src !== fallbackUrl) {
                    e.currentTarget.src = fallbackUrl;
                  }
                }}
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-bold text-sm sm:text-base lg:text-lg text-main group-hover:text-primary-light transition-colors truncate leading-tight">
              {item.nama_lengkap}
            </h3>

            <div className="flex flex-col mt-1">
              <p className="text-[9px] sm:text-[10px] truncate font-medium uppercase tracking-wider text-muted/70 leading-relaxed">
                {subInfo}
              </p>

              {item.tarif_per_sesi && item.tarif_per_sesi > 0 ? (
                <p className="text-[10px] sm:text-xs font-bold text-primary-light mt-0.5">
                  Rp {item.tarif_per_sesi.toLocaleString("id-ID")}
                </p>
              ) : (
                <p className="text-[9px] sm:text-[10px] font-medium text-muted/50 italic mt-0.5">
                  Baru bergabung
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`shrink-0 text-[8px] font-black px-2 py-1 rounded-lg tracking-widest uppercase self-start mt-0.5 ${statusClasses}`}>
          {item.status}
        </span>
      </div>

      {/* FOOTER SECTION */}
      <div className="mt-5 pt-4 border-t border-surface flex justify-between items-center">
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