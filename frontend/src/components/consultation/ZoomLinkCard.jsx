// file: components/request/ZoomLinkCard.jsx
import { useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui"; // Pastikan path import Button ini benar

export default function ZoomLinkCard({ link }) {
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

  return (
    <section className="space-y-4">
      {/* Label Title (Mirip seperti "LINK LINKEDIN" di gambar) */}
      <h3 className="text-xs font-bold text-[#aca8c1] uppercase tracking-[0.2em] ml-2">
        Link Zoom Meetings
      </h3>

      {/* Container Link */}
      <div className="bg-[#1f1d35] rounded-2xl p-3 border border-white/5 flex items-center gap-3">
        {/* Ikon Kiri (Bisa diganti image blur jika punya asetnya, ini pakai ikon bawaan dulu) */}
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

          {/* Tooltip Hover (Muncul di atas tombol) */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#0e0c1e] text-white text-[10px] font-bold rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-10">
            {copied ? "Disalin!" : "Salin"}
            {/* Segitiga kecil penunjuk ke bawah */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0e0c1e] border-b border-r border-white/10 transform rotate-45"></div>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={() => window.open(link, "_blank")}
      >
        Mulai Sesi Konsultasi
      </Button>
    </section>
  );
}