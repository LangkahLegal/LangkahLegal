"use client";

import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";

export default function HistoryCardConsultant({ item }) {
  const isCanceled = item.status === "Dibatalkan";
  
  // Warna dinamis berdasarkan status
  const statusColors = isCanceled 
    ? "bg-[#ff6e84]/10 text-[#ff6e84]" 
    : "bg-[#ada3ff]/10 text-[#ada3ff]";

  return (
    <div className={`bg-[#1f1d35]/50 border border-white/5 rounded-[2rem] p-5 space-y-5 transition-all hover:border-[#6f59fe]/20 ${isCanceled ? 'opacity-70' : ''}`}>
      
      {/* Bagian Atas: Profil & Status */}
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          {/* Avatar Kotak Rounded */}
          <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden flex-shrink-0">
            <img 
              src={item.avatar} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Info Utama */}
          <div className="space-y-1">
            <h3 className="font-bold text-[#e8e2fc] text-lg">{item.name}</h3>
            <p className="text-xs text-[#aca8c1] font-medium">{item.category}</p>
            <p className="text-sm font-bold text-[#ada3ff] pt-1">
              {item.price === 0 ? "Rp 0" : `Rp ${item.price.toLocaleString('id-ID')}`}
            </p>
          </div>
        </div>

        {/* Badge Status */}
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase ${statusColors}`}>
          {item.status}
        </span>
      </div>

      {/* Bagian Bawah: Waktu & Link */}
      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[#aca8c1] text-xs">
          <MaterialIcon name="calendar_today" className="text-sm" />
          <span>{item.date}, {item.time}</span>
        </div>

        {!isCanceled && (
          <button className="text-[#ada3ff] text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Lihat Detail
            <MaterialIcon name="chevron_right" className="text-lg" />
          </button>
        )}
      </div>
    </div>
  );
}