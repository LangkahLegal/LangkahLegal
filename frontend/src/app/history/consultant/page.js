"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { consultantService } from "@/services/consultant.service";
import { useTheme } from "@/providers/ThemeProvider";
import HistoryFilter, {
  CONSULTANT_HISTORY_FILTERS,
  processHistorySessions,
  isSessionPast,
} from "@/components/history/HistoryFilter";

export default function ConsultantHistoryPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState("semua");
  const [search, setSearch] = useState("");

  // Mapping warna untuk UI Avatars
  const themeColors = {
    "dark-tech": { bg: "1f1d35", color: "ada3ff" },
    "theme-cyber-slate": { bg: "17203a", color: "29d1ff" },
    "theme-white-modern": { bg: "f3f1eb", color: "2d1e17" },
  };
  const activeColors = themeColors[theme] || themeColors["dark-tech"];

  // --- 1. Fetch Riwayat via TanStack Query ---
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["history", "consultant"],
    queryFn: consultantService.getHistory,
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
          foto_profil:
            req.foto_profil ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              req.nama_klien || "K",
            )}&background=${activeColors.bg}&color=${activeColors.color}`,
        },
      },
    }));
  }, [historyData, activeColors]);

  const { upcoming, past, allSorted } = useMemo(() => {
    return processHistorySessions(
      formattedRaw,
      activeFilter,
      search,
      "consultant"
    );
  }, [formattedRaw, activeFilter, search]);

  const activeFilterLabel =
    CONSULTANT_HISTORY_FILTERS.find((f) => f.id === activeFilter)?.label ||
    "Semua";

  return (
    <div className="bg-bg text-main min-h-screen flex overflow-hidden font-primary transition-colors duration-500">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 transition-all duration-300">
        <PageHeader title="Riwayat Konsultasi" />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-6 lg:px-10 lg:py-8 pb-32 lg:pb-12 min-h-[80vh] scroll-smooth">
          <div className="w-full max-w-full lg:max-w-[1600px] space-y-6 animate-fade-in">
            {/* Search Bar & Tombol Kategorisasi */}
            {!isLoading && (
              <HistoryFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Cari nama klien..."
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                filterOptions={CONSULTANT_HISTORY_FILTERS}
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
              ) : formattedRaw.length === 0 ? (
                <EmptyState
                  icon="history"
                  title="Belum Ada Riwayat Sesi"
                  description="Belum ada riwayat sesi konsultasi yang selesai atau diajukan."
                  actionLabel="Lihat Jadwal Saya"
                  actionIcon="calendar_today"
                  onAction={() => router.push("/schedule/consultant")}
                  className="py-16"
                />
              ) : allSorted.length === 0 ? (
                <EmptyState
                  icon="search_off"
                  title="Tidak Ada Sesi Ditemukan"
                  description={
                    search
                      ? `Tidak ditemukan sesi dengan klien "${search}".`
                      : `Belum ada sesi dengan status "${activeFilterLabel}".`
                  }
                  className="py-12"
                />
              ) : activeFilter === "semua" && !search ? (
                /* Mode Kategori: Pisahkan Sesi Mendatang vs Seluruh Riwayat */
                <div className="space-y-8">
                  {/* 1. Sesi Mendatang & Berjalan */}
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
                                role="consultant"
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
                            role="consultant"
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
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}
