"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";

import ConsultationCard from "@/components/dashboard/ConsultationCard";
import { MaterialIcon } from "@/components/ui/Icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { consultationService } from "@/services/consultation.service";
import HistoryFilter, {
  CLIENT_HISTORY_FILTERS,
  processHistorySessions,
  isSessionPast,
} from "@/components/history/HistoryFilter";

export default function HistoryPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("semua");
  const [search, setSearch] = useState("");

  // --- 1. Fetch Data Riwayat via TanStack Query ---
  const { data: history, isLoading } = useQuery({
    queryKey: ["history", "client"],
    queryFn: consultationService.getClientHistory,
  });

  const rawHistory = useMemo(() => history?.data || [], [history]);

  // --- 2. Pemrosesan Data: Filter status, Search nama konsultan, dan Sort now() via Reusable Helper ---
  const { upcoming, past, allSorted } = useMemo(() => {
    return processHistorySessions(rawHistory, activeFilter, search, "client");
  }, [rawHistory, activeFilter, search]);

  const activeFilterLabel =
    CLIENT_HISTORY_FILTERS.find((f) => f.id === activeFilter)?.label ||
    "Semua";

  return (
    <div className="bg-bg text-main min-h-screen flex overflow-hidden font-primary transition-colors duration-500">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 transition-all duration-300">
        <PageHeader title="Riwayat Konsultasi" />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-6 lg:px-10 lg:py-8 pb-32 lg:pb-12 min-h-[80vh] scroll-smooth">
          <div className="w-full max-w-full lg:max-w-[1600px] space-y-6 animate-fade-in">
            {/* Search Bar & Tombol Kategorisasi (Komponen Reusable HistoryFilter) */}
            {!isLoading && (
              <HistoryFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Cari nama konsultan..."
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                filterOptions={CLIENT_HISTORY_FILTERS}
              />
            )}

            {/* List Section */}
            <div className="space-y-6 pt-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-5">
                  <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                    Memuat Riwayat...
                  </p>
                </div>
              ) : rawHistory.length === 0 ? (
                <EmptyState
                  icon="history"
                  title="Belum Ada Riwayat Konsultasi"
                  description="Kamu belum memiliki riwayat sesi konsultasi. Temukan konsultan hukum profesional untuk mulai berkonsultasi."
                  actionLabel="Cari Konsultan"
                  actionIcon="search"
                  onAction={() => router.push("/explore")}
                  className="py-16"
                />
              ) : allSorted.length === 0 ? (
                /* Empty state saat hasil search / filter tidak ditemukan */
                <EmptyState
                  icon="search_off"
                  title="Tidak Ada Sesi Ditemukan"
                  description={
                    search
                      ? `Tidak ditemukan sesi dengan konsultan "${search}".`
                      : `Belum ada sesi dengan status "${activeFilterLabel}".`
                  }
                  className="py-12"
                />
              ) : activeFilter === "semua" && !search ? (
                /* Mode Kategori: Pisahkan Sesi Mendatang vs Riwayat Lampau */
                <div className="space-y-8">
                  {/* 1. Sesi Mendatang & Berjalan (Waktu terdekat now() di atas) */}
                  {upcoming.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs sm:text-sm font-bold text-main uppercase tracking-wider font-headline">
                          Sesi Mendatang & Aktif
                        </h3>
                        <span className="text-[11px] font-bold text-primary-light bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                          {upcoming.length} Sesi
                        </span>
                      </div>

                      <div className="space-y-4">
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
                    <section className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs sm:text-sm font-bold text-main uppercase tracking-wider font-headline">
                          Seluruh Riwayat
                        </h3>
                        <span className="text-[11px] font-bold text-primary-light bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                          {past.length} Sesi
                        </span>
                      </div>

                      <div className="space-y-4">
                        {past.map((item) => {
                          const isPast = isSessionPast(item);
                          return (
                            <div
                              key={item.id_pengajuan}
                              className={
                                isPast
                                  ? "opacity-70 hover:opacity-100 transition-opacity duration-300"
                                  : ""
                              }
                            >
                              <ConsultationCard
                                data={item}
                                role="client"
                                onHide={() => { }}
                                onCancel={() => { }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                /* Mode Filter Tertentu atau Sedang Melakukan Pencarian */
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs sm:text-sm font-bold text-main uppercase tracking-wider font-headline">
                      {search
                        ? `Hasil Pencarian "${search}"`
                        : `Daftar ${activeFilterLabel}`}
                    </h3>
                    <span className="text-[11px] font-bold text-primary-light bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      {allSorted.length} Sesi
                    </span>
                  </div>

                  <div className="space-y-4">
                    {allSorted.map((item) => {
                      const isPast = isSessionPast(item);
                      return (
                        <div
                          key={item.id_pengajuan}
                          className={
                            isPast
                              ? "opacity-70 hover:opacity-100 transition-opacity duration-300"
                              : ""
                          }
                        >
                          <ConsultationCard
                            data={item}
                            role="client"
                            onHide={() => { }}
                            onCancel={() => { }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
