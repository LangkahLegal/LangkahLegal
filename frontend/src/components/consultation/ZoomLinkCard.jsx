// file: components/request/ZoomLinkCard.jsx
import { useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

export default function ZoomLinkCard({ link, status, role = "klien"}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset ke "Salin" setelah 2 detik
    } catch (err) {
      console.error("Gagal menyalin link:", err);
    }
  };

  if (!link) return null;

  // Cek apakah statusnya sudah selesai
  const isSelesai = status === "selesai";

  const buttonLabel = role === "konsultan" 
    ? "Mulai Sesi Konsultasi" 
    : "Gabung Sesi Konsultasi";

  return (
    <section className="space-y-4">
      {/* Label Title */}
      <h3 className="text-xs font-bold text-[#aca8c1] uppercase tracking-[0.2em] ml-2">
        Link Zoom Meetings
      </h3>

      {/* Container Link */}
      <div className="bg-[#1f1d35] rounded-2xl p-3 border border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#6f59fe]/20 flex items-center justify-center shrink-0">
          <MaterialIcon name="videocam" className="text-[#ada3ff] text-sm" />
        </div>

        {/* Teks URL */}
        <span className="text-sm text-white font-medium truncate flex-1">
          {link}
        </span>

        {/* Tombol Copy dengan Tooltip */}
        <div className="relative group">
          <button
            onClick={handleCopyLink}
            className="p-2 text-[#aca8c1] hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center justify-center"
          >
            <MaterialIcon
              name={copied ? "check" : "content_copy"}
              className="text-[18px]"
            />
          </button>

          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#0e0c1e] text-white text-[10px] font-bold rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-10">
            {copied ? "Disalin!" : "Salin"}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0e0c1e] border-b border-r border-white/10 transform rotate-45"></div>
          </div>
        </div>
      </div>

      {/* Render tombol HANYA jika status BUKAN selesai */}
      {!isSelesai && (
        <Button
          variant="primary"
          fullWidth
          onClick={() => window.open(link, "_blank")}
        >
          {buttonLabel}
        </Button>
      )}
    </section>
  );
}