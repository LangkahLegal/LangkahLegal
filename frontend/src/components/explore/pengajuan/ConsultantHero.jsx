import { MaterialIcon } from "@/components/ui/Icons";

export default function ConsultantHero({
  name,
  specialization,
  rating,
  avatar,
  portofolioUrl,
  linkedinUrl,
}) {
  // Memastikan URL diawali dengan protokol
  const handleOpenLink = (url) => {
    if (!url) return alert("Tautan tidak tersedia");

    // Jika URL tidak dimulai dengan http:// atau https://, tambahkan https://
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;

    window.open(formattedUrl, "_blank");
  };

  return (
    <section className="relative flex flex-col items-center text-center w-full pt-4 font-['Inter',sans-serif]">
      {/* 1. Ambient Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#6f59fe]/20 blur-[80px] -z-10 rounded-full" />

      {/* 2. Avatar Section */}
      <div className="relative mb-6 sm:mb-8">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[6px] border-[#6f59fe]/10 p-1.5 backdrop-blur-sm shadow-inner">
          <div className="w-full h-full rounded-full border-2 border-[#6f59fe] p-1">
            <img
              src={avatar}
              className="w-full h-full rounded-full object-cover shadow-2xl"
              alt={name}
            />
          </div>
        </div>
        <div className="absolute bottom-1 right-1 bg-[#8b77ff] text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full border-[3px] border-[#0e0c1e] flex items-center justify-center shadow-lg">
          <MaterialIcon name="verified" className="text-[10px] sm:text-xs" />
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
          className={`bg-[#1f1d35]/50 hover:bg-[#1f1d35] px-3 py-1 rounded-full border border-white/5 flex items-center gap-1.5 cursor-pointer transition-all ${!portofolioUrl && "opacity-50 cursor-not-allowed"}`}
        >
          <MaterialIcon name="description" className="text-xs text-[#aca8c1]" />
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#aca8c1]">
            portofolio
          </span>
        </div>

        {/* LinkedIn Button - Sekarang sudah aman dari relative path */}
        <div
          onClick={() => handleOpenLink(linkedinUrl)}
          className={`bg-[#1f1d35]/50 hover:bg-[#1f1d35] px-3 py-1 rounded-full border border-white/5 flex items-center gap-1.5 cursor-pointer transition-all ${!linkedinUrl && "opacity-50 cursor-not-allowed"}`}
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
