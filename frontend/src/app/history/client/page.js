"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";

// Import Komponen
import HistoryStats from "@/components/history/HistoryStats";
import ConsultationCard from "@/components/dashboard/ConsultationCard"; // Pakai komponen Dashboard
import { consultationService } from "@/services/consultation.service";

export default function HistoryPage() {
  // --- 1. Fetch Data via TanStack Query ---
  // Menggunakan key yang sama ["consultations"] agar mengambil dari cache dashboard
  const { data: consultations, isLoading } = useQuery({
    queryKey: ["history", "client"],
    queryFn: consultationService.getConsultations,
  });

  // --- 2. Logic Data (Sorting & Stats) ---
  const { sortedHistory, completedCount } = useMemo(() => {
    if (!consultations) return { sortedHistory: [], completedCount: 0 };

    // Sortir: Terjadwal & Pending di atas, sisanya berdasarkan waktu terbaru
    const sorted = [...consultations].sort((a, b) => {
      const priority = ["terjadwal", "pending", "menunggu_pembayaran"];
      const aPriority = priority.indexOf(a.status_pengajuan);
      const bPriority = priority.indexOf(b.status_pengajuan);

      // Jika salah satu punya prioritas (index != -1)
      if (aPriority !== bPriority) {
        if (aPriority === -1) return 1;
        if (bPriority === -1) return -1;
        return aPriority - bPriority;
      }

      // Default sort berdasarkan tanggal terbaru
      return new Date(b.created_at) - new Date(a.created_at);
    });

    const count = consultations.filter(
      (i) => i.status_pengajuan === "selesai",
    ).length;

    return { sortedHistory: sorted, completedCount: count };
  }, [consultations]);

  // --- 3. Loading State ---
  if (isLoading) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#6f59fe] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#aca8c1] text-[10px] font-bold tracking-widest uppercase animate-pulse">
            Memuat Riwayat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden font-['Inter',sans-serif]">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Riwayat Konsultasi" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Stats Section */}
            <HistoryStats count={completedCount} />

            {/* List Section */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-[#aca8c1] uppercase tracking-[0.2em] ml-2">
                Daftar Aktivitas
              </h3>

              {sortedHistory.length > 0 ? (
                <div className="space-y-4">
                  {sortedHistory.map((item) => (
                    <ConsultationCard
                      key={item.id_pengajuan}
                      data={item}
                      // Di halaman riwayat, fitur Hide biasanya tidak diperlukan
                      // agar user tetap bisa melihat semua record
                      onHide={() => {}}
                      onCancel={() => {}} // Fungsi cancel bisa ditambahkan jika status masih pending
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-[#1f1d35]/30 rounded-[2rem] border border-white/5">
                  <p className="text-[#aca8c1] text-sm">
                    Belum ada riwayat konsultasi.
                  </p>
                </div>
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
