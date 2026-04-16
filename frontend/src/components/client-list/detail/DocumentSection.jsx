import { MaterialIcon } from "@/components/ui/Icons";

export default function DocumentSection({ documents }) {
  return (
    <div className="space-y-4 min-w-0 w-full">
      <h3 className="text-xs font-bold text-[#aca8c1] uppercase tracking-widest px-2">
        Dokumen Terlampir
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <DocumentItem 
              key={doc.id_dokumen}
              name={doc.nama_dokumen}
              url={doc.file_url}
              type={doc.tipe_file}
              size={doc.ukuran_kb}
            />
          ))
        ) : (
          <div className="bg-[#1f1d35] p-5 rounded-[2rem] border border-white/5 text-center">
            <p className="text-sm text-[#aca8c1] italic">Tidak ada dokumen yang diunggah.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentItem({ name, url, type, size }) {
  // Format tipe file dari mime-type (contoh: application/pdf -> PDF)
  const fileExtension = type ? type.split('/')[1]?.toUpperCase() : 'FILE';

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="bg-[#1f1d35] p-4 rounded-[1.5rem] border border-white/5 flex items-center justify-between hover:bg-[#2c2945] transition-all group shadow-md"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#6f59fe]/20 flex items-center justify-center">
          <MaterialIcon 
            name="description" 
            className="text-[#ada3ff] text-xl" 
          />
        </div>
        <div className="min-w-0 flex flex-col">
          <span className="text-sm font-bold text-white truncate">{name}</span>
          <span className="text-[10px] text-[#aca8c1] uppercase font-medium">
            {fileExtension} • {size} KB
          </span>
        </div>
      </div>
      <div className="w-8 h-8 flex items-center justify-center rounded-full group-hover:bg-[#6f59fe]/20 transition-colors">
        <MaterialIcon name="download" className="text-[#aca8c1] group-hover:text-[#ada3ff] text-lg" />
      </div>
    </a>
  );
}