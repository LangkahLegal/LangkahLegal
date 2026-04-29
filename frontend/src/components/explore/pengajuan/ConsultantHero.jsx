"use client";

import { useState, useEffect } from "react";
import { MaterialIcon } from "@/components/ui/Icons";

export default function ConsultantHero({
  name = "User",
  specialization = "",
  rating = "0.0",
  avatar,
  portofolioUrl,
  linkedinUrl,
}) {
  const [currentTheme, setCurrentTheme] = useState("dark-tech");

  // --- 1. DETEKSI TEMA UNTUK FALLBACK AVATAR ---
  useEffect(() => {
    const detectTheme = () => {
      const htmlClasses = document.documentElement.classList;
      if (htmlClasses.contains("theme-white-modern"))
        return "theme-white-modern";
      if (htmlClasses.contains("theme-cyber-slate")) return "theme-cyber-slate";
      return "dark-tech";
    };
    setCurrentTheme(detectTheme());
  }, []);

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
        {/* REFACTOR: border-primary/10 */}
        <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border-[8px] border-primary/10 p-2 backdrop-blur-sm shadow-inner">
          {/* REFACTOR: border-primary */}
          <div className="w-full h-full rounded-full border-[3px] border-primary p-1.5 overflow-hidden">
            <img
              src={avatar || fallbackUrl}
              className="w-full h-full rounded-full object-cover shadow-2xl transition-transform duration-500 hover:scale-105"
              alt={safeName}
              onError={(e) => {
                e.currentTarget.src = fallbackUrl;
              }}
            />
          </div>
        </div>

        {/* Badge Verified - REFACTOR: border-bg & bg-primary */}
        <div className="absolute bottom-2 right-2 bg-primary text-white w-8 h-8 sm:w-11 sm:h-11 rounded-full border-[4px] border-bg flex items-center justify-center shadow-xl">
          <MaterialIcon name="verified" className="text-xs sm:text-lg" />
        </div>
      </div>

      {/* Name - REFACTOR: text-main */}
      <h1 className="text-xl sm:text-2xl font-extrabold text-main mb-2 leading-tight tracking-tight px-2 transition-colors duration-500">
        {safeName}
      </h1>

      <div className="flex items-center justify-center gap-3 flex-wrap px-4 mb-3">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <MaterialIcon name="star" className="text-amber-400 text-base" />
          {/* REFACTOR: text-main */}
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
