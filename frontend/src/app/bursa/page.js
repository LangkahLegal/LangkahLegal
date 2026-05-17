"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { caseService } from "@/services/case.service";
import CategoryList from "@/components/dashboard/CategoryList";
import BursaCard from "@/components/bursa/BursaCard";
import SuccessView from "@/components/layout/SuccessView";
import ClaimConfirmModal from "@/components/bursa/ClaimConfirmModal";

// Daftar kategori statis sesuai format komponen CategoryList
const BURSA_CATEGORIES = [
  { id: "Semua", label: "Semua" },
  { id: "Umum", label: "Umum" },
  { id: "Pidana", label: "Pidana" },
  { id: "Perdata", label: "Perdata" },
];

export default function BursaKasusPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [claimingId, setClaimingId] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [expandedDesc, setExpandedDesc] = useState({});

  // --- Fetch semua kasus open ---
  const {
    data: cases = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["bursaKasus"],
    queryFn: caseService.listOpenCases,
    refetchInterval: 15000,
  });

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

  // --- Filter logic ---
  const filteredCases = filterKategori === "Semua"
    ? cases
    : cases.filter((c) => {
        const kasusKat = c.kategori_hukum || "umum";
        return kasusKat.toLowerCase() === filterKategori.toLowerCase();
      });

  // --- SUCCESS VIEW ---
  if (successData) {
    return (
      <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
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
    <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64">
        <PageHeader title="Bursa Kasus" backHref="/dashboard/consultant" />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
            {/* Header Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between px-1">
                {/* Kiri: Judul & Sub-judul Refresh */}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-headline text-main">
                    Bursa Kasus Tersedia
                  </h2>
                  <div className="flex items-center gap-1.5 text-muted/60 text-[10px] font-medium mt-1">
                    <MaterialIcon name="update" className="text-[11px]" />
                    <span>Diperbarui otomatis tiap 15 detik</span>
                  </div>
                </div>
                
                {/* Kanan: Badge "X KASUS" */}
                <div className="px-3 py-1.5 bg-surface/60 border border-surface rounded-full flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-main">
                    {cases.length} Kasus
                  </span>
                </div>
              </div>
            </div>

            {/* Komponen CategoryList */}
            <CategoryList
              title=""
              categories={BURSA_CATEGORIES}
              activeCategory={filterKategori}
              onCategoryChange={setFilterKategori}
            />

            {/* LOADING STATE */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-primary-light text-[10px] font-black tracking-[0.2em] uppercase animate-pulse">
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
                  Gagal memuat data bursa. Pastikan Anda login sebagai konsultan.
                </p>
              </div>
            )}

            {/* EMPTY STATE */}
            {!isLoading && !isError && filteredCases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <MaterialIcon
                  name="inbox"
                  className="text-5xl text-muted opacity-30"
                />
                <p className="text-sm text-muted font-medium leading-relaxed max-w-xs">
                  {filterKategori !== "Semua"
                    ? `Tidak ada kasus "${filterKategori}" yang tersedia saat ini.`
                    : "Belum ada kasus tersedia di bursa saat ini. Cek kembali nanti."}
                </p>
              </div>
            )}

            {/* CASE CARDS */}
            {!isLoading && !isError && filteredCases.length > 0 && (
              <div className="grid gap-5">
                <AnimatePresence>
                  {filteredCases.map((kasus, idx) => {
                    const isExpanded = !!expandedDesc[kasus.id_bursa];

                    return (
                      <BursaCard
                        key={kasus.id_bursa}
                        kasus={kasus}
                        idx={idx}
                        isExpanded={isExpanded}
                        toggleDesc={toggleDesc}
                        onClaim={handleClaim}
                        isClaiming={claimMutation.isPending && claimingId === kasus.id_bursa}
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