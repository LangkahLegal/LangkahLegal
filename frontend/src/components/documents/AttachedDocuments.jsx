"use client";

import { useState } from "react";
import FileItem from "@/components/ui/FileItem";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button"; // Menggunakan komponen Button Anda

export default function AttachedDocuments({
  documents,
  title,
  showCount = false,
  titleClassName = "font-bold text-lg lg:text-xl text-main", // Ganti text-white ke text-main
  allowDelete = false,
  onDelete = () => {},
}) {
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isLoadingFile, setIsLoadingFile] = useState(true);

  if (!documents || documents.length === 0) return null;

  const isImage = (url, type) => {
    return type === "image" || !!url?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
  };

  return (
    <>
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Header Section */}
        {(title || showCount) && (
          <div className="flex items-center justify-between gap-4">
            {title && <h2 className={titleClassName}>{title}</h2>}

            {showCount && (
              <span className="bg-primary/10 text-primary-light text-[10px] font-bold px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest shrink-0">
                {documents.length} Files
              </span>
            )}
          </div>
        )}

        {/* File List */}
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
          {/* Overlay - Menggunakan bg-bg */}
          <div
            className="absolute inset-0 bg-bg/90 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            onClick={() => setPreviewDoc(null)}
          ></div>

          {/* Modal Content - Menggunakan bg-card dan shadow-soft */}
          <div className="relative w-full max-w-5xl bg-card rounded-[2.5rem] shadow-soft flex flex-col h-[85vh] sm:h-[90vh] ring-1 ring-surface overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header - Menggunakan bg-input */}
            <div className="flex items-center justify-between px-6 py-5 bg-input border-b border-surface z-10">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-bg border border-surface flex items-center justify-center shrink-0 shadow-inner">
                  <MaterialIcon
                    name={
                      isImage(previewDoc.url, previewDoc.type)
                        ? "image"
                        : "picture_as_pdf"
                    }
                    className={`text-lg ${isImage(previewDoc.url, previewDoc.type) ? "text-amber-400" : "text-danger"}`}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-main font-bold text-sm sm:text-base truncate">
                    {previewDoc.name}
                  </h3>
                  <p className="text-[10px] text-muted mt-0.5 font-medium uppercase tracking-wider">
                    {previewDoc.size} •{" "}
                    {isImage(previewDoc.url, previewDoc.type)
                      ? "Image Viewer"
                      : "PDF Viewer"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-4">
                {/* Desktop "Open in New" menggunakan Button variant icon */}
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:block"
                >
                  <Button
                    variant="icon"
                    className="!bg-surface text-muted hover:text-main"
                  >
                    <MaterialIcon name="open_in_new" className="text-base" />
                  </Button>
                </a>

                <div className="w-px h-6 bg-surface mx-1 hidden sm:block"></div>

                {/* Close Button menggunakan Button variant danger (ghostly) */}
                <Button
                  variant="ghost"
                  onClick={() => setPreviewDoc(null)}
                  className="!p-0 !w-10 !h-10 hover:!bg-danger/10 hover:!text-danger transition-all group"
                >
                  <MaterialIcon
                    name="close"
                    className="group-hover:rotate-90 transition-transform duration-300"
                  />
                </Button>
              </div>
            </div>

            {/* Viewer Content - Menggunakan bg-bg */}
            <div className="flex-1 relative bg-bg overflow-hidden flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, var(--color-main) 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              ></div>

              {isLoadingFile && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg z-10">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-soft"></div>
                  <p className="text-[10px] text-primary-light font-bold mt-4 animate-pulse uppercase tracking-widest">
                    Memuat dokumen...
                  </p>
                </div>
              )}

              {isImage(previewDoc.url, previewDoc.type) ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-w-[90%] max-h-[90%] object-contain rounded-xl shadow-2xl z-0"
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

            {/* Mobile Footer Action */}
            <div className="sm:hidden px-5 py-4 border-t border-surface bg-input flex justify-center">
              <Button
                variant="primary"
                fullWidth
                onClick={() => window.open(previewDoc.url, "_blank")}
                className="!py-3 shadow-soft"
              >
                <MaterialIcon name="open_in_new" className="text-sm" />
                <span className="text-xs uppercase tracking-widest">
                  Buka di Browser
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
