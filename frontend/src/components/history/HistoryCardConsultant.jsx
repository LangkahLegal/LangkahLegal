"use client";

import { MaterialIcon } from "@/components/ui/Icons";

export default function HistoryCardConsultant({ item }) {
  // 1. Tentukan pewarnaan berdasarkan status
  let statusColors = "";
  let isDimmed = false;

  switch (item.status) {
    case "Selesai":
      // Ungu (Bawaan LangkahLegal)
      statusColors = "bg-[#ada3ff]/10 text-[#ada3ff]";
      break;
    case "Terjadwal":
      // Hijau (Menandakan Aktif & Sudah Dibayar)
      statusColors = "bg-[#4ade80]/10 text-[#4ade80]";
      break;
    case "Menunggu Pembayaran":
      // Kuning (Menandakan Warning/Belum Tuntas)
      statusColors = "bg-[#facc15]/10 text-[#facc15]";
      break;
    case "Dibatalkan":
    case "Ditolak":
    case "Kedaluwarsa":
      // Merah dan Redup (Menandakan Gagal/Batal)
      statusColors = "bg-[#ff6e84]/10 text-[#ff6e84]";
      isDimmed = true;
      break;
    default:
      // Default Abu-abu
      statusColors = "bg-white/10 text-white";
  }

  return (
    <div className={`bg-[#1f1d35]/50 border border-white/5 rounded-[2rem] p-5 space-y-5 transition-all hover:border-[#6f59fe]/20 ${isDimmed ? 'opacity-60 grayscale-[30%]' : ''}`}>
      
      {/* Bagian Atas: Profil & Status */}
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="w-16 h-16 bg-[#2c2945] rounded-2xl overflow-hidden flex-shrink-0">
            <img 
              src={item.avatar} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
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

        <button className="text-[#ada3ff] text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
          Lihat Detail
          <MaterialIcon name="chevron_right" className="text-lg" />
        </button>
      </div>
    </div>
  );
}