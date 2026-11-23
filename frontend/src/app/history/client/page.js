"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";

import ConsultationCard from "@/components/dashboard/ConsultationCard";
import { MaterialIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { consultationService } from "@/services/consultation.service";
import {
  HistoryFilterBar,
  processHistorySessions,
  useHistoryFilters,
} from "@/components/history/HistoryFilter";

export default function HistoryPage() {
  const router = useRouter();
  const filter = useHistoryFilters("client");

  // --- 1. Fetch Data Riwayat via TanStack Query; filter dan pencarian dikerjakan backend ---
  const { data: history, isLoading, isFetching } = useQuery({
    queryKey: ["history", "client", filter.filters],
    queryFn: () => consultationService.getClientHistory(filter.filters),
    placeholderData: (previousData) => previousData,
  });

  const rawHistory = useMemo(() => history?.data || [], [history]);

  // --- 2. Tanpa filter: pisahkan sesi mendatang dan riwayat lampau. Dengan filter: tampilkan urutan dari backend ---
  const { upcoming, past } = useMemo(() => {
    return processHistorySessions(rawHistory);
  }, [rawHistory]);

  return (
    <AppShell role="client">
        <PageHeader title="Riwayat Konsultasi" />

        <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 lg:px-8 lg:py-6 pb-28 lg:pb-10 min-h-[80vh] scroll-smooth">
          <div className="w-full space-y-5 animate-fade-in">
            <HistoryFilterBar state={filter} searchPlaceholder="Cari nama konsultan..." />

            {/* List Section */}
            <div
              className={`space-y-6 pt-2 transition-opacity duration-300 ${
                isFetching && !isLoading ? "opacity-60" : ""
              }`}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-5">
                  <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                    Memuat Riwayat...
                  </p>
                </div>
              ) : rawHistory.length === 0 && !filter.hasActiveFilter ? (
                <EmptyState
                  icon="history"
                  title="Belum Ada Riwayat Konsultasi"
                  description="Kamu belum memiliki riwayat sesi konsultasi. Temukan konsultan hukum profesional untuk mulai berkonsultasi."
                  actionLabel="Cari Konsultan"
                  actionIcon="search"
                  onAction={() => router.push("/explore")}
                  className="py-16"
                />
              ) : rawHistory.length === 0 ? (
                /* Tidak ada sesi yang cocok dengan pencarian atau filter */
                <EmptyState
                  icon="search_off"
                  title="Tidak Ada Sesi Ditemukan"
                  description="Tidak ada sesi yang cocok dengan pencarian atau filter yang dipilih."
                  actionLabel="Reset Filter"
                  actionIcon="restart_alt"
                  onAction={filter.reset}
                  className="py-12"
                />
              ) : !filter.hasActiveFilter ? (
                /* Mode Kategori: Pisahkan Sesi Mendatang vs Riwayat Lampau */
                <div className="space-y-6">
                  {/* 1. Sesi Mendatang & Berjalan (Waktu terdekat now() di atas) */}
                  {upcoming.length > 0 && (
                    <section className="space-y-3.5">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs sm:text-sm font-bold text-main uppercase tracking-wider font-headline">
                          Sesi Mendatang & Aktif
                        </h3>
                        <span className="text-[11px] font-bold text-secondary-text bg-secondary-soft px-3 py-1 rounded-full border border-secondary/20">
                          {upcoming.length} Sesi
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {upcoming.map((item) => (
                          <ConsultationCard
                            key={item.id_pengajuan}
                            data={item}
                            role="client"
                            onHide={() => { }}
                            onCancel={() => { }}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 2. Seluruh Riwayat */}
                  {past.length > 0 && (
                    <section className="space-y-3.5">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs sm:text-sm font-bold text-main uppercase tracking-wider font-headline">
                          Seluruh Riwayat
                        </h3>
                        <span className="text-[11px] font-bold text-secondary-text bg-secondary-soft px-3 py-1 rounded-full border border-secondary/20">
                          {past.length} Sesi
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {past.map((item) => (
                          <ConsultationCard
                            key={item.id_pengajuan}
                            data={item}
                            role="client"
                            onHide={() => { }}
                            onCancel={() => { }}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                /* Mode Filter Tertentu atau Sedang Melakukan Pencarian */
                <section className="space-y-3.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs sm:text-sm font-bold text-main uppercase tracking-wider font-headline">
                      Hasil Filter
                    </h3>
                    <span className="text-[11px] font-bold text-secondary-text bg-secondary-soft px-3 py-1 rounded-full border border-secondary/20">
                      {rawHistory.length} Sesi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {rawHistory.map((item) => (
                      <ConsultationCard
                        key={item.id_pengajuan}
                        data={item}
                        role="client"
                        onHide={() => { }}
                        onCancel={() => { }}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
    </AppShell>
  );
}
