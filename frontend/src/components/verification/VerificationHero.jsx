"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import { useTheme } from "@/providers/ThemeProvider";

export default function VerificationHero({
  name = "User",
  avatar,
  rating = "0.0",
  portofolioUrl,
  linkedinUrl,
  status,
  isActive,
  bio,
}) {
  const { theme } = useTheme();
  const currentTheme = theme || "dark-tech";

  const themeColors = {
    "dark-tech": { bg: "1f1d35", color: "ada3ff" },
    "theme-cyber-slate": { bg: "17203a", color: "29d1ff" },
    "theme-white-modern": { bg: "f3f1eb", color: "2d1e17" },
  };

  const activeColors = themeColors[currentTheme] || themeColors["dark-tech"];
  const safeName = name || "User";
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName,
  )}&background=${activeColors.bg}&color=${activeColors.color}&size=256&bold=true`;

  const handleOpenLink = (url) => {
    if (!url) return;
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    window.open(formattedUrl, "_blank");
  };

  return (
    <section className="relative w-full pt-2 pb-2 font-primary transition-colors duration-500 bg-transparent">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 blur-[80px] -z-10 rounded-full transition-opacity duration-500" />

      <div className="flex flex-row gap-4 sm:gap-6 md:gap-10 items-start relative z-10 w-full">
        
        {/* LEFT COLUMN: Avatar, Rating, Active Status */}
        <div className="flex flex-col items-center gap-3 md:gap-4 shrink-0 w-[80px] sm:w-[140px] md:w-[180px]">
          <div className="relative animate-fade-in">
            <div className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-[4px] sm:border-[6px] md:border-[8px] border-primary/10 p-1 sm:p-1.5 md:p-2 backdrop-blur-sm shadow-inner">
              <div className="w-full h-full rounded-full border-2 sm:border-[3px] border-primary p-0.5 sm:p-1 md:p-1.5 overflow-hidden">
                <img
                  src={avatar || fallbackUrl}
                  className="w-full h-full rounded-full object-cover shadow-2xl transition-transform duration-500 hover:scale-105"
                  alt={safeName}
                  onError={(e) => {
                    if (e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                    }
                  }}
                />
              </div>
            </div>

            {/* Only show badge if verified */}
            {status === "terverifikasi" && (
              <div className="absolute bottom-0 right-0 md:bottom-2 md:right-2 bg-primary text-white w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border-2 md:border-[4px] border-bg flex items-center justify-center shadow-xl">
                <MaterialIcon name="verified" className="text-[10px] sm:text-sm md:text-base" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 md:gap-2 w-full items-center">
            <div className="flex items-center gap-0.5 sm:gap-1 bg-surface/50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-surface w-fit">
              <MaterialIcon name="star" className="text-amber-400 text-[10px] sm:text-sm" />
              <span className="text-[9px] sm:text-xs font-bold text-main opacity-80">
                {rating || "0.0"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Info, Bio, Actions */}
        <div className="flex flex-col flex-1 min-w-0 w-full text-left gap-2 sm:gap-3 md:gap-4 md:py-2">
          
          <div>
            <h1 className="text-lg sm:text-xl md:text-3xl font-extrabold text-main mb-1.5 sm:mb-2 leading-tight tracking-tight transition-colors duration-500 truncate">
              {safeName}
            </h1>
            
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {status && (
                <span
                  className={`inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider
                    ${
                      status === "terverifikasi"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : status === "pending"
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-danger/10 text-danger border border-danger/20"
                    }`}
                >
                  Status: {status}
                </span>
              )}

              {isActive !== undefined && (
                <span
                  className={`inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider
                    ${
                      isActive
                        ? "bg-primary/10 text-primary-light border border-primary/20"
                        : "bg-muted/10 text-muted border border-surface"
                    }`}
                >
                  {isActive ? "Aktif" : "Nonaktif"}
                </span>
              )}
            </div>
          </div>

          <p className="text-[10px] sm:text-xs md:text-base font-medium text-muted/80 max-w-xl italic leading-relaxed line-clamp-3">
            {bio ? `"${bio}"` : "-"}
          </p>

          <div className="flex items-center justify-start gap-1 sm:gap-2 md:gap-3 mt-auto pt-2 sm:pt-3 md:pt-4 border-t border-surface flex-nowrap overflow-x-auto no-scrollbar">
            <div
              onClick={() => portofolioUrl && handleOpenLink(portofolioUrl)}
              className={`bg-surface/50 hover:bg-surface px-2 py-1 sm:px-3 sm:py-1.5 md:px-5 md:py-2 rounded-full border border-surface flex items-center gap-1 sm:gap-1.5 md:gap-2 cursor-pointer transition-all shrink-0 ${
                !portofolioUrl && "opacity-30 cursor-not-allowed"
              }`}
            >
              <MaterialIcon name="description" className="text-[10px] sm:text-xs md:text-sm text-muted" />
              <span className="text-[8px] sm:text-[9px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest text-muted">
                Portofolio
              </span>
            </div>

            <div
              onClick={() => linkedinUrl && handleOpenLink(linkedinUrl)}
              className={`bg-surface/50 hover:bg-surface px-2 py-1 sm:px-3 sm:py-1.5 md:px-5 md:py-2 rounded-full border border-surface flex items-center gap-1 sm:gap-1.5 md:gap-2 cursor-pointer transition-all shrink-0 ${
                !linkedinUrl && "opacity-30 cursor-not-allowed"
              }`}
            >
              <MaterialIcon name="language" className="text-[10px] sm:text-xs md:text-sm text-muted" />
              <span className="text-[8px] sm:text-[9px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest text-muted">
                LinkedIn
              </span>
            </div>
          </div>
          
        </div>

      </div>
    </section>
  );
}
