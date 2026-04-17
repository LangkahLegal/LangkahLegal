"use client";

import { MaterialIcon } from "@/components/ui/Icons";

export default function HistoryCard({ item, role = "client" }) {
  const isActive = item.status === "Berlangsung"; 
  let statusColors = "";
  let isDimmed = false;

  switch (item.status) {
    case "Berlangsung":
      statusColors = "bg-[#ada3ff] text-[#0e0c1e]"; 
      break;
    case "Selesai":
      statusColors = "bg-[#ada3ff]/10 text-[#ada3ff]"; 
      break;
    case "Terjadwal":
      statusColors = "bg-[#4ade80]/10 text-[#4ade80]"; // Hijau
      break;
    case "Pending":
      statusColors = "bg-[#38bdf8]/10 text-[#38bdf8]"; // Biru
      break;
    case "Menunggu Pembayaran":
      statusColors = "bg-[#facc15]/10 text-[#facc15]"; // Kuning
      break;
    case "Dibatalkan":
    case "Ditolak":
    case "Kedaluwarsa":
    case "Pembayaran Gagal": 
      statusColors = "bg-[#ff6e84]/10 text-[#ff6e84]"; // Merah
      isDimmed = true;
      break;
    default:
      statusColors = "bg-white/10 text-white"; // Abu-abu default
  }

  // 2. Konten Dinamis Berdasarkan Role
  const subtitle = role === "konsultan" 
    ? (`Rp${item.price?.toLocaleString("id-ID") || "0"}`) 
    : item.role;

  return (
    <div
      className={`group p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 ${
        isActive
          ? "bg-[#6f59fe]/10 border-[#6f59fe]/30 shadow-[0_10px_30px_rgba(111,89,254,0.1)]"
          : "bg-[#1f1d35]/50 border-white/5 hover:border-[#6f59fe]/20"
      } ${isDimmed ? "opacity-60 grayscale-[30%]" : ""}`}
    >
      {/* BAGIAN ATAS: Avatar, Info, & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          
          {/* Avatar Section */}
          <div className="relative shrink-0">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 bg-[#2c2945] ${
                isActive ? "border-[#6f59fe]" : "border-transparent"
              }`}
            >
              <img
                src={item.avatar}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            {isActive && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0e0c1e] rounded-full animate-pulse" />
            )}
          </div>

          {/* Content Section */}
          <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0 flex flex-col justify-center h-full pt-1 sm:pt-1.5">
            <h3 className="font-bold text-sm sm:text-base lg:text-lg text-[#e8e2fc] group-hover:text-white transition-colors truncate">
              {item.name}
            </h3>
            {/* Subtitle dinamis (menjadi harga jika konsultan, atau role jika klien) */}
            <p className={`text-[10px] sm:text-xs truncate font-medium ${role === "konsultan" ? "text-[#ada3ff]" : "text-[#aca8c1]"}`}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Badge Status (Di Kanan Atas) */}
        <span
          className={`shrink-0 text-[9px] sm:text-[10px] font-black px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg tracking-widest uppercase ${statusColors}`}
        >
          {item.status}
        </span>
      </div>

      {/* BAGIAN BAWAH: Waktu & Action */}
      <div className="mt-4 sm:mt-5 pt-4 border-t border-white/5 flex justify-between items-center gap-2">
        
        {/* Kiri: Tombol Gabung ATAU Info Waktu */}
        {isActive ? (
          <button className="flex items-center gap-1.5 sm:gap-2 text-[#ada3ff] font-bold text-[11px] sm:text-sm hover:gap-3 transition-all">
            <MaterialIcon name="videocam" className="text-base sm:text-lg" />
            <span className="truncate">Gabung Sesi</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2 text-[#aca8c1] text-[10px] sm:text-xs font-medium">
            <MaterialIcon name="calendar_today" className="text-xs sm:text-sm" />
            <span className="truncate">
              {item.date ? `${item.date}, ${item.time}` : item.time}
            </span>
          </div>
        )}

        {/* Kanan: Tombol Lihat Detail */}
        <button
          className={`flex items-center gap-0.5 sm:gap-1 font-bold text-[11px] sm:text-sm transition-all shrink-0 ${
            isActive ? "text-white hover:gap-2" : "text-[#ada3ff] hover:gap-2"
          }`}
        >
          {isActive ? (
            <MaterialIcon name="arrow_forward" className="text-lg sm:text-xl" />
          ) : (
            <>
              <span className="hidden sm:inline">Lihat Detail</span>
              <MaterialIcon name="chevron_right" className="text-lg sm:text-xl" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}