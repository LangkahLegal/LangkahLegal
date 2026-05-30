"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/layout/SearchBar";
import ConsultantCard from "@/components/explore/ConsultantCard";
import PillDropdown from "@/components/explore/PillDropdown";
import AIBanner from "@/components/explore/AIBanner";
import { MaterialIcon } from "@/components/ui";

// Import Service
import { consultationService } from "@/services/consultation.service";

const CATEGORY_OPTIONS = [
  { id: "semua", label: "Semua" },
  { id: "pidana", label: "Pidana" },
  { id: "perdata", label: "Perdata" },
  { id: "umum", label: "Umum" },
];

const VERIFIED_OPTIONS = [
  { id: "semua", label: "Semua" },
  { id: "terverifikasi", label: "Verified" },
  { id: "non-verified", label: "Belum Verified" },
];

export default function KonsultasiPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("semua");
  const [filterVerified, setFilterVerified] = useState("semua");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // --- 1. Fetch Katalog via TanStack Query ---
  const {
    data: consultants = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["consultantCatalog", activeCategory],
    queryFn: () => consultationService.getConsultantCatalog(activeCategory),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  // --- 2. Client-side Filtering ---
  const filteredConsultants = consultants.filter((pro) => {
    const matchSearch = pro.name.toLowerCase().includes(search.toLowerCase());

    let matchVerified = true;
    if (filterVerified === "terverifikasi") {
      matchVerified = pro.status_verifikasi === "terverifikasi";
    } else if (filterVerified === "non-verified") {
      matchVerified = pro.status_verifikasi !== "terverifikasi";
    }

    let matchPrice = true;
    const price = pro.tarif_per_sesi || 0;
    const min = priceMin !== "" ? Number(priceMin) : null;
    const max = priceMax !== "" ? Number(priceMax) : null;
    if (min !== null && price < min) matchPrice = false;
    if (max !== null && price > max) matchPrice = false;

    return matchSearch && matchVerified && matchPrice;
  });

  // --- Reset ---
  const hasActiveFilter =
    activeCategory !== "semua" ||
    filterVerified !== "semua" ||
    priceMin !== "" ||
    priceMax !== "";

  const resetFilters = () => {
    setActiveCategory("semua");
    setFilterVerified("semua");
    setPriceMin("");
    setPriceMax("");
  };

  return (
    <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Cari Konsultan" />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-8 lg:px-12 space-y-10 pb-32 lg:pb-12">
          <SearchBar value={search} onChange={setSearch} />

          {/* ===== Filter Bar — compact horizontal row ===== */}
          <section className="w-full space-y-6">
            <h2 className="text-xl font-headline font-black text-main px-1 tracking-tight">
              Filter
            </h2>

            <div className="flex items-center gap-3 px-1 flex-wrap relative z-20">
              {/* Kategori Dropdown */}
              <PillDropdown
                icon="category"
                options={CATEGORY_OPTIONS}
                value={activeCategory}
                onChange={setActiveCategory}
              />

              {/* Verifikasi Dropdown */}
              <PillDropdown
                icon="verified_user"
                options={VERIFIED_OPTIONS}
                value={filterVerified}
                onChange={setFilterVerified}
              />

              {/* Harga Min-Max — inline pill style */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-surface bg-input/50 shrink-0">
                <MaterialIcon name="payments" className="text-sm text-muted" />
                <span className="text-[10px] font-bold text-muted uppercase tracking-wide">Rp</span>
                <input
                  type="number"
                  min="0"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className="w-16 bg-transparent text-[11px] font-bold text-main placeholder:text-muted/40 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                />
                <span className="text-muted/50 text-[10px]">—</span>
                <input
                  type="number"
                  min="0"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className="w-16 bg-transparent text-[11px] font-bold text-main placeholder:text-muted/40 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-center"
                />
              </div>

              {/* Reset Button */}
              {hasActiveFilter && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-all duration-300 whitespace-nowrap shrink-0"
                >
                  <MaterialIcon name="restart_alt" className="text-sm" />
                  Reset
                </button>
              )}
            </div>
          </section>

          {/* ===== Consultant Grid ===== */}
          <div className="relative min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-primary-light font-bold animate-pulse uppercase text-[10px] tracking-widest">
                  Mengambil Katalog...
                </p>
              </div>
            ) : (
              <section
                className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 w-full transition-opacity duration-300 ${isFetching ? "opacity-50" : "opacity-100"}`}
              >
                {filteredConsultants.length > 0 ? (
                  filteredConsultants.map((pro) => (
                    <ConsultantCard key={pro.id} consultant={pro} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-card/30 rounded-[2.5rem] border border-dashed border-surface shadow-sm">
                    <p className="text-muted font-medium">
                      Tidak ada konsultan yang ditemukan.
                    </p>
                  </div>
                )}
              </section>
            )}

            {!isLoading && isFetching && (
              <div className="absolute top-0 right-0 p-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <AIBanner onAction={() => console.log("AI Chat Started")} />
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
