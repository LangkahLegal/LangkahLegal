"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function ConsultantHero({
  name = "User",
  specialization = "",
  rating = "0.0",
  avatar,
  portofolioUrl,
  linkedinUrl,
  status_verifikasi,
}) {
  const safeName = name || "User";

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
            <UserAvatar
              src={avatar}
              name={safeName}
              alt={safeName}
              size="xl"
              textClassName="text-3xl sm:text-5xl"
              className="w-full h-full rounded-full object-cover shadow-2xl transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>

        {/* Badge Verified - REFACTOR: border-bg & bg-primary */}
        {status_verifikasi === "terverifikasi" && (
          <div className="absolute bottom-2 right-2 bg-primary text-on-primary w-8 h-8 sm:w-11 sm:h-11 rounded-full border-[4px] border-bg flex items-center justify-center shadow-xl">
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
          <span className="text-[10px] bg-success-soft text-success border border-success/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
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
          <MaterialIcon name="star" className="text-secondary text-base" />
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
