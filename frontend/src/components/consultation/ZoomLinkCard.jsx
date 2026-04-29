"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

export default function ZoomLinkCard({ link, status, role = "klien" }) {
  // 1. FILTER STATUS
  const allowedStatuses = ["terjadwal", "selesai"];
  if (!allowedStatuses.includes(status)) {
    return null;
  }

  // 2. STATE & HANDLER
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

  const buttonLabel =
    role === "konsultan" ? "Mulai Sesi Konsultasi" : "Gabung Sesi Konsultasi";

  const canJoin = status === "terjadwal";

  // 3. RENDER UI
  return (
    <section className="space-y-4">
      {/* Label Title - REFACTOR: Menggunakan variabel text-muted */}
      <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-2">
        Link Zoom Meetings
      </h3>

      {/* Container Link - REFACTOR: Menggunakan bg-card & border-surface */}
      <div className="bg-card rounded-2xl p-3 border border-surface flex items-center gap-3 transition-colors duration-500">
        {/* Icon Area - REFACTOR: Menggunakan aksen primary jika link tersedia */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
            link ? "bg-primary/20" : "bg-surface"
          }`}
        >
          <MaterialIcon
            name={link ? "videocam" : "link_off"}
            className={`text-sm ${link ? "text-primary-light" : "text-muted/50"}`}
          />
        </div>

        {/* URL Text - REFACTOR: text-main agar otomatis gelap di Light Mode */}
        <span
          className={`text-sm truncate flex-1 transition-colors duration-300 ${
            link ? "text-main font-medium" : "text-muted/40 italic"
          }`}
        >
          {link ? link : "Link belum tersedia"}
        </span>

        {/* Tombol Copy */}
        {link && (
          <div className="relative group">
            <button
              onClick={handleCopyLink}
              className="p-2 text-muted hover:text-main hover:bg-surface rounded-xl transition-all flex items-center justify-center"
            >
              <MaterialIcon
                name={copied ? "check" : "content_copy"}
                className="text-[18px]"
              />
            </button>

            {/* Tooltip Copy - REFACTOR: bg-bg & border-surface */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-bg text-main text-[10px] font-bold rounded-lg border border-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-10">
              {copied ? "Disalin!" : "Salin"}
              {/* Arrow Tooltip */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-bg border-b border-r border-surface transform rotate-45"></div>
            </div>
          </div>
        )}
      </div>

      {/* Button Action */}
      {canJoin && (
        <Button
          variant="primary"
          fullWidth
          onClick={() => link && window.open(link, "_blank")}
          disabled={!link}
          className={!link ? "opacity-50 cursor-not-allowed" : ""}
        >
          {buttonLabel}
        </Button>
      )}
    </section>
  );
}
