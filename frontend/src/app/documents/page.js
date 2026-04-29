"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/layout/SearchBar";
import Filter from "@/components/layout/Filter";
import { FileUpload } from "@/components/ui";

import FileItem from "@/components/ui/FileItem";
import SecurityNotice from "@/components/documents/SecurityNotice";
import AttachedDocuments from "@/components/documents/AttachedDocuments";
import { consultationService } from "@/services/consultation.service";

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const idPengajuan = searchParams.get("id_pengajuan");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  // Fetch dokumen dari API
  const fetchDocuments = async () => {
    if (!idPengajuan) return;
    try {
      setIsLoading(true);
      const response = await consultationService.getDocuments(idPengajuan);
      const rawDocs = response?.data || []; // Safety check null/undefined
      const formattedDocs = rawDocs.map((doc) => ({
        id: doc.id_dokumen,
        name: doc.nama_dokumen || "Untitled Document",
        date: doc.created_at
          ? new Date(doc.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "-",
        size:
          doc.ukuran_kb >= 1024
            ? `${(doc.ukuran_kb / 1024).toFixed(1)} MB`
            : `${doc.ukuran_kb || 0} KB`,
        type: doc.tipe_file?.includes("pdf") ? "pdf" : "image",
        url: doc.file_url,
      }));
      setDocuments(formattedDocs);
    } catch (error) {
      console.error("Gagal memuat dokumen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [idPengajuan]);

  // Upload dokumen baru
  const handleUpload = async () => {
    if (!selectedFiles || !idPengajuan) return;
    try {
      setIsUploading(true);
      setUploadMessage(null);
      const filesArray = Array.isArray(selectedFiles)
        ? selectedFiles
        : [selectedFiles];
      const result = await consultationService.uploadDocuments(
        idPengajuan,
        filesArray,
      );
      setUploadMessage(result?.message || "Upload berhasil");
      setSelectedFiles(null);
      await fetchDocuments();
    } catch (error) {
      setUploadMessage("Gagal mengunggah dokumen.");
    } finally {
      setIsUploading(false);
    }
  };

  // Hapus dokumen
  const handleDelete = async (id_dokumen) => {
    if (!idPengajuan || !id_dokumen) return;
    try {
      await consultationService.deleteDocument(idPengajuan, id_dokumen);
      await fetchDocuments();
    } catch (error) {
      console.error("Gagal menghapus dokumen:", error);
    }
  };

  const filteredFiles = documents.filter((file) =>
    (file.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    /* REFACTOR: bg-bg | text-main | transition-colors | font-primary */
    <div className="bg-bg text-main min-h-screen flex overflow-hidden font-primary transition-colors duration-500">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Documents" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-10 animate-fade-in">
            {/* Area Upload */}
            {idPengajuan && (
              <div className="space-y-4">
                <FileUpload file={selectedFiles} onChange={setSelectedFiles} />
                {selectedFiles && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    /* REFACTOR: bg-primary | hover:opacity-90 */
                    className="w-full py-4 bg-primary hover:opacity-90 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? "Mengunggah..." : "Upload Dokumen"}
                  </button>
                )}
                {uploadMessage && (
                  /* REFACTOR: text-primary-light */
                  <p className="text-sm text-center text-primary-light font-medium animate-pulse">
                    {uploadMessage}
                  </p>
                )}
              </div>
            )}

            {/* Empty State (No ID) */}
            {!idPengajuan && (
              /* REFACTOR: bg-card/30 | border-surface | text-muted */
              <div className="text-center py-12 px-6 text-muted text-sm bg-card/30 rounded-[2rem] border border-surface border-dashed">
                <p className="max-w-xs mx-auto leading-relaxed">
                  Pilih pengajuan konsultasi terlebih dahulu untuk melihat dan
                  mengelola dokumen.
                </p>
              </div>
            )}

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Cari dokumen..."
                />
              </div>
              <Filter onClick={() => console.log("Filter open")} />
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                {/* REFACTOR: border-primary */}
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-primary-light font-medium animate-pulse uppercase tracking-widest text-[10px]">
                  Memuat dokumen...
                </p>
              </div>
            ) : (
              <AttachedDocuments
                documents={filteredFiles}
                title="All Documents"
                showCount={true}
                allowDelete={!!idPengajuan}
                onDelete={handleDelete}
              />
            )}

            <SecurityNotice />
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
