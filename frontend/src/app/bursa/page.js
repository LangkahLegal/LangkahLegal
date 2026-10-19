"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { caseService } from "@/services/case.service";
import SearchBar from "@/components/layout/SearchBar";
import PillDropdown from "@/components/explore/PillDropdown";
import BursaCard from "@/components/bursa/BursaCard";
import SuccessView from "@/components/layout/SuccessView";
import ClaimConfirmModal from "@/components/bursa/ClaimConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";

// Pilihan filter; id-nya dikirim apa adanya ke backend (GET /cases/).
// `wide` membuat dropdown selebar dua kolom di mobile agar grid tetap genap.
const FILTER_DROPDOWNS = [
  {
    key: "kategori",
    icon: "category",
    options: [
      { id: "semua", label: "Semua", triggerLabel: "Kategori" },
      { id: "umum", label: "Umum" },
      { id: "pidana", label: "Pidana" },
      { id: "perdata", label: "Perdata" },
    ],
  },
  {
    key: "jadwal",
    icon: "event",
    options: [
      { id: "semua", label: "Semua", triggerLabel: "Jadwal" },
      { id: "akan_datang", label: "Akan Datang" },
      { id: "hari_ini", label: "Hari Ini" },
      { id: "besok", label: "Besok" },
      { id: "7_hari", label: "7 Hari ke Depan", triggerLabel: "7 Hari" },
      { id: "30_hari", label: "30 Hari ke Depan", triggerLabel: "30 Hari" },
    ],
  },
  {
    key: "waktu",
    icon: "schedule",
    options: [
      { id: "semua", label: "Semua", triggerLabel: "Waktu" },
      { id: "pagi", label: "Pagi · < 12", triggerLabel: "Pagi" },
      { id: "siang", label: "Siang · 12-15", triggerLabel: "Siang" },
      { id: "sore", label: "Sore · 15-18", triggerLabel: "Sore" },
      { id: "malam", label: "Malam · ≥ 18", triggerLabel: "Malam" },
    ],
  },
  {
    key: "dokumen",
    icon: "attach_file",
    options: [
      { id: "semua", label: "Semua", triggerLabel: "Dokumen" },
      { id: "ada", label: "Ada Dokumen" },
      { id: "tidak", label: "Tanpa Dokumen" },
    ],
  },
  {
    key: "urutkan",
    icon: "sort",
    wide: true,
    options: [
      { id: "terbaru", label: "Terbaru" },
      { id: "terlama", label: "Terlama" },
      { id: "jadwal_terdekat", label: "Jadwal Terdekat" },
    ],
  },
];

const DEFAULT_OPTIONS = Object.fromEntries(
  FILTER_DROPDOWNS.map(({ key, options }) => [key, options[0].id]),
);

export default function BursaKasusPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [claimingId, setClaimingId] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedDesc, setExpandedDesc] = useState({});

  // Pencarian dikirim ke backend setelah jeda singkat agar tidak memanggil API tiap ketikan.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // --- Fetch kasus open: filter, pencarian, dan urutan dikerjakan backend ---
  const filters = { search: debouncedSearch, ...options };

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["bursaKasus", filters],
    queryFn: () => caseService.listOpenCases(filters),
    placeholderData: (previousData) => previousData,
    refetchInterval: 15000,
  });

  const cases = data?.data ?? [];
  const total = data?.total ?? cases.length;

  const hasActiveFilter =
    search.trim() !== "" ||
    FILTER_DROPDOWNS.some(({ key }) => options[key] !== DEFAULT_OPTIONS[key]);

  const resetFilters = () => {
    setSearch("");
    setOptions(DEFAULT_OPTIONS);
  };

  // --- Mutation klaim ---
  const claimMutation = useMutation({
    mutationFn: (idBursa) => caseService.claimCase(idBursa),
    onSuccess: (data) => {
      setSuccessData(data);
      setClaimingId(null);
      queryClient.invalidateQueries({ queryKey: ["bursaKasus"] });
    },
    onError: (err) => {
      alert(err?.response?.data?.detail || "Gagal mengklaim kasus.");
      setClaimingId(null);
    },
  });

  const handleClaim = (idBursa) => {
    setClaimingId(idBursa);
  };

  const confirmClaim = () => {
    if (!claimingId) return;
    claimMutation.mutate(claimingId);
  };

  const toggleDesc = (id) => {
    setExpandedDesc((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- SUCCESS VIEW ---
  if (successData) {
    return (
      <div
        className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500"
        data-testid="bursa-page"
      >
        <Sidebar role="konsultan" />
        <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64">
          <PageHeader title="Bursa Kasus" backHref="/dashboard/consultant" />
          <SuccessView
            title="Kasus Berhasil Diklaim!"
            description="Konsultasi sudah otomatis terjadwal dengan jadwal yang dipilih klien. Anda bisa melihat detail kasus atau menyiapkan link Zoom sekarang."
            onAction={() => {
              if (successData?.data?.id_pengajuan) {
                router.push(`/consultation/${successData.data.id_pengajuan}`);
              } else {
                router.push("/dashboard/consultant");
              }
            }}
            actionLabel="Lihat Detail Konsultasi"
            onSecondaryAction={() => setSuccessData(null)}
            secondaryActionLabel="Kembali ke Bursa"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500"
      data-testid="bursa-page"
    >
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64">
        <PageHeader title="Bursa Kasus" backHref="/dashboard/consultant" />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-6 lg:px-10 lg:py-8 pb-32 lg:pb-12 min-h-[80vh] scroll-smooth">
          <div className="w-full max-w-full lg:max-w-[1600px] space-y-8 animate-fade-in">
            {/* Header Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between px-1">
                {/* Kiri: Judul & Sub-judul Refresh */}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-headline text-main">
                    Bursa Kasus Tersedia
                  </h2>
                  <p className="text-muted/60 text-[10px] font-medium mt-1">
                    Diperbarui otomatis tiap 15 detik
                  </p>
                </div>

                {/* Kanan: Badge "X KASUS" */}
                <div className="px-3 py-1.5 bg-surface/60 border border-surface rounded-full flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-main">
                    {total} Kasus
                  </span>
                </div>
              </div>
            </div>

            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Cari kata kunci kasus..."
              testId="bursa-search-input"
            />

            {/* Filter */}
            <section className="space-y-3 px-1 relative z-20">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted">
                  Filter
                </h3>
                <button
                  onClick={resetFilters}
                  disabled={!hasActiveFilter}
                  data-testid="bursa-reset-filter"
                  className="flex items-center gap-1 text-xs font-bold text-danger disabled:text-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <MaterialIcon name="restart_alt" className="text-sm" />
                  Reset Filter
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
                {FILTER_DROPDOWNS.map(({ key, icon, wide, options: choices }) => (
                  <div key={key} className={wide ? "col-span-2 lg:col-span-1" : ""}>
                    <PillDropdown
                      icon={icon}
                      options={choices}
                      value={options[key]}
                      onChange={(value) =>
                        setOptions((prev) => ({ ...prev, [key]: value }))
                      }
                      fullWidth
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* LOADING STATE */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-5">
                <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                  Memuat Bursa Kasus...
                </p>
              </div>
            )}

            {/* ERROR STATE */}
            {isError && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <MaterialIcon
                  name="error_outline"
                  className="text-danger text-4xl opacity-80"
                />
                <p className="text-sm text-danger font-medium max-w-xs">
                  Gagal memuat data bursa. Pastikan Anda login sebagai
                  konsultan.
                </p>
              </div>
            )}

            {/* EMPTY STATE */}
            {!isLoading && !isError && cases.length === 0 && (
              <EmptyState
                icon="work_off"
                title="Bursa Kosong"
                description={
                  hasActiveFilter
                    ? "Tidak ada kasus yang cocok dengan pencarian atau filter yang dipilih."
                    : "Belum ada kasus tersedia di bursa saat ini. Cek kembali nanti."
                }
                actionLabel={hasActiveFilter ? "Reset Filter" : undefined}
                actionIcon="restart_alt"
                onAction={hasActiveFilter ? resetFilters : undefined}
              />
            )}

            {/* CASE CARDS */}
            {!isLoading && !isError && cases.length > 0 && (
              <div
                className={`grid gap-5 transition-opacity duration-300 ${isFetching ? "opacity-60" : "opacity-100"}`}
              >
                <AnimatePresence>
                  {cases.map((kasus, idx) => {
                    const isExpanded = !!expandedDesc[kasus.id_bursa];

                    return (
                      <BursaCard
                        key={kasus.id_bursa}
                        kasus={kasus}
                        idx={idx}
                        isExpanded={isExpanded}
                        toggleDesc={toggleDesc}
                        onClaim={handleClaim}
                        isClaiming={
                          claimMutation.isPending &&
                          claimingId === kasus.id_bursa
                        }
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>

      {/* --- CONFIRM DIALOG --- */}
      <AnimatePresence>
        <ClaimConfirmModal
          isOpen={!!claimingId && !claimMutation.isPending}
          onClose={() => setClaimingId(null)}
          onConfirm={confirmClaim}
          isLoading={claimMutation.isPending}
        />
      </AnimatePresence>
    </div>
  );
}
