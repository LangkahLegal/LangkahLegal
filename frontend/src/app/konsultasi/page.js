"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import CategoryList from "@/components/dashboard/CategoryList";
import PageHeader from "@/components/layout/PageHeader";
import SearchBar from "@/components/konsultasi/SearchBar";
import ConsultantCard from "@/components/konsultasi/ConsultantCard";
import AIBanner from "@/components/konsultasi/AIBanner";

// Import Service yang sudah mendukung FastAPI
import { consultationService } from "@/services/consultation.service";

export default function KonsultasiPage() {
  const [consultants, setConsultants] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("semua");
  const [isLoading, setIsLoading] = useState(true);

  // Definisi kategori untuk filter
  const CATEGORIES = [
    { id: "semua", label: "Semua" },
    { id: "pidana", label: "Pidana" },
    { id: "perdata", label: "Perdata" },
    { id: "korporat", label: "Korporat" },
  ];

  /**
   * Mengambil data dari API setiap kali kategori berubah
   */
  useEffect(() => {
    async function fetchCatalog() {
      try {
        setIsLoading(true);
        // Memanggil endpoint FastAPI via service
        const data =
          await consultationService.getConsultantCatalog(activeCategory);
        setConsultants(data);
      } catch (error) {
        console.error("Error loading consultants:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCatalog();
  }, [activeCategory]);

  /**
   * Filter pencarian nama dilakukan di sisi klien (Client-side filtering)
   * agar terasa sangat cepat (snappy) bagi pengguna saat mengetik.
   */
  const filteredConsultants = consultants.filter((pro) =>
    pro.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader
          title="Cari Konsultan"
          icon="gavel"
          onSettingsClick={() => console.log("Open Settings")}
        />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-8 lg:px-12 space-y-10 pb-32 lg:pb-12">
          {/* SearchBar: Update state 'search' */}
          <SearchBar value={search} onChange={setSearch} />

          {/* CategoryList: Pastikan komponen ini menerima props active dan onChange */}
          <CategoryList
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />

          {/* Grid List dengan Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-[#ada3ff] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#ada3ff] font-medium animate-pulse">
                Memuat katalog konsultan...
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 w-full">
              {filteredConsultants.length > 0 ? (
                filteredConsultants.map((pro) => (
                  <ConsultantCard key={pro.id} consultant={pro} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-[#aca8c1]">
                    Tidak ada konsultan yang ditemukan.
                  </p>
                </div>
              )}
            </section>
          )}

          <AIBanner onAction={() => console.log("AI Chat Started")} />
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
