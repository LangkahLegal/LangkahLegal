"use client";

import { MaterialIcon } from "@/components/ui/Icons";
import useChatStore from "@/stores/useChatStore";

const MAX_PASAL_CHIPS = 3;

/** Daftar dokumen peraturan yang dipakai Kia, ditampilkan di bawah jawaban. */
export default function AISourceList({ sources = [] }) {
  const { activeSourceDocument, setActiveSourceDocument } = useChatStore();
  if (sources.length === 0) return null;

  return (
    <div className="px-2 pt-2 space-y-2" data-testid="ai-sources">
      <p className="text-[10px] lg:text-xs text-muted font-semibold uppercase tracking-wider px-2">Sumber</p>
      <div className="flex flex-col gap-2">
        {sources.map((s) => {
          const isSelected = activeSourceDocument?.frbr_uri === s.frbr_uri;
          return (
            <button
              key={s.frbr_uri}
              type="button"
              onClick={() => setActiveSourceDocument(isSelected ? null : s)}
              className={`group w-full text-left flex items-start gap-3 border rounded-xl px-3 py-2.5 transition-all ${
                isSelected
                  ? "bg-primary/10 border-primary/50 text-primary-light shadow-sm"
                  : "bg-surface/50 hover:bg-surface border-surface"
              }`}
              data-testid="ai-source-item"
            >
              <MaterialIcon
                name={s.has_file ? "picture_as_pdf" : "gavel"}
                className="text-primary-light text-[18px] mt-0.5 shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs lg:text-sm font-semibold text-main truncate">{s.nama_uu || s.nomor_uu}</p>
                <p className="text-[10px] lg:text-xs text-muted truncate">
                  {[s.nomor_uu, s.status_hukum].filter(Boolean).join(" · ")}
                </p>
                {s.pasal?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.pasal.slice(0, MAX_PASAL_CHIPS).map((p) => (
                      <span
                        key={p.id_dokumen}
                        className="text-[10px] text-primary-light bg-primary/10 px-2 py-0.5 rounded-full"
                      >
                        {p.pasal_bagian}
                      </span>
                    ))}
                    {s.pasal.length > MAX_PASAL_CHIPS && (
                      <span className="text-[10px] text-muted px-1 py-0.5">
                        +{s.pasal.length - MAX_PASAL_CHIPS} lainnya
                      </span>
                    )}
                  </div>
                )}
              </div>
              <MaterialIcon
                name={isSelected ? "expand_more" : "chevron_right"}
                className="text-muted text-[18px] mt-0.5 shrink-0 group-hover:text-main transition-colors"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
