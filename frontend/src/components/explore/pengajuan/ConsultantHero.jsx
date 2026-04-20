"use client";

import { MaterialIcon } from "@/components/ui/Icons";

export default function ConsultantHero({
  name,
  specialization,
  rating,
  avatar,
  portofolioUrl,
  linkedinUrl,
}) {
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User",
  )}&background=1f1d35&color=ada3ff&size=256`;

  // Memastikan URL diawali dengan protokol
  const handleOpenLink = (url) => {
    if (!url) return alert("Tautan tidak tersedia");
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    window.open(formattedUrl, "_blank");
  };

  return (
    <section className="relative flex flex-col items-center text-center w-full pt-4 font-['Inter',sans-serif]">
      {/* 1. Ambient Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#6f59fe]/20 blur-[80px] -z-10 rounded-full" />

      {/* 2. Avatar Section - Diperbesar */}
      <div className="relative mb-8 sm:mb-10">
        <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border-[8px] border-[#6f59fe]/10 p-2 backdrop-blur-sm shadow-inner">
          <div className="w-full h-full rounded-full border-[3px] border-[#6f59fe] p-1.5 overflow-hidden">
            <img
              src={avatar || fallbackUrl} // Gunakan fallback jika avatar null/undefined
              className="w-full h-full rounded-full object-cover shadow-2xl transition-transform duration-500 hover:scale-105"
              alt={name}
              onError={(e) => {
                // Gunakan fallback jika link gambar rusak (404)
                e.target.src = fallbackUrl;
              }}
            />
          </div>
        </div>

        {/* Badge Verified */}
        <div className="absolute bottom-2 right-2 bg-[#8b77ff] text-white w-8 h-8 sm:w-11 sm:h-11 rounded-full border-[4px] border-[#0e0c1e] flex items-center justify-center shadow-xl">
          <MaterialIcon name="verified" className="text-xs sm:text-lg" />
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-2 leading-tight tracking-tight px-2">
        {name}
      </h1>

      <div className="flex items-center justify-center gap-3 flex-wrap px-4 mb-3">
        <div className="flex items-center gap-1 whitespace-nowrap">
          <MaterialIcon name="star" className="text-amber-400 text-base" />
          <span className="text-[10px] sm:text-xs font-bold text-[#e8e2fc]">
            {rating}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {/* Portofolio Button */}
        <div
          onClick={() => handleOpenLink(portofolioUrl)}
          className={`bg-[#1f1d35]/50 hover:bg-[#1f1d35] px-4 py-1.5 rounded-full border border-white/5 flex items-center gap-1.5 cursor-pointer transition-all ${
            !portofolioUrl && "opacity-50 cursor-not-allowed"
          }`}
        >
          <MaterialIcon name="description" className="text-xs text-[#aca8c1]" />
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#aca8c1]">
            portofolio
          </span>
        </div>

        {/* LinkedIn Button */}
        <div
          onClick={() => handleOpenLink(linkedinUrl)}
          className={`bg-[#1f1d35]/50 hover:bg-[#1f1d35] px-4 py-1.5 rounded-full border border-white/5 flex items-center gap-1.5 cursor-pointer transition-all ${
            !linkedinUrl && "opacity-50 cursor-not-allowed"
          }`}
        >
          <MaterialIcon name="language" className="text-xs text-[#aca8c1]" />
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#aca8c1]">
            LINKEDIN
          </span>
        </div>
      </div>
    </section>
  );
}
