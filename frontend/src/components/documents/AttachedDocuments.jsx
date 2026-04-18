"use client";

import { useState } from "react";
import FileItem from "@/components/ui/FileItem";
import { MaterialIcon } from "@/components/ui/Icons";

export default function AttachedDocuments({ 
  documents, 
  title, 
  showCount = false,
  titleClassName = "font-bold text-lg lg:text-xl text-white",
  allowDelete = false,
  onDelete = () => {}
}) {
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(true);

  if (!documents || documents.length === 0) {
    return null; 
  }

  const isImage = (url, type) => {
    return type === 'image' || !!url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
  };

  return (
    <>
      <section className="space-y-4">
        
        {/* Render area header HANYA jika ada title ATAU showCount yang ingin ditampilkan */}
        {(title || showCount) && (
          <div className={`flex items-center ${showCount && title ? 'justify-between' : (showCount ? 'justify-end' : '')}`}>
            {/* Tampilkan H2 hanya jika prop title diisi */}
            {title && (
              <h2 className={titleClassName}>
                {title}
              </h2>
            )}
            
            {showCount && (
              <span className="bg-[#6f59fe]/10 text-[#ada3ff] text-[10px] font-bold px-3 py-1 rounded-full border border-[#6f59fe]/20 uppercase tracking-widest">
                {documents.length} Files
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {documents.map((doc) => (
            <FileItem
              key={doc.id}
              file={doc}
              onClick={() => {
                setPreviewDoc(doc);
                setIsLoadingFile(true);
              }}
              allowDelete={allowDelete} 
              onDelete={() => onDelete(doc.id)} 
            />
          ))}
        </div>
      </section>

      {/* --- MODAL PREVIEW DOKUMEN --- */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          
          <div 
            className="absolute inset-0 bg-[#080710]/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={() => setPreviewDoc(null)}
          ></div>

          <div className="relative w-full max-w-5xl bg-[#151326] rounded-[32px] shadow-[0_0_60px_-15px_rgba(111,89,254,0.3)] flex flex-col h-[85vh] sm:h-[90vh] ring-1 ring-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            
            <div className="flex items-center justify-between px-6 py-5 bg-[#1f1d35] border-b border-white/5 z-10">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-[#0e0c1e] border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                  <MaterialIcon 
                    name={isImage(previewDoc.url, previewDoc.type) ? "image" : "picture_as_pdf"} 
                    className={`text-lg ${isImage(previewDoc.url, previewDoc.type) ? "text-amber-400" : "text-red-400"}`} 
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-base truncate">
                    {previewDoc.name}
                  </h3>
                  <p className="text-xs text-[#aca8c1] mt-0.5">
                    {previewDoc.size} • {isImage(previewDoc.url, previewDoc.type) ? "Image Viewer" : "PDF Viewer"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-4">
                <a 
                  href={previewDoc.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-[#aca8c1] hover:text-white rounded-xl transition-colors text-sm font-bold border border-transparent hover:border-white/10"
                  title="Buka di Tab Baru"
                >
                  <MaterialIcon name="open_in_new" className="text-sm" />
                </a>
                
                <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-10 h-10 bg-white/5 hover:bg-rose-500/20 text-[#aca8c1] hover:text-rose-400 rounded-xl transition-all flex items-center justify-center border border-transparent hover:border-rose-500/30 group"
                  title="Tutup Preview"
                >
                  <MaterialIcon name="close" className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative bg-[#0a0914] overflow-hidden flex items-center justify-center group/preview">
              
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

              {isLoadingFile && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0914] z-10">
                  <div className="w-12 h-12 border-4 border-[#6f59fe]/20 border-t-[#6f59fe] rounded-full animate-spin shadow-[0_0_20px_rgba(111,89,254,0.3)]"></div>
                  <p className="text-sm text-[#ada3ff] font-medium mt-4 animate-pulse">Memuat dokumen...</p>
                </div>
              )}

              {isImage(previewDoc.url, previewDoc.type) ? (
                <img 
                  src={previewDoc.url} 
                  alt={previewDoc.name} 
                  className="max-w-[95%] max-h-[95%] object-contain rounded-xl shadow-2xl z-0 transition-opacity duration-500"
                  onLoad={() => setIsLoadingFile(false)} 
                  onError={() => setIsLoadingFile(false)}
                />
              ) : (
                <iframe 
                  src={previewDoc.url} 
                  className="w-full h-full border-0 z-0 bg-white" 
                  title={previewDoc.name} 
                  onLoad={() => setIsLoadingFile(false)} 
                />
              )}
            </div>

            <div className="sm:hidden px-5 py-4 border-t border-white/5 bg-[#1f1d35] flex justify-center">
              <a 
                href={previewDoc.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#353050] hover:bg-[#5b48db] text-white rounded-xl transition-colors font-bold shadow-lg"
              >
                <MaterialIcon name="open_in_new" className="text-sm" />
                Buka di Browser
              </a>
            </div>

          </div>
        </div>
      )}
    </>
  );
}