"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, StatusBadge } from "@/components/knowledge/KnowledgeTable";
import { MaterialIcon } from "@/components/ui/Icons";
import { knowledgeService } from "@/services/knowledge.service";

function PasalItem({ idDokumen, label }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["knowledge-pasal", idDokumen],
    queryFn: () => knowledgeService.getPasal(idDokumen),
    staleTime: Infinity,
  });

  return (
    <div className="bg-surface border border-surface rounded-2xl p-4 sm:p-5 space-y-2 shadow-soft transition-all">
      <p className="text-sm font-bold text-main">{data?.pasal_bagian || label}</p>
      {isLoading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-surface rounded w-full" />
          <div className="h-3 bg-surface rounded w-5/6" />
          <div className="h-3 bg-surface rounded w-2/3" />
        </div>
      )}
      {isError && (
        <p className="text-xs text-danger">Isi pasal gagal dimuat. Dokumennya mungkin sudah diperbarui.</p>
      )}
      {data && (
        <p className="text-xs sm:text-sm text-main/90 leading-relaxed whitespace-pre-line">{data.isi_teks}</p>
      )}
    </div>
  );
}

const linkClass =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors";

/** Panel pratinjau dokumen sumber hukum yang berdampingan dengan chat (Side-by-side / Canvas style). */
export default function SourceDocumentModal({ source, onClose }) {
  const [tab, setTab] = useState("pasal");
  if (!source) return null;

  const { nama_uu, nomor_uu, judul_resmi, kategori, status_hukum, file_url, sumber_url, pasal = [] } = source;
  const activeTab = file_url ? tab : "pasal";

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-bg text-main">
      {/* Top Bar / Header */}
      <div className="p-4 sm:p-5 border-b border-surface bg-bg/80 backdrop-blur-md shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary-light flex items-center justify-center shrink-0">
                <MaterialIcon name="menu_book" className="text-lg" />
              </div>
              <h3 className="text-main font-bold text-base sm:text-lg truncate">
                {nama_uu || nomor_uu || "Dokumen Hukum"}
              </h3>
            </div>
            {judul_resmi && (
              <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                {judul_resmi}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {kategori && (
                <Badge variant="primary">{kategori.replaceAll("_", " ")}</Badge>
              )}
              {status_hukum && <StatusBadge status={status_hukum} />}
            </div>
          </div>

          {/* Close / Collapse button */}
          <button
            onClick={onClose}
            className="text-muted hover:text-main transition p-2 bg-surface/50 hover:bg-surface rounded-xl shrink-0"
            aria-label="Tutup panel dokumen"
            title="Tutup panel"
          >
            <MaterialIcon name="close" />
          </button>
        </div>
      </div>

      {/* Tab Switcher if PDF exists */}
      {file_url && (
        <div className="flex gap-2 px-5 border-b border-surface bg-surface/20 shrink-0">
          {[
            ["pasal", "Pasal yang dirujuk"],
            ["naskah", "Naskah resmi"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-3 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === key
                  ? "border-primary text-primary-light"
                  : "border-transparent text-muted hover:text-main"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {activeTab === "pasal" ? (
          <div className="space-y-3">
            {pasal.map((p) => (
              <PasalItem
                key={p.id_dokumen}
                idDokumen={p.id_dokumen}
                label={p.pasal_bagian}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2 h-full flex flex-col">
            <iframe
              src={file_url}
              title={`Naskah resmi ${nama_uu || nomor_uu || ""}`}
              className="w-full flex-1 min-h-[450px] rounded-xl border border-surface bg-white shadow-inner"
            />
            <p className="text-[11px] text-muted">
              Kalau PDF tidak tampil di sini, buka di tab baru lewat tombol di bawah.
            </p>
          </div>
        )}
      </div>

      {/* Footer Links & Actions */}
      <div className="p-4 border-t border-surface bg-bg/80 backdrop-blur-md flex flex-wrap items-center gap-2 shrink-0">
        {file_url && (
          <a
            href={file_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} bg-primary text-white hover:bg-primary/90 shadow-sm`}
          >
            <MaterialIcon name="picture_as_pdf" className="text-[16px]" />
            Buka PDF
          </a>
        )}
        {sumber_url && (
          <a
            href={sumber_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} bg-surface text-main hover:bg-surface/70 border border-surface`}
          >
            <MaterialIcon name="open_in_new" className="text-[16px]" />
            Lihat di JDIH BPK
          </a>
        )}
        {!file_url && !sumber_url && (
          <p className="text-xs text-muted">
            Naskah resmi dokumen ini belum tersedia di katalog.
          </p>
        )}
      </div>
    </div>
  );
}

