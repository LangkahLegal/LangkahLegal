"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/layout/PageHeader";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import SearchBar from "@/components/layout/SearchBar";
import CategoryList from "@/components/dashboard/CategoryList";
import StatCard from "@/components/dashboard/StatCard";
import KnowledgeTable from "@/components/knowledge/KnowledgeTable";

import { getAdminDocuments } from "@/services/admin.service";

import UploadDocumentModal from "@/components/knowledge/modals/UploadDocumentModal";
import ReplaceDocumentModal from "@/components/knowledge/modals/ReplaceDocumentModal";
import DeleteDocumentModal from "@/components/knowledge/modals/DeleteDocumentModal";

export default function KnowledgeBasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [page, setPage] = useState(1);
  const [toastMsg, setToastMsg] = useState(null);

  // Background Job State
  const [activeJobId, setActiveJobId] = useState(null);

  // Modals
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [docToReplace, setDocToReplace] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Show Toast Logic
  const showToast = (msg, type = "success") => {
    setToastMsg({ text: msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Queries
  const { data: docsData, isLoading: loadingDocs } = useQuery({
    queryKey: ["documents", page, search, activeCategory],
    queryFn: () => getAdminDocuments(page, search, activeCategory),
  });

  const documents = docsData?.data || [];
  const totalDocs = docsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalDocs / 20));

  // Handlers
  const handleDeleteClick = (doc) => {
    setDocToDelete(doc);
    setConfirmModalOpen(true);
  };

  const handleReplaceClick = (doc) => {
    setDocToReplace(doc);
    setReplaceModalOpen(true);
  };

  const handleDetailClick = (doc) => {
    router.push(`/knowledge/detail?uri=${encodeURIComponent(doc.frbr_uri)}`);
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
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in shadow-xl">
          <div className={`px-6 py-3 rounded-2xl border font-bold text-sm flex items-center gap-2 transition-colors duration-300 ${
            toastMsg.type === 'error' 
              ? 'bg-danger/10 border-danger/30 text-danger' 
              : 'bg-primary/10 border-primary/30 text-primary-dark dark:text-primary-light'
          }`}>
            <MaterialIcon name={toastMsg.type === 'error' ? 'error' : 'check_circle'} className="text-xl" />
            {toastMsg.text}
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
                <Button variant="primary" onClick={() => setUploadModalOpen(true)}>
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

      <UploadDocumentModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        setActiveJobId={setActiveJobId}
        showToast={showToast}
      />

      <ReplaceDocumentModal
        open={replaceModalOpen}
        onClose={() => setReplaceModalOpen(false)}
        docToReplace={docToReplace}
        setActiveJobId={setActiveJobId}
        showToast={showToast}
      />

      <DeleteDocumentModal
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setDocToDelete(null);
        }}
        docToDelete={docToDelete}
        showToast={showToast}
      />
    </div>
  );
}

