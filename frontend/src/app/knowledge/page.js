"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/layout/PageHeader";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import SearchBar from "@/components/layout/SearchBar";
import CategoryList from "@/components/dashboard/CategoryList";
import StatCard from "@/components/dashboard/StatCard";
import KnowledgeTable, { Badge } from "@/components/knowledge/KnowledgeTable";
import { FileUpload } from "@/components/ui/FileUpload";

import {
  getAdminDocuments,
  deleteFullDocumentByUri,
  uploadDocumentPdf,
  replaceDocumentPdf,
  getJobStatus,
} from "@/services/admin.service";

import Modal from "@/components/knowledge/Modal";



// --- Main Page Component ---

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [page, setPage] = useState(1);
  const [toastMsg, setToastMsg] = useState(null);
  
  // Background Job State
  const [activeJobId, setActiveJobId] = useState(null);

  const queryClient = useQueryClient();

  // Modals
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  // Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Replace Modal State
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [docToReplace, setDocToReplace] = useState(null);
  const [fileToReplace, setFileToReplace] = useState(null);
  const [replacing, setReplacing] = useState(false);

  const handleReplaceClick = (doc) => {
    setDocToReplace(doc);
    setFileToReplace(null);
    setReplaceModalOpen(true);
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Show Toast Logic (Simple inline toast to match lack of external lib)
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Queries
  const { data: docsData, isLoading: loadingDocs } = useQuery({
    queryKey: ["documents", page, search, activeCategory],
    queryFn: () => getAdminDocuments(page, search, activeCategory),
  });

  const documents = docsData?.data || [];
  const totalDocs = docsData?.total || 0;
  // Based on admin.service.js which uses page_size=20
  const totalPages = Math.max(1, Math.ceil(totalDocs / 20));

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (uri) => deleteFullDocumentByUri(uri),
    onSuccess: () => {
      queryClient.invalidateQueries(["documents"]);
      showToast("Dokumen berhasil dihapus!");
      setConfirmModalOpen(false);
      setDocToDelete(null);
    },
    onError: () => {
      alert("Gagal menghapus dokumen");
      setConfirmModalOpen(false);
    },
  });

  const handleDeleteClick = (doc) => {
    setDocToDelete(doc);
    setConfirmModalOpen(true);
  };

  const confirmDelete = () => {
    if (docToDelete) {
      deleteMutation.mutate(docToDelete.frbr_uri);
    }
  };

  const handleDetailClick = (doc) => {
    router.push(`/knowledge/detail?uri=${encodeURIComponent(doc.frbr_uri)}`);
  };

  const handleUploadFile = async () => {
    if (!fileToUpload) return;
    try {
      setUploading(true);
      const res = await uploadDocumentPdf(fileToUpload);
      setUploadModalOpen(false);
      setFileToUpload(null);

      showToast("File diterima, sedang memproses di background...");

      // Poll status
      const jobId = res.job_id;
      setActiveJobId(jobId);
      
      const poll = setInterval(async () => {
        try {
          const statusRes = await getJobStatus(jobId);
          if (statusRes.status === "completed") {
            clearInterval(poll);
            setActiveJobId(null);
            showToast(statusRes.message || "Proses dokumen selesai!");
            queryClient.invalidateQueries(["documents"]);
          } else if (statusRes.status === "failed") {
            clearInterval(poll);
            setActiveJobId(null);
            alert(`Gagal memproses dokumen: ${statusRes.error}`);
          }
        } catch (e) {
          console.error("Gagal mengecek status", e);
          clearInterval(poll);
          setActiveJobId(null);
          alert("Gagal mengecek status proses dari server.");
        }
      }, 3000);

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Gagal mengunggah dokumen.");
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceFile = async () => {
    if (!fileToReplace || !docToReplace) return;
    try {
      setReplacing(true);
      const res = await replaceDocumentPdf(fileToReplace, docToReplace.frbr_uri);
      setReplaceModalOpen(false);
      setFileToReplace(null);
      setDocToReplace(null);

      showToast("File diterima, sedang mengganti dokumen di background...");

      // Poll status
      const jobId = res.job_id;
      setActiveJobId(jobId);
      
      const poll = setInterval(async () => {
        try {
          const statusRes = await getJobStatus(jobId);
          if (statusRes.status === "completed") {
            clearInterval(poll);
            setActiveJobId(null);
            showToast(statusRes.message || "Proses ganti dokumen selesai!");
            queryClient.invalidateQueries(["documents"]);
          } else if (statusRes.status === "failed") {
            clearInterval(poll);
            setActiveJobId(null);
            alert(`Gagal mengganti dokumen: ${statusRes.error}`);
          }
        } catch (e) {
          console.error("Gagal mengecek status", e);
          clearInterval(poll);
          setActiveJobId(null);
          alert("Gagal mengecek status proses dari server.");
        }
      }, 3000);

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Gagal mengganti dokumen.");
    } finally {
      setReplacing(false);
    }
  };

  const categories = [
    { id: "", label: "Semua Kategori" },
    { id: "pidana", label: "Pidana" },
    { id: "perdata", label: "Perdata" },
    { id: "teknologi_informasi", label: "Teknologi Informasi" },
  ];

  return (
    <div className="bg-bg text-main font-primary min-h-screen flex overflow-hidden transition-colors duration-500 relative">
      <Sidebar role="admin" />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg font-bold text-sm flex items-center gap-2">
            <MaterialIcon name="check_circle" className="text-xl" />
            {toastMsg}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative min-w-0 w-full lg:ml-64 transition-all duration-300">
        <PageHeader title="Manajemen Dokumen" backHref="/dashboard/admin" />

        {activeJobId && (
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 flex items-center justify-center gap-3 animate-pulse">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-primary-light">Sistem sedang memproses ekstraksi dan embedding PDF di latar belakang...</p>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-6 rounded-3xl border border-surface shadow-soft">
              <div>
                <h2 className="text-2xl font-bold text-main tracking-tight font-headline">Knowledge Base</h2>
                <p className="text-muted text-sm mt-1">Kelola dokumen hukum dan data referensi untuk AI.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="primary" onClick={() => { setFileToUpload(null); setUploadModalOpen(true); }}>
                  <MaterialIcon name="add" className="text-lg" />
                  Tambah Dokumen
                </Button>
              </div>
            </div>

            {/* Top Stats & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3 space-y-4">
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  placeholder="Cari nama undang-undang atau dokumen..."
                />
                <CategoryList
                  title=" "
                  categories={categories}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
              </div>
              <StatCard label="Total Dokumen" val={totalDocs} icon="library_books" variant="horizontal" />
            </div>

            {/* Main Table */}
            <KnowledgeTable
              documents={documents}
              loadingDocs={loadingDocs}
              page={page}
              totalPages={totalPages}
              setPage={setPage}
              handleDetailClick={handleDetailClick}
              handleReplaceClick={handleReplaceClick}
              handleDeleteClick={handleDeleteClick}
            />

          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="admin" />
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Hapus Dokumen?"
      >
        <div className="space-y-6">
          <p className="text-sm text-muted">
            Yakin ingin menghapus dokumen <span className="font-bold text-main">{docToDelete?.nama_uu}</span>?
            Semua pasal yang terkait akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              className="flex-1 font-bold !bg-danger !text-white !border-danger hover:!brightness-110"
              onClick={confirmDelete}
              isLoading={deleteMutation.isPending}
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>

      {/* Replace Modal */}
      <Modal
        open={replaceModalOpen}
        onClose={() => setReplaceModalOpen(false)}
        title="Ganti Dokumen (Replace)"
        description={`Upload PDF baru untuk menggantikan ${docToReplace?.nama_uu}`}
      >
        <div className="space-y-6">
          <FileUpload
            file={fileToReplace}
            onChange={(file) => setFileToReplace(file)}
            accept=".pdf"
            maxSizeMB={50}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setReplaceModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleReplaceFile}
              disabled={!fileToReplace || replacing}
              isLoading={replacing}
            >
              Replace
            </Button>
          </div>
        </div>
      </Modal>



      {/* Upload Modal */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Dokumen Baru"
        description="Unggah file PDF dokumen hukum."
      >
        <div className="space-y-6">
          <FileUpload
            file={fileToUpload}
            onChange={(file) => setFileToUpload(file)}
            accept=".pdf"
            maxSizeMB={50}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setUploadModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadFile}
              disabled={!fileToUpload || uploading}
              isLoading={uploading}
            >
              Upload
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
