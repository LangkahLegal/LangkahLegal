"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/layout/PageHeader";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { consultantService } from "@/services/consultant.service";
import {
  HistoryFilterBar,
  processHistorySessions,
  useHistoryFilters,
} from "@/components/history/HistoryFilter";

export default function ConsultantHistoryPage() {
  const router = useRouter();
  const filter = useHistoryFilters("consultant");

  // --- 1. Fetch Riwayat via TanStack Query; filter dan pencarian dikerjakan backend ---
  const { data: historyData, isLoading, isFetching } = useQuery({
    queryKey: ["history", "consultant", filter.filters],
    queryFn: () => consultantService.getHistory(filter.filters),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  // --- 2. Transformasi & Pemrosesan Data (Search, Filter, Kategori, Sort) ---
  const formattedRaw = useMemo(() => {
    if (!historyData) return [];
    const rawData = historyData.data || [];

    return rawData.map((req) => ({
      id_pengajuan: req.id_pengajuan,
      id_bursa: req.id_bursa || null,
      status_pengajuan: req.status,
      nominal_consultant: req.nominal_konsultan || 0,
      jam_mulai: req.jam_mulai || null,
      jam_selesai: req.jam_selesai || null,
      tanggal_pengajuan: req.tanggal_konsultasi || null,
      tanggal_konsultasi: req.tanggal_konsultasi || null,
      nama_klien: req.nama_klien,
      jadwal_ketersediaan: {
        tanggal: req.tanggal_konsultasi || null,
        jam_mulai: req.jam_mulai || null,
        jam_selesai: req.jam_selesai || null,
        konsultan: {
          nama_lengkap: req.nama_klien || "Klien Anonim",
          foto_profil: req.foto_profil || null,
        },
      },
    }));
  }, [historyData]);

  // Tanpa filter: pisahkan sesi mendatang dan riwayat lampau. Dengan filter: tampilkan urutan dari backend.
  const { upcoming, past } = useMemo(() => {
    return processHistorySessions(formattedRaw);
  }, [formattedRaw]);

  return (
    <AppShell role="konsultan">
        <PageHeader title="Riwayat Konsultasi" />

        <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 lg:px-8 lg:py-6 pb-28 lg:pb-10 min-h-[80vh] scroll-smooth">
          <div className="w-full space-y-5 animate-fade-in">
            <HistoryFilterBar state={filter} searchPlaceholder="Cari nama klien..." />

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
              ) : formattedRaw.length === 0 && !filter.hasActiveFilter ? (
                <EmptyState
                  icon="history"
                  title="Belum Ada Riwayat Sesi"
                  description="Belum ada riwayat sesi konsultasi yang selesai atau diajukan."
                  actionLabel="Lihat Jadwal Saya"
                  actionIcon="calendar_today"
                  onAction={() => router.push("/schedule/consultant")}
                  className="py-16"
                />
              ) : formattedRaw.length === 0 ? (
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
                /* Mode Kategori: Pisahkan Sesi Mendatang vs Seluruh Riwayat */
                <div className="space-y-6">
                  {/* 1. Sesi Mendatang & Berjalan */}
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
                            role="consultant"
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
                            role="consultant"
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
                      {formattedRaw.length} Sesi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {formattedRaw.map((item) => (
                      <ConsultationCard
                        key={item.id_pengajuan}
                        data={item}
                        role="consultant"
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
