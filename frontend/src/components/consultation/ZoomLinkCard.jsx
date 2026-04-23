// file: components/request/ZoomLinkCard.jsx
import { useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

export default function ZoomLinkCard({ link, status, role = "klien" }) {
  // Jika status BUKAN terjadwal atau selesai, komponen tidak di render
  const allowedStatuses = ["terjadwal", "selesai"];
  if (!allowedStatuses.includes(status)) {
    return null; 
  }

  // --- 2. STATE & HANDLER ---
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!link || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin link:", err);
    }
  };

  const buttonLabel = role === "konsultan" 
    ? "Mulai Sesi Konsultasi" 
    : "Gabung Sesi Konsultasi";

  const canJoin = status === "terjadwal";

  // --- 3. RENDER UI ---
  return (
    <section className="space-y-4">
      {/* Label Title */}
      <h3 className="text-xs font-bold text-[#aca8c1] uppercase tracking-[0.2em] ml-2">
        Link Zoom Meetings
      </h3>

      {/* Container Link */}
      <div className="bg-[#1f1d35] rounded-2xl p-3 border border-white/5 flex items-center gap-3">
        
        {/* Icon Dinamis */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${link ? 'bg-[#6f59fe]/20' : 'bg-white/5'}`}>
          <MaterialIcon 
            name={link ? "videocam" : "link_off"} 
            className={`text-sm ${link ? 'text-[#ada3ff]' : 'text-[#625f7a]'}`} 
          />
        </div>

        {/* Teks URL atau Placeholder */}
        <span className={`text-sm truncate flex-1 ${link ? 'text-white font-medium' : 'text-[#625f7a] italic'}`}>
          {link ? link : "Link belum tersedia"}
        </span>

        {/* Tombol Copy (Hanya muncul jika link ada) */}
        {link && (
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
        )}
      </div>

      {/* --- LOGIKA TOMBOL --- */}
      {canJoin && (
        <Button
          variant="primary"
          fullWidth
          onClick={() => link && window.open(link, "_blank")}
          disabled={!link} // Tombol mati/redup jika link belum ada
          className={!link ? "opacity-50 cursor-not-allowed" : ""}
        >
          {buttonLabel}
        </Button>
      )}
    </section>
  );
}