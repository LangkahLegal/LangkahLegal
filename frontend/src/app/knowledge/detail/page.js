"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import Accordion from "@/components/knowledge/detail/Accordion";
import DocumentCard from "@/components/knowledge/detail/DocumentCard";
import Pagination from "@/components/knowledge/Pagination";

import PageHeader from "@/components/layout/PageHeader";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import SearchBar from "@/components/layout/SearchBar";

import { getDocumentChunks, updateChunk } from "@/services/admin.service";

function KnowledgeDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const uri = searchParams.get("uri");

    const queryClient = useQueryClient();
    const [toastMsg, setToastMsg] = useState(null);
    const [searchChunk, setSearchChunk] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [allExpanded, setAllExpanded] = useState(false);
    const [page, setPage] = useState(1);

    const [activeSaveId, setActiveSaveId] = useState(null);
    const [saveCallback, setSaveCallback] = useState(null);


    
    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchChunk), 500);
        return () => clearTimeout(timer);
    }, [searchChunk]);

    // Reset page to 1 when search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const showToast = (msg, type = "success") => {
        setToastMsg({ text: msg, type });
        setTimeout(() => setToastMsg(null), 3000);
    };

    const { data: chunksData, isLoading, isFetching } = useQuery({
        queryKey: ["chunks", uri, page, 50, debouncedSearch],
        queryFn: () => getDocumentChunks(uri, page, 50, debouncedSearch),
        enabled: !!uri,
        placeholderData: (previousData) => previousData,
    });

    const chunks = chunksData?.data || (Array.isArray(chunksData) ? chunksData : []);
    const total = chunksData?.total || chunks.length;
    const totalPages = Math.max(1, Math.ceil(total / 50));
    const meta = chunks.length > 0 ? chunks[0] : null;

    const filteredChunks = chunks;

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateChunk(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(["chunks", uri]);
            showToast("Berhasil menyimpan perubahan pasal!");
            if (saveCallback) saveCallback();
            setActiveSaveId(null);
            setSaveCallback(null);
        },
        onError: (err) => {
            showToast(err.response?.data?.detail || "Gagal menyimpan perubahan.", "error");
            setActiveSaveId(null);
            setSaveCallback(null);
        }
    });

    const handleSaveEdit = (id, data, onSuccessCb) => {
        setActiveSaveId(id);
        setSaveCallback(() => onSuccessCb);
        updateMutation.mutate({ id, data });
    };

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
                <PageHeader title="Detail Dokumen" backHref="/knowledge" />

                <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-32 pt-8 scroll-smooth w-full">
                    <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in">

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                                    Memuat Data...
                                </p>
                            </div>
                        ) : !meta ? (
                            <div className="py-20 text-center text-muted">
                                <MaterialIcon name="error_outline" className="text-4xl mb-2 opacity-50" />
                                <p>Dokumen tidak ditemukan atau belum ada pasal.</p>
                            </div>
                        ) : (
                            <>
                                <DocumentCard meta={meta} totalChunks={total} />

                                {/* Chunks Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                                    <h3 className="text-2xl font-bold text-main tracking-tight px-2">Daftar Pasal</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-full sm:w-64">
                                            <SearchBar
                                                value={searchChunk}
                                                onChange={setSearchChunk}
                                                placeholder="Cari pasal..."
                                                inputClassName="!h-[42px] !py-0 text-xs !rounded-xl !pl-12 !pr-4 flex items-center"
                                            />
                                        </div>
                                        <Button variant="outline" className="!h-[42px] !py-0 !px-4 !text-xs whitespace-nowrap bg-card shadow-soft flex items-center gap-1" onClick={() => setAllExpanded(!allExpanded)}>
                                            <MaterialIcon name={allExpanded ? "expand_less" : "expand_more"} className="text-[18px]" />
                                            {allExpanded ? "Tutup Semua" : "Buka Semua"}
                                        </Button>

                                    </div>
                                </div>

                                {/* Pagination Top */}
                                {!isLoading && total > 1 && totalPages > 1 && filteredChunks.length > 0 && (
                                    <Pagination
                                        page={page}
                                        totalPages={totalPages}
                                        setPage={setPage}
                                        isFetching={isFetching}
                                        className="py-2 mb-2 mt-2"
                                    />
                                )}

                                {/* Chunks List */}
                                {filteredChunks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted">
                                        <MaterialIcon name="search_off" className="text-4xl mb-2 opacity-50" />
                                        <h3 className="text-lg font-bold text-main">Tidak Ditemukan</h3>
                                        <p className="text-sm text-muted mt-2 max-w-sm text-center">&quot;{searchChunk}&quot; tidak ditemukan pada dokumen ini.</p>
                                    </div>
                                ) : (
                                    <div className={`space-y-3 transition-opacity duration-300 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                        {filteredChunks.map((chunk) => (
                                            <Accordion
                                                key={chunk.id_dokumen}
                                                title={chunk.pasal_bagian}
                                                badge={chunk.node_type}
                                                chunk={chunk}
                                                onSaveEdit={handleSaveEdit}
                                                isSaving={activeSaveId === chunk.id_dokumen && updateMutation.isPending}
                                                isForceOpen={allExpanded}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Pagination Bottom */}
                                {!isLoading && total > 0 && filteredChunks.length > 0 && (
                                    <Pagination
                                        page={page}
                                        totalPages={totalPages}
                                        setPage={setPage}
                                        isFetching={isFetching}
                                        className="py-2 mt-4"
                                    />
                                )}
                            </>
                        )}

                    </div>
                </main>

                <div className="lg:hidden">
                    <BottomNav role="admin" />
                </div>
            </div>

        </div>
    );
}

export default function KnowledgeDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen bg-bg">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <KnowledgeDetailContent />
        </Suspense>
    );
}

