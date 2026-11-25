"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import Accordion from "@/components/knowledge/detail/Accordion";
import DocumentCard from "@/components/knowledge/detail/DocumentCard";
import Pagination from "@/components/knowledge/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";

import PageHeader from "@/components/layout/PageHeader";
import AppShell from "@/components/layout/AppShell";
import SearchBar from "@/components/layout/SearchBar";

import { getDocumentChunks, updateChunk } from "@/services/admin.service";
import { useToast } from "@/providers/FeedbackProvider";

function KnowledgeDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const uri = searchParams.get("uri");

    const queryClient = useQueryClient();
    const toast = useToast();
    const [searchChunk, setSearchChunk] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [allExpanded, setAllExpanded] = useState(false);
    const [page, setPage] = useState(1);

    const [activeSaveId, setActiveSaveId] = useState(null);
    const [saveCallback, setSaveCallback] = useState(null);


    
    // Debounce search effect — also resets page inside the callback to avoid a synchronous setState in effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchChunk);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchChunk]);

    const showToast = (msg, type = "success") => toast[type](msg);

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
        <AppShell
            role="admin"
            className="relative"
            contentClassName="w-full"
        >
                <PageHeader title="Detail Dokumen" backHref="/knowledge" />

                <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-32 pt-8 scroll-smooth w-full">
                    <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in">

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-5">
                                <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                                    Memuat Data Knowledge Base...
                                </p>
                            </div>
                        ) : !meta ? (
                            <EmptyState
                                icon="error_outline"
                                title="Tidak Ada Data"
                                description="Dokumen tidak ditemukan atau belum ada pasal."
                                className="py-20"
                                testId="knowledge-detail-empty"
                            />
                        ) : (
                            <>
                                <DocumentCard meta={meta} totalChunks={total} />

                                {/* Chunks Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                                    <h3 data-testid="knowledge-article-list-title" className="text-2xl font-bold text-main tracking-tight px-2">Daftar Pasal</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-full sm:w-64">
                                            <SearchBar
                                                value={searchChunk}
                                                onChange={setSearchChunk}
                                                placeholder="Cari pasal..."
                                                inputClassName="!h-[42px] !py-0 text-xs !rounded-xl !pl-12 !pr-4 flex items-center"
                                            />
                                        </div>
                                        <Button variant="outline" data-testid="knowledge-toggle-all-btn" className="!h-[42px] !py-0 !px-4 !text-xs whitespace-nowrap bg-card shadow-soft flex items-center gap-1" onClick={() => setAllExpanded(!allExpanded)}>
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
                                    <EmptyState
                                        icon="search_off"
                                        title="Tidak Ditemukan"
                                        description={`"${searchChunk}" tidak ditemukan pada dokumen ini.`}
                                        className="py-12"
                                    />
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
        </AppShell>
    );
}

export default function KnowledgeDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen bg-bg">
                    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5">
                        <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                            Memuat Data Knowledge Base...
                        </p>
                    </div>
                </div>
            }
        >
            <KnowledgeDetailContent />
        </Suspense>
    );
}

