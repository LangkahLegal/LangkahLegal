"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/layout/SearchBar";
import FilterPanel from "@/components/layout/FilterPanel";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import { consultantService } from "@/services/consultant.service";
import { EmptyState } from "@/components/ui/EmptyState";
import { JADWAL_OPTIONS, WAKTU_OPTIONS, defaultFilterValues } from "@/lib/filterOptions";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

// Pilihan filter; id-nya dikirim apa adanya ke backend (GET /consultants/me/requests/active).
const FILTER_DROPDOWNS = [
  {
    key: "status",
    icon: "pending_actions",
    options: [
      { id: "semua", label: "Semua", triggerLabel: "Status" },
      { id: "terjadwal", label: "Terjadwal" },
      { id: "menunggu_pembayaran", label: "Menunggu Bayar" },
    ],
  },
  { key: "jadwal", icon: "event", options: JADWAL_OPTIONS },
  { key: "waktu", icon: "schedule", options: WAKTU_OPTIONS },
  {
    key: "urutkan",
    icon: "sort",
    options: [
      { id: "terbaru", label: "Terbaru" },
      { id: "terlama", label: "Terlama" },
      { id: "jadwal_terdekat", label: "Jadwal Terdekat", triggerLabel: "Terdekat" },
      { id: "jadwal_terjauh", label: "Jadwal Terjauh", triggerLabel: "Terjauh" },
    ],
  },
];

const DEFAULT_OPTIONS = defaultFilterValues(FILTER_DROPDOWNS);

export default function ConsultantClientsPage() {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  // --- 1. Fetch Data: filter, pencarian, dan urutan dikerjakan backend ---
  const filters = { search: debouncedSearch, ...options };

  const {
    data: clients = [],
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: ["activeRequests", filters],
    queryFn: () => consultantService.getActiveRequests(filters),
    placeholderData: (previousData) => previousData,
    select: (data) =>
      data.map((item) => ({
        id_pengajuan: item.id_pengajuan,
        status_pengajuan: item.status_pengajuan,
        nominal_konsultan: item.nominal_konsultan || 0,
        jam_mulai: item.jam_mulai,
        jam_selesai: item.jam_selesai,
        jadwal_ketersediaan: {
          tanggal: item.tanggal_pengajuan,
          konsultan: {
            nama_lengkap: item.users?.nama || "Klien",
            foto_profil: item.users?.foto_profil,
          },
        },
      })),
  });

  const hasActiveFilter =
    search.trim() !== "" ||
    FILTER_DROPDOWNS.some(({ key }) => options[key] !== DEFAULT_OPTIONS[key]);

  const resetFilters = () => {
    setSearch("");
    setOptions(DEFAULT_OPTIONS);
  };

  return (
    <div className="bg-bg text-main min-h-screen flex overflow-x-hidden font-primary w-full transition-colors duration-500">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 w-full transition-all duration-300">
        <PageHeader title="Daftar Klien" />

        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8 pb-32 lg:pb-12 scroll-smooth w-full">
          <div className="w-full max-w-[1600px] mx-auto space-y-8 animate-fade-in">
            {/* Stats Header */}
            <div className="space-y-1 px-1">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                Klien Aktif
              </p>
              <h2 className="text-3xl font-black text-main tracking-tight">
                {isLoading ? "..." : clients.length}{" "}
                <span className="text-primary-light">Klien</span>
              </h2>
            </div>

            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Cari nama klien..."
              testId="client-search-input"
            />

            <FilterPanel
              dropdowns={FILTER_DROPDOWNS}
              values={options}
              onChange={(key, value) =>
                setOptions((prev) => ({ ...prev, [key]: value }))
              }
              onReset={resetFilters}
              canReset={hasActiveFilter}
              testIdPrefix="client"
            />

            <div
              className={`grid grid-cols-1 gap-6 w-full transition-opacity duration-300 ${
                isFetching && !isLoading ? "opacity-60" : "opacity-100"
              }`}
            >
              {isLoading ? (
                <LoadingState />
              ) : isError ? (
                <div className="text-center py-20 text-danger text-sm font-bold">
                  Gagal memuat data klien.
                </div>
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <div key={client.id_pengajuan} className="w-full">
                    <ConsultationCard
                      data={client}
                      role="konsultan"
                      onHide={() => {}}
                      onCancel={() => {}}
                    />
                  </div>
                ))
              ) : (
                <EmptyState
                  icon="group_off"
                  title="Klien Kosong"
                  description={
                    hasActiveFilter
                      ? "Tidak ada klien yang cocok dengan pencarian atau filter yang dipilih."
                      : "Belum ada klien terjadwal."
                  }
                  actionLabel={hasActiveFilter ? "Reset Filter" : undefined}
                  actionIcon="restart_alt"
                  onAction={hasActiveFilter ? resetFilters : undefined}
                  className="py-12"
                />
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

// --- SUB-COMPONENTS ---
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-32 gap-5">
    <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
      Memuat Daftar Klien...
    </p>
  </div>
);
