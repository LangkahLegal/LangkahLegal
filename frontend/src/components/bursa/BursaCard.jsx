"use client";

import { motion } from "framer-motion";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

// --- Helper: Format waktu relatif ---
function timeAgo(dateString) {
  if (!dateString) return "";
  // Pastikan string dibaca sebagai UTC (mengatasi selisih 7 jam di waktu lokal)
  const safeDateString = dateString.endsWith("Z")
    ? dateString
    : `${dateString}Z`;
  const now = new Date();
  const date = new Date(safeDateString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
}

const KATEGORI_META = {
  pidana: {
    icon: "gavel",
    color: "text-accent-text",
    bg: "bg-accent-tint",
    border: "border-accent/25",
  },
  perdata: {
    icon: "handshake",
    color: "text-info-text",
    bg: "bg-info-soft",
    border: "border-info/25",
  },
  umum: {
    icon: "description",
    color: "text-secondary-text",
    bg: "bg-secondary-soft",
    border: "border-secondary/25",
  },
};

function getKategoriMeta(kategori) {
  return (
    KATEGORI_META[kategori?.toLowerCase()] || {
      icon: "folder",
      color: "text-muted",
      bg: "bg-surface",
      border: "border-surface",
    }
  );
}

export default function BursaCard({
  kasus,
  idx,
  isExpanded,
  toggleDesc,
  onClaim,
  isClaiming,
}) {
  const meta = getKategoriMeta(kasus.kategori_hukum);
  const rawDesc = kasus.deskripsi_kasus_awam || "";
  const isLongText = rawDesc.length > 150;

  return (
    <motion.div
      key={kasus.id_bursa}
      data-testid="bursa-card"
      data-case-id={kasus.id_bursa}
      initial={{ opacity: 0, y: 20 }}
      // Jeda bertahap hanya saat muncul (maks. 10 kartu) agar kartu yang tersaring langsung hilang.
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(idx, 10) * 0.05, duration: 0.3 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="group p-4 rounded-2xl border transition-all duration-300 bg-card border-surface shadow-soft flex flex-col justify-between h-full hover:border-primary/30"
    >
      <div>
        {/* BAGIAN ATAS: Avatar (Ikon Kategori), Info, & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div
                className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl overflow-hidden border-2 border-surface flex items-center justify-center transition-colors group-hover:border-primary/30 ${meta.bg}`}
              >
                <MaterialIcon
                  name={meta.icon}
                  className={`text-xl lg:text-2xl ${meta.color}`}
                />
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center h-full pt-0.5">
              <h3 className="font-bold text-sm lg:text-base text-main group-hover:text-primary-light transition-colors truncate">
                Klien Anonim
              </h3>
              <p className="text-[10px] sm:text-xs truncate font-semibold uppercase tracking-wider text-muted mt-0.5">
                {kasus.kategori_hukum || "Umum"} <span className="mx-1">•</span>{" "}
                {timeAgo(kasus.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* BAGIAN TENGAH: Deskripsi Kasus */}
        <div className="mt-3.5 px-0.5">
          <p
            data-testid="bursa-card-description"
            className={`text-sm text-main leading-relaxed transition-all duration-300 ${!isExpanded && isLongText ? "line-clamp-3" : ""}`}
          >
            {rawDesc}
          </p>

          {/* Tombol Lihat Selengkapnya */}
          {isLongText && (
            <button
              onClick={() => toggleDesc(kasus.id_bursa)}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-light mt-1.5 transition-colors focus:outline-none"
            >
              {isExpanded ? "Sembunyikan" : "Lihat Selengkapnya"}
              <MaterialIcon
                name={isExpanded ? "expand_less" : "expand_more"}
                className="text-[14px]"
              />
            </button>
          )}
        </div>
      </div>

      {/* BAGIAN BAWAH: Waktu, Dokumen & Action */}
      <div className="mt-4 pt-3.5 border-t border-surface flex justify-between items-center gap-2">
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5">
          {kasus.tanggal_konsultasi && (
            <div className="flex items-center gap-1.5 text-muted text-[10px] sm:text-xs font-medium">
              <MaterialIcon name="event" className="text-sm" />
              <span className="truncate">
                {new Date(
                  kasus.tanggal_konsultasi + "T00:00:00",
                ).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" • "}
                {kasus.jam_mulai?.substring(0, 5)} -{" "}
                {kasus.jam_selesai?.substring(0, 5)}
              </span>
            </div>
          )}

          {kasus.dokumen_bukti && (
            <a
              href={kasus.dokumen_bukti}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-primary-light hover:text-primary transition-colors w-fit"
            >
              <MaterialIcon name="attach_file" className="text-sm" />
              <span className="underline truncate">Lihat Dokumen</span>
            </a>
          )}
        </div>

        <Button
          id={`claim-case-${kasus.id_bursa}`}
          onClick={() => onClaim(kasus.id_bursa)}
          isLoading={isClaiming}
          className="!rounded-xl !px-4 !py-2 sm:!px-5 sm:!py-2.5 text-xs shrink-0"
          data-testid="bursa-claim-btn"
        >
          <MaterialIcon
            name="front_hand"
            className="text-base mr-1 hidden sm:block"
          />
          <span>Klaim Kasus</span>
        </Button>
      </div>
    </motion.div>
  );
}
