"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { consultantUrl, saveConsultationDraft } from "@/lib/consultationDraft";

const JUDUL_JADWAL = {
  cocok: "Jadwal yang cocok",
  terdekat: "Jadwal terdekat",
  tersedia: "Jadwal tersedia",
};

export default function AIConsultantCard({ consultant, draft = null }) {
  const {
    id_konsultan,
    nama_lengkap,
    spesialisasi,
    tarif_per_sesi,
    pengalaman_tahun,
    foto_profil,
    avg_rating,
    total_reviews,
    kota_praktik,
    jadwal_status,
    slot_cocok = [],
  } = consultant;

  const buka = (slot = null) => {
    // Draft dari Tanya AI dipakai untuk mengisi deskripsi kasus di form pengajuan.
    if (draft) saveConsultationDraft(draft);
    window.open(consultantUrl(id_konsultan, { draft, slot }), "_blank");
  };

  // Format currency
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(tarif_per_sesi || 0);

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    nama_lengkap || "Konsultan"
  )}&background=1f1d35&color=ada3ff&size=128`;

  return (
    <div className="bg-bg border border-surface rounded-xl p-3 sm:p-4 flex flex-col gap-3 hover:border-primary/50 transition-colors shadow-sm">
      {/* Top Section: Avatar & Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border border-surface bg-input">
          <img
            src={foto_profil || fallbackUrl}
            alt={nama_lengkap}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = fallbackUrl;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-main leading-tight truncate" title={nama_lengkap}>
            {nama_lengkap}
          </h4>
          <p className="text-[10px] sm:text-xs text-primary-light font-medium truncate">
            {[spesialisasi, pengalaman_tahun ? `${pengalaman_tahun} thn pengalaman` : null, kota_praktik]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
      </div>

      {/* Jadwal: slot dari jadwal nyata konsultan, dicocokkan dengan preferensi klien */}
      {jadwal_status && (
        <div className="space-y-1.5" data-testid="ai-consultant-schedule">
          {jadwal_status === "belum_ada" ? (
            <p className="text-[10px] sm:text-xs text-muted flex items-center gap-1">
              <MaterialIcon name="event_busy" className="text-[14px]" />
              Belum ada jadwal
            </p>
          ) : (
            <>
              <p
                className={`text-[10px] sm:text-xs font-semibold flex items-center gap-1 ${
                  jadwal_status === "cocok" ? "text-emerald-500" : "text-muted"
                }`}
              >
                <MaterialIcon name="event_available" className="text-[14px]" />
                {JUDUL_JADWAL[jadwal_status] || "Jadwal"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {slot_cocok.map((slot) => (
                  <button
                    key={`${slot.tanggal}-${slot.mulai}`}
                    type="button"
                    onClick={() => buka(slot)}
                    className="px-2.5 py-1 rounded-lg border border-surface bg-input text-[10px] sm:text-xs text-main hover:border-primary/60 hover:text-primary-light transition-colors"
                    data-testid="ai-consultant-slot"
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom Section: Stats & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-surface/50 pt-3">
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted">
          <div className="flex items-center gap-0.5">
            <MaterialIcon name="star" className="text-amber-400 text-[12px] sm:text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }} />
            <span className="font-bold text-main">{Number(avg_rating).toFixed(1)}</span>
            <span>({total_reviews})</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-surface" />
          <span className={`font-bold ${tarif_per_sesi === 0 ? "text-emerald-500" : "text-main"}`}>
            {tarif_per_sesi === 0 ? "Gratis" : formattedPrice}
          </span>
        </div>
        
        <Button
          variant="primary"
          className="w-full sm:w-auto !py-1.5 !px-4 text-[10px] sm:text-xs font-semibold shrink-0"
          onClick={() => buka()}
        >
          Jadwalkan
        </Button>
      </div>
    </div>
  );
}
