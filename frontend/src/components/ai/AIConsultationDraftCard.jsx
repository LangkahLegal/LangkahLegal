"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import AIConsultantCard from "./AIConsultantCard";

/** Draft pengajuan konsultasi yang dirangkum Kia, beserta konsultan yang bisa langsung dijadwalkan. */
export default function AIConsultationDraftCard({ draft, consultants = [], showActions = true }) {
  const { kategori, ringkasan_kasus, bukti_dimiliki = [], bukti_perlu_disiapkan = [] } = draft;

  return (
    <div
      className="mt-6 space-y-4 pt-4 border-t border-surface/50"
      data-testid="ai-consultation-draft"
    >
      <div className="bg-bg border border-surface rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-light">
            Draft Pengajuan Konsultasi
          </p>
          {kategori && (
            <span className="text-[10px] sm:text-xs font-semibold text-primary-light bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
              {kategori}
            </span>
          )}
        </div>

        <p className="text-sm text-main leading-relaxed whitespace-pre-line">{ringkasan_kasus}</p>

        {bukti_dimiliki.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wider">
              Bukti yang sudah ada
            </p>
            <ul className="space-y-1">
              {bukti_dimiliki.map((bukti) => (
                <li key={bukti} className="flex items-center gap-2 text-xs sm:text-sm text-main">
                  <MaterialIcon name="check_circle" className="text-emerald-500 text-[16px]" />
                  {bukti}
                </li>
              ))}
            </ul>
          </div>
        )}

        {bukti_perlu_disiapkan.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] sm:text-xs font-semibold text-muted uppercase tracking-wider">
              Sebaiknya disiapkan
            </p>
            <ul className="space-y-1">
              {bukti_perlu_disiapkan.map((bukti) => (
                <li key={bukti} className="flex items-center gap-2 text-xs sm:text-sm text-main">
                  <MaterialIcon name="radio_button_unchecked" className="text-muted text-[16px]" />
                  {bukti}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[10px] sm:text-xs text-muted italic">
          Ringkasan ini otomatis terisi di form pengajuan saat Anda memilih konsultan, dan masih bisa
          Anda ubah.
        </p>
      </div>

      {!showActions ? null : consultants.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {consultants.map((c) => (
            <AIConsultantCard key={c.id_konsultan} consultant={c} draft={draft} />
          ))}
        </div>
      ) : (
        <Button
          variant="primary"
          className="w-full sm:w-auto !py-1.5 !px-4 text-xs font-semibold"
          onClick={() => window.open("/explore", "_blank")}
        >
          Cari Konsultan
        </Button>
      )}
    </div>
  );
}
