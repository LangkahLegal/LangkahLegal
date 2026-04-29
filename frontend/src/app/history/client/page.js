"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";

// Import Komponen
import HistoryStats from "@/components/history/HistoryStats";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import { consultationService } from "@/services/consultation.service";

export default function HistoryPage() {
  // --- 1. Fetch Data via TanStack Query ---
  const { data: consultations, isLoading } = useQuery({
    queryKey: ["history", "client"],
    queryFn: consultationService.getConsultations,
  });

  // --- 2. Logic Data (Sorting & Stats) ---
  const { sortedHistory, completedCount } = useMemo(() => {
    // Pastikan consultations tidak undefined sebelum diproses
    const data = consultations || [];

    const sorted = [...data].sort((a, b) => {
      const priority = ["terjadwal", "pending", "menunggu_pembayaran"];
      const aPriority = priority.indexOf(a.status_pengajuan);
      const bPriority = priority.indexOf(b.status_pengajuan);

      if (aPriority !== bPriority) {
        if (aPriority === -1) return 1;
        if (bPriority === -1) return -1;
        return aPriority - bPriority;
      }

      return new Date(b.created_at) - new Date(a.created_at);
    });

    const count = data.filter((i) => i.status_pengajuan === "selesai").length;

    return { sortedHistory: sorted, completedCount: count };
  }, [consultations]);

  // --- 3. Loading State (Theme Aware) ---
  if (isLoading) {
    return (
      /* REFACTOR: bg-[#0e0c1e] -> bg-bg */
      <div className="bg-bg min-h-screen flex items-center justify-center transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          {/* REFACTOR: border-[#6f59fe] -> border-primary */}
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          {/* REFACTOR: text-[#aca8c1] -> text-muted */}
          <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
            Memuat Riwayat...
          </p>
        </div>
      </div>
    );
  }

  return (
    /* REFACTOR: bg-bg | text-main | font-primary */
    <div className="bg-bg text-main min-h-screen flex overflow-hidden font-primary transition-colors duration-500">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 transition-all duration-300">
        <PageHeader title="Riwayat Konsultasi" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            {/* Stats Section */}
            <HistoryStats count={completedCount} />

            {/* List Section */}
            <div className="space-y-6">
              {/* REFACTOR: text-muted */}
              <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-2">
                Daftar Aktivitas
              </h3>

              {sortedHistory.length > 0 ? (
                <div className="space-y-4">
                  {sortedHistory.map((item) => (
                    <ConsultationCard
                      key={item.id_pengajuan}
                      data={item}
                      onHide={() => {}}
                      onCancel={() => {}}
                    />
                  ))}
                </div>
              ) : (
                /* REFACTOR: bg-card/30 | border-surface */
                <div className="text-center py-20 bg-card/30 rounded-[2rem] border border-surface border-dashed">
                  {/* REFACTOR: text-muted */}
                  <p className="text-muted text-sm font-medium">
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
