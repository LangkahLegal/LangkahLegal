"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/layout/SearchBar";
import { useRouter } from "next/navigation";
import ConsultantCard from "@/components/explore/ConsultantCard";
import FilterPanel from "@/components/layout/FilterPanel";
import AIBanner from "@/components/explore/AIBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { defaultFilterValues } from "@/lib/filterOptions";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

// Import Service
import { consultationService } from "@/services/consultation.service";

// Pilihan filter; key dan id-nya sama dengan parameter katalog di backend.
const FILTER_DROPDOWNS = [
  {
    key: "spesialisasi",
    icon: "category",
    options: [
      { id: "semua", label: "Semua", triggerLabel: "Kategori" },
      { id: "pidana", label: "Pidana" },
      { id: "perdata", label: "Perdata" },
      { id: "ketenagakerjaan", label: "Ketenagakerjaan" },
      { id: "teknologi informasi", label: "Teknologi Informasi" },
      { id: "ham", label: "HAM" },
      { id: "umum", label: "Umum" },
    ],
  },
  {
    key: "verified",
    icon: "verified",
    options: [
      { id: "semua", label: "Semua", triggerLabel: "Verifikasi" },
      { id: "terverifikasi", label: "Verified" },
      { id: "non-verified", label: "Belum Verified" },
    ],
  },
];

const DEFAULT_OPTIONS = defaultFilterValues(FILTER_DROPDOWNS);

const PRICE_INPUT_CLASS =
  "flex-1 min-w-0 bg-transparent text-[11px] font-bold text-main placeholder:text-muted/40 outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

const PAGE_SIZE = 12;

// Angka harga yang valid untuk dikirim ke backend; input kosong atau negatif diabaikan.
const toPrice = (value) => {
  if (value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
};

export default function KonsultasiPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // --- 1. Katalog: filter, pencarian, dan paginasi dikerjakan backend ---
  const filters = {
    ...options,
    search: debouncedSearch,
    minPrice: toPrice(priceMin),
    maxPrice: toPrice(priceMax),
  };

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["consultantCatalog", filters],
    queryFn: ({ pageParam }) =>
      consultationService.getConsultantCatalogPage({
        ...filters,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.data.length, 0);
      return loaded < lastPage.total ? pages.length + 1 : undefined;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  const filteredConsultants = data?.pages.flatMap((page) => page.data) ?? [];

  // --- Reset ---
  const hasActiveFilter =
    search.trim() !== "" ||
    priceMin !== "" ||
    priceMax !== "" ||
    FILTER_DROPDOWNS.some(({ key }) => options[key] !== DEFAULT_OPTIONS[key]);

  const resetFilters = () => {
    setSearch("");
    setOptions(DEFAULT_OPTIONS);
    setPriceMin("");
    setPriceMax("");
  };

  return (
    <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Cari Konsultan" />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-6 lg:px-10 lg:py-8 space-y-8 pb-32 lg:pb-12 animate-fade-in">
          <SearchBar value={search} onChange={setSearch} />

          <FilterPanel
            dropdowns={FILTER_DROPDOWNS}
            values={options}
            onChange={(key, value) =>
              setOptions((prev) => ({ ...prev, [key]: value }))
            }
            onReset={resetFilters}
            canReset={hasActiveFilter}
            testIdPrefix="explore"
          >
            {/* Rentang tarif per sesi */}
            <div className="col-span-2 flex items-center gap-2 h-11 px-4 rounded-full border border-surface bg-input/50">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wide shrink-0">
                Rp
              </span>
              <input
                type="number"
                min="0"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Min"
                className={PRICE_INPUT_CLASS}
              />
              <span className="text-muted/50 text-[10px] shrink-0">—</span>
              <input
                type="number"
                min="0"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max"
                className={PRICE_INPUT_CLASS}
              />
            </div>
          </FilterPanel>

          {/* ===== Consultant Grid ===== */}
          <div className="relative min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-5">
                <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                  Memuat Katalog Konsultan...
                </p>
              </div>
            ) : (
              <section
                className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5 w-full transition-opacity duration-300 ${
                  isFetching ? "opacity-50" : "opacity-100"
                }`}
              >
                {isError ? (
                  <div className="col-span-full">
                    <EmptyState
                      icon="error"
                      title="Gagal Memuat Katalog"
                      description="Daftar konsultan tidak dapat dimuat. Periksa koneksi Anda lalu coba lagi."
                      actionLabel="Coba Lagi"
                      actionIcon="refresh"
                      onAction={() => refetch()}
                      className="py-12"
                    />
                  </div>
                ) : filteredConsultants.length > 0 ? (
                  filteredConsultants.map((pro) => (
                    <ConsultantCard key={pro.id} consultant={pro} />
                  ))
                ) : (
                  <div className="col-span-full">
                    <EmptyState
                      icon="search_off"
                      title="Tidak Ditemukan"
                      description="Tidak ada konsultan yang cocok dengan filter pencarian."
                      className="py-12"
                    />
                  </div>
                )}
              </section>
            )}

            {hasNextPage && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  data-testid="catalog-load-more"
                  className="px-6 py-3 rounded-full border border-primary/30 text-primary text-[11px] font-bold uppercase tracking-wide hover:bg-primary/10 transition-all disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Memuat..." : "Muat lebih banyak"}
                </button>
              </div>
            )}

            {!isLoading && isFetching && (
              <div className="absolute top-0 right-0 p-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <AIBanner onAction={() => router.push("/ai")} />
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
