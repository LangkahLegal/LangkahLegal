"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

export default function ConsultantCard({ item, onDetail, onApprove, onReject }) {
  let statusColors = "";
  let isDimmed = false;

  switch (item.status) {
    case "pending":
      statusColors = "bg-[#fbbf24]/10 text-[#fbbf24]";
      break;
    case "terverifikasi":
      statusColors = "bg-[#34d399]/10 text-[#34d399]";
      break;
    case "ditolak":
      statusColors = "bg-[#fb7185]/10 text-[#fb7185]";
      isDimmed = true;
      break;
    default:
      statusColors = "bg-white/10 text-white";
  }

  return (
    <div
      className={`group p-4 sm:p-5 rounded-[1.5rem] border transition-all duration-300 
      bg-[#1f1d35]/50 border-white/5 hover:border-[#6f59fe]/20
      ${isDimmed ? "opacity-60 grayscale-[30%]" : ""}`}
    >
      {/* ================= ATAS ================= */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#2c2945] shrink-0">
            <img
              src={item.foto_profil}
              alt={item.nama_lengkap}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info utama */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-white truncate">
              {item.nama_lengkap}
            </h3>

            <p className="text-xs text-[#a1a0b8] truncate">
              {item.spesialisasi}
              {item.kota_praktik && (
                <> • {item.kota_praktik}</>
                )}
            </p>

            <p className="text-[10px] text-[#8f8aa8] mt-0.5">
              {item.pengalaman_tahun != null
                ? `${item.pengalaman_tahun} tahun`
                : "Pengalaman belum diisi"}
              {item.tarif_per_sesi != null && (
                <span className="text-[#ada3ff] font-medium">
                    {" "}• Rp {item.tarif_per_sesi.toLocaleString("id-ID")}
                </span>
                )}
            </p>
          </div>
        </div>

        {/* STATUS */}
        <span
          className={`shrink-0 text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase ${statusColors}`}
        >
          {item.status}
        </span>
      </div>

      {/* ================= BAWAH ================= */}
      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center gap-2">
        
        {/* LEFT */}
        <div className="flex items-center gap-1 text-[#aca8c1] text-[10px]">
          <MaterialIcon name="schedule" className="text-xs" />
          <span>
            {item.waktu_submit?.date}, {item.waktu_submit?.time}
          </span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={() => onDetail?.(item)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#ada3ff] hover:gap-2 transition-all"
          >
            Detail
            <MaterialIcon name="chevron_right" className="text-[16px]" />
          </button>

          {item.status === "pending" && (
            <>
              <Button
                onClick={() => onApprove?.(item)}
                variant="primary"
                className="!px-3 !py-1 !text-[10px] !rounded-lg bg-[#059669]/10 text-[#34d399] border border-[#059669]/30 hover:bg-[#059669]/20"
                >
                Verifikasi
              </Button>

              <Button
                onClick={() => onReject?.(item)}
                variant="danger"
                className="!px-3 !py-1 !text-[10px] !rounded-lg"
                >
                Tolak
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}