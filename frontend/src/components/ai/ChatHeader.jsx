"use client";

import { MaterialIcon } from "@/components/ui/Icons";

export default function ChatHeader({
  name = "Kia",
  avatarUrl,
  status = "Online",
}) {
  // Logic Fallback: Menggunakan inisial nama jika foto tidak ada
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=1f1d35&color=ada3ff&size=128`;

  return (
    <header className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-[#0e0c1e]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="relative">
          {/* Avatar Container */}
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden border-2 border-[#6f59fe]/30 bg-[#1f1d35]">
            <img
              src={avatarUrl || fallbackUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              onError={(e) => {
                e.target.src = fallbackUrl;
              }}
            />
          </div>

          {/* Status Indicator */}
          {status.toLowerCase() === "online" && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0e0c1e] rounded-full animate-pulse" />
          )}
        </div>

        <div>
          <h1 className="text-white font-bold text-lg lg:text-xl leading-tight">
            {name}
          </h1>
          <p
            className={`text-[10px] lg:text-xs font-bold tracking-widest uppercase ${
              status.toLowerCase() === "online"
                ? "text-emerald-500"
                : "text-[#aca8c1]"
            }`}
          >
            {status}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="text-[#aca8c1] hover:text-white p-2 transition-colors">
          <MaterialIcon name="search" />
        </button>
        <button className="text-[#aca8c1] hover:text-white p-2 transition-colors">
          <MaterialIcon name="more_vert" />
        </button>
      </div>
    </header>
  );
}
