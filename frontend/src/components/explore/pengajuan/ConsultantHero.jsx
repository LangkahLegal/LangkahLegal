"use client";

import { MaterialIcon } from "@/components/ui/Icons";
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

export default function ConsultantHero({
  name = "User",
  specialization = "",
  rating = "0.0",
  avatar,
  portofolioUrl,
  linkedinUrl,
  status_verifikasi,
}) {
  const { theme } = useTheme();
  const currentTheme = theme || "dark-tech";

  const themeColors = {
    "dark-tech": { bg: "1f1d35", color: "ada3ff" },
    "theme-cyber-slate": { bg: "17203a", color: "29d1ff" },
    "theme-white-modern": { bg: "f3f1eb", color: "2d1e17" },
  };

  const activeColors = themeColors[currentTheme] || themeColors["dark-tech"];

  // Mencegah undefined pada pencetakan nama di URL
  const safeName = name || "User";
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName,
  )}&background=${activeColors.bg}&color=${activeColors.color}&size=256&bold=true`;
  const avatarSrc = getSafeAvatarSrc(avatar, fallbackUrl);

  // Memastikan URL diawali dengan protokol
  const handleOpenLink = (url) => {
    if (!url) return;
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    window.open(formattedUrl, "_blank");
  };

  return (
    <section className="relative flex flex-col items-center text-center w-full pt-4 font-primary transition-colors duration-500">
      {/* 1. Ambient Glow Background - REFACTOR: bg-primary */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 blur-[80px] -z-10 rounded-full transition-opacity duration-500" />

      {/* 2. Avatar Section */}
      <div className="relative mb-8 sm:mb-10 animate-fade-in">
        <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border-[8px] border-primary/10 p-2 backdrop-blur-sm shadow-inner">
          <div className="w-full h-full rounded-full border-[3px] border-primary p-1.5 overflow-hidden">
            <img
              src={avatarSrc}
              className="w-full h-full rounded-full object-cover shadow-2xl transition-transform duration-500 hover:scale-105"
              alt={safeName}
              onError={(e) => {
                e.currentTarget.src = fallbackUrl;
              }}
            />
          </div>
        </div>

        {/* Badge Verified - REFACTOR: border-bg & bg-primary */}
        {status_verifikasi === "terverifikasi" && (
          <div className="absolute bottom-2 right-2 bg-primary text-white w-8 h-8 sm:w-11 sm:h-11 rounded-full border-[4px] border-bg flex items-center justify-center shadow-xl">
            <MaterialIcon name="verified" className="text-xs sm:text-lg" title="Verified Consultant" />
          </div>
        )}
      </div>

      {/* Name - REFACTOR: text-main */}
      <div className="flex flex-col items-center gap-2 mb-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-main leading-tight tracking-tight px-2 transition-colors duration-500 flex items-center justify-center gap-2">
          {safeName}
        </h1>
        {status_verifikasi === "terverifikasi" ? (
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            ✅ Verified
          </span>
        ) : (
          <span className="text-[10px] bg-zinc-500/10 text-muted border border-surface px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Belum Verified
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap px-4 mb-3">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <MaterialIcon name="star" className="text-amber-400 text-base" />
          <span className="text-[10px] sm:text-xs font-bold text-main opacity-80">
            {rating || "0.0"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {/* Portofolio Button - REFACTOR: bg-card & border-surface */}
        <div
          onClick={() => portofolioUrl && handleOpenLink(portofolioUrl)}
          className={`bg-card/50 hover:bg-card px-4 py-1.5 rounded-full border border-surface flex items-center gap-1.5 cursor-pointer transition-all ${
            !portofolioUrl && "opacity-30 cursor-not-allowed"
          }`}
        >
          <MaterialIcon name="description" className="text-xs text-muted" />
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted">
            portofolio
          </span>
        </div>

        {/* LinkedIn Button - REFACTOR: bg-card & border-surface */}
        <div
          onClick={() => linkedinUrl && handleOpenLink(linkedinUrl)}
          className={`bg-card/50 hover:bg-card px-4 py-1.5 rounded-full border border-surface flex items-center gap-1.5 cursor-pointer transition-all ${
            !linkedinUrl && "opacity-30 cursor-not-allowed"
          }`}
        >
          <MaterialIcon name="language" className="text-xs text-muted" />
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted">
            LINKEDIN
          </span>
        </div>
      </div>
    </section>
  );
}
