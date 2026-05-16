import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import Pagination from "./Pagination";

export function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-surface text-muted",
    success: "bg-emerald-500/10 text-emerald-600",
    danger: "bg-danger/10 text-danger",
    primary: "bg-primary/10 text-primary-light",
    warning: "bg-amber-500/10 text-amber-600",
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest whitespace-nowrap ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  let variant = "default";
  if (s === "berlaku") variant = "success";
  if (s === "dicabut") variant = "danger";
  if (s === "revisi") variant = "warning";
  
  return <Badge variant={variant}>{status || "Unknown"}</Badge>;
}

export default function KnowledgeTable({
  documents,
  loadingDocs,
  page,
  totalPages,
  setPage,
  handleDetailClick,
  handleReplaceClick,
  handleDeleteClick,
}) {
  return (
    <div className="bg-card border border-surface rounded-3xl overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        {/* Tambahkan min-w agar tabel tidak hancur di layar kecil */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface/30 border-b border-surface text-muted text-[11px] font-bold uppercase tracking-wider">
              {/* Hapus semua w-[...%] */}
              <th className="px-4 py-3">Nama UU</th>
              <th className="px-4 py-3 w-px whitespace-nowrap">Nomor/Tahun</th>
              <th className="px-4 py-3 w-px text-center whitespace-nowrap">Pasal</th>
              <th className="px-4 py-3 w-px whitespace-nowrap">Kategori</th>
              <th className="px-4 py-3 w-px text-center whitespace-nowrap">Status</th>
              <th className="px-4 py-3 w-px text-right whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {documents.map((doc) => (
              <tr 
                key={doc.frbr_uri} 
                className="hover:bg-surface/10 transition-colors group cursor-pointer"
                onClick={() => handleDetailClick(doc)}
              >
                
                {/* 1. KOLOM NAMA UU */}
                <td className="px-4 py-3">
                  <div className="max-w-[180px] sm:max-w-[250px] md:max-w-[350px] lg:max-w-[450px] relative group/title">
                    <p className="font-bold text-main text-[10px] leading-relaxed line-clamp-2" title={doc.nama_uu}>
                      {doc.nama_uu}
                    </p>
                  </div>
                </td>

                {/* 2. KOLOM NOMOR */}
                <td className="px-4 py-3 text-[10px] text-main font-medium whitespace-nowrap">
                  {doc.nomor_uu || doc.tahun_uu 
                    ? `${doc.nomor_uu ?? ''} / ${doc.tahun_uu ?? ''}` 
                    : <span className="text-muted opacity-50">-</span>
                  }
                </td>
                
                {/* 3. KOLOM PASAL*/}
                <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                  <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-surface/40 text-main text-[10px] font-bold">
                    {doc.total_chunks || 0}
                  </div>
                </td>
                
                {/* 4. KOLOM KATEGORI */}
                <td className="px-4 py-3 align-middle whitespace-nowrap">
                  <Badge variant="primary">{doc.kategori}</Badge>
                </td>
                
                {/* 5. KOLOM STATUS */}
                <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                  <StatusBadge status={doc.status_hukum} />
                </td>
                
                {/* 6. KOLOM AKSI */}
                <td className="px-4 py-3 align-middle whitespace-nowrap">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button variant="ghost" className="!p-1 text-muted hover:bg-warning/10 hover:text-warning transition-colors" onClick={(e) => { e.stopPropagation(); handleReplaceClick(doc); }}>
                      <MaterialIcon name="sync" className="text-[14px]" />
                    </Button>
                    <Button variant="ghost" className="!p-1 text-muted hover:bg-danger/10 hover:text-danger transition-colors" onClick={(e) => { e.stopPropagation(); handleDeleteClick(doc); }}>
                      <MaterialIcon name="delete" className="text-[14px]" />
                    </Button>
                    <Button variant="ghost" className="!p-1 text-muted hover:bg-primary/10 hover:text-primary-light transition-colors" onClick={(e) => { e.stopPropagation(); handleDetailClick(doc); }}>
                      <MaterialIcon name="arrow_forward" className="text-[14px]" />
                    </Button>
                  </div>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {!loadingDocs && documents.length > 0 && (
        <Pagination 
          page={page} 
          totalPages={totalPages} 
          setPage={setPage} 
          className="p-4 border-t border-surface bg-surface/10"
        />
      )}
    </div>
  );
}