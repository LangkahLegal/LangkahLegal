"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/knowledge/Modal";
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
    <div className="bg-bg border border-surface rounded-xl p-4 space-y-2">
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
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors";

/** Pratinjau sumber jawaban Kia: pasal yang dirujuk dan naskah resmi peraturannya. */
export default function SourceDocumentModal({ source, open, onClose }) {
  const [tab, setTab] = useState("pasal");
  if (!source) return null;

  const { nama_uu, nomor_uu, judul_resmi, kategori, status_hukum, file_url, sumber_url, pasal = [] } = source;
  const activeTab = file_url ? tab : "pasal";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={nama_uu || nomor_uu || "Dokumen hukum"}
      description={judul_resmi || nomor_uu || ""}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5" data-testid="ai-source-modal">
        <div className="flex flex-wrap items-center gap-2">
          {kategori && <Badge variant="primary">{kategori.replaceAll("_", " ")}</Badge>}
          {status_hukum && <StatusBadge status={status_hukum} />}
        </div>

        {file_url && (
          <div className="flex gap-2 border-b border-surface">
            {[
              ["pasal", "Pasal yang dirujuk"],
              ["naskah", "Naskah resmi"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
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

        {activeTab === "pasal" ? (
          <div className="space-y-3">
            {pasal.map((p) => (
              <PasalItem key={p.id_dokumen} idDokumen={p.id_dokumen} label={p.pasal_bagian} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <iframe
              src={file_url}
              title={`Naskah resmi ${nama_uu || nomor_uu || ""}`}
              className="w-full h-[60vh] rounded-xl border border-surface bg-white"
            />
            <p className="text-[11px] text-muted">
              Kalau PDF tidak tampil di sini, buka di tab baru lewat tombol di bawah.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-surface">
          {file_url && (
            <a
              href={file_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkClass} bg-primary text-white hover:bg-primary/90`}
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
              className={`${linkClass} bg-surface text-main hover:bg-surface/70`}
            >
              <MaterialIcon name="open_in_new" className="text-[16px]" />
              Lihat di JDIH BPK
            </a>
          )}
          {!file_url && !sumber_url && (
            <p className="text-xs text-muted">Naskah resmi dokumen ini belum tersedia di katalog.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
