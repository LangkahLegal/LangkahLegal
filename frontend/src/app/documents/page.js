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

  // Fetch dokumen dari API jika ada id_pengajuan
  const fetchDocuments = async () => {
    if (!idPengajuan) return;
    try {
      setIsLoading(true);
      const response = await consultationService.getDocuments(idPengajuan);
      const rawDocs = response.data || [];
      const formattedDocs = rawDocs.map((doc) => ({
        id: doc.id_dokumen,
        name: doc.nama_dokumen,
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
            : `${doc.ukuran_kb} KB`,
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
      setUploadMessage(result.message);
      setSelectedFiles(null);
      // Refresh daftar dokumen
      await fetchDocuments();
    } catch (error) {
      setUploadMessage("Gagal mengunggah dokumen.");
    } finally {
      setIsUploading(false);
    }
  };

  // Hapus dokumen
  const handleDelete = async (id_dokumen) => {
    if (!idPengajuan) return;
    try {
      await consultationService.deleteDocument(idPengajuan, id_dokumen);
      // Refresh daftar dokumen
      await fetchDocuments();
    } catch (error) {
      console.error("Gagal menghapus dokumen:", error);
    }
  };

  const filteredFiles = documents.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden font-['Inter',sans-serif]">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Documents" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Hanya tampilkan area upload jika ada id_pengajuan */}
            {idPengajuan && (
              <div className="space-y-4">
                <FileUpload file={selectedFiles} onChange={setSelectedFiles} />
                {selectedFiles && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full py-3 bg-[#6f59fe] hover:bg-[#5b48db] text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? "Mengunggah..." : "Upload Dokumen"}
                  </button>
                )}
                {uploadMessage && (
                  <p className="text-sm text-center text-[#ada3ff]">
                    {uploadMessage}
                  </p>
                )}
              </div>
            )}

            {!idPengajuan && (
              <div className="text-center py-10 text-[#aca8c1] text-sm bg-[#1f1d35]/30 rounded-3xl border border-white/5 border-dashed">
                <p>
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

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-[#6D57FC] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#ada3ff] animate-pulse">
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
