"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import CategoryList from "@/components/dashboard/CategoryList";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/layout/SearchBar";
import ConsultantCard from "@/components/explore/ConsultantCard";
import AIBanner from "@/components/explore/AIBanner";

// Import Service
import { consultationService } from "@/services/consultation.service";

export default function KonsultasiPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("semua");

  const CATEGORIES = [
    { id: "semua", label: "Semua" },
    { id: "pidana", label: "Pidana" },
    { id: "perdata", label: "Perdata" },
    { id: "umum", label: "Umum" },
  ];

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

  // --- 2. Client-side Filtering untuk Search ---
  const filteredConsultants = consultants.filter((pro) =>
    pro.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    /* REFACTOR: Menggunakan variabel global --bg dan --text-main */
    <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Cari Konsultan" />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-8 lg:px-12 space-y-10 pb-32 lg:pb-12">
          <SearchBar value={search} onChange={setSearch} />

          <CategoryList
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Grid List Section */}
          <div className="relative min-h-[400px]">
            {/* Indikator Loading Utama */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                {/* REFACTOR: Menggunakan warna primary tema */}
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                {/* REFACTOR: Menggunakan warna primary-light tema */}
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
                  /* REFACTOR: Menggunakan bg-card dan border-surface sesuai tema */
                  <div className="col-span-full py-20 text-center bg-card/30 rounded-[2.5rem] border border-dashed border-surface shadow-sm">
                    {/* REFACTOR: Menggunakan warna text-muted tema */}
                    <p className="text-muted font-medium">
                      Tidak ada konsultan yang ditemukan.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Indikator Background Fetching */}
            {!isLoading && isFetching && (
              <div className="absolute top-0 right-0 p-2">
                {/* REFACTOR: Menggunakan warna primary tema */}
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
