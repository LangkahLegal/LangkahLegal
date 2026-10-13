"use client";

import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";

// Import Komponen
import HistoryStats from "@/components/history/HistoryStats";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import { consultationService } from "@/services/consultation.service";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HistoryPage() {
  // --- 1. Fetch Data via TanStack Query ---
  const { data: history, isLoading } = useQuery({
    queryKey: ["history", "client"],
    queryFn: consultationService.getClientHistory,
  });

  // --- 2. Urutan & jumlah sesi selesai dihitung backend (/consultations/history) ---
  const sortedHistory = history?.data || [];
  const completedCount = history?.total_sesi_selesai ?? 0;


  return (
    <div className="bg-bg text-main min-h-screen flex overflow-hidden font-primary transition-colors duration-500">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 transition-all duration-300">
        <PageHeader title="Riwayat Konsultasi" />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-6 lg:px-10 lg:py-8 pb-32 lg:pb-12 min-h-[80vh] scroll-smooth">
          <div className="w-full max-w-full lg:max-w-[1600px] space-y-8 animate-fade-in">
            {/* Stats Section */}
            <HistoryStats count={completedCount} isLoading={isLoading} />

            {/* List Section */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-2">
                Daftar Aktivitas
              </h3>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-5">
                  <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                    Memuat Riwayat...
                  </p>
                </div>
              ) : sortedHistory.length > 0 ? (
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
                <EmptyState
                  icon="history"
                  title="Riwayat Kosong"
                  description="Belum ada riwayat sesi konsultasi."
                  className="py-12"
                />
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
