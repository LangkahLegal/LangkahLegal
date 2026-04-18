"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";
import { consultantService } from "@/services/consultant.service";

export default function ConsultantHistoryPage() {
  const router = useRouter();

  // --- 1. Fetch Riwayat via TanStack Query ---
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["history", "consultant"],
    queryFn: consultantService.getHistory,
    staleTime: 5 * 60 * 1000,
  });

  // --- 2. Transformasi & Pengurutan Data ---
  const { historyList, totalSelesai } = useMemo(() => {
    if (!historyData) return { historyList: [], totalSelesai: 0 };

    const rawData = historyData.data || [];

    const formatted = rawData
      .filter(
        (req) =>
          (req.status_pengajuan || req.status_akhir)?.toLowerCase() !==
          "pending",
      )
      // LOGIKA SORTING: Urutkan berdasarkan tanggal terbaru
      .sort((a, b) => {
        const dateA = new Date(
          `${a.tanggal_konsultasi}T${a.jam_mulai || "00:00"}`,
        );
        const dateB = new Date(
          `${b.tanggal_konsultasi}T${b.jam_mulai || "00:00"}`,
        );
        return dateB - dateA; // Terbesar (terbaru) dikurangi terkecil (terlama)
      })
      .map((req) => ({
        id_pengajuan: req.id_pengajuan,
        status_pengajuan: req.status_pengajuan || req.status_akhir,
        nominal_consultant: req.nominal_konsultan || 0,
        jam_mulai: req.jam_mulai || req.rentang_waktu?.split(" - ")[0],
        jam_selesai: req.jam_selesai || req.rentang_waktu?.split(" - ")[1],
        jadwal_ketersediaan: {
          tanggal: req.tanggal_konsultasi,
          konsultan: {
            nama_lengkap: req.nama_klien || "Klien Anonim",
            foto_profil:
              req.foto_profil ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                req.nama_klien || "K",
              )}&background=1f1d35&color=ada3ff`,
          },
        },
      }));

    return {
      historyList: formatted,
      totalSelesai: historyData.total_sesi_selesai || 0,
    };
  }, [historyData]);

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden font-['Inter',sans-serif]">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 w-full">
        <PageHeader
          title="Riwayat Sesi"
          rightElement={
            <Button variant="icon" className="!bg-transparent">
              <MaterialIcon name="tune" className="text-[#ada3ff]" />
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold text-white">Semua Sesi</h2>
              <span className="bg-[#6f59fe]/10 text-[#ada3ff] text-[10px] font-bold px-4 py-1.5 rounded-full border border-[#6f59fe]/20 uppercase tracking-widest">
                {isLoading ? "..." : `${totalSelesai} Selesai`}
              </span>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-[#6f59fe] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#ada3ff] animate-pulse uppercase tracking-widest text-[10px] font-bold">
                    Synchronizing History...
                  </p>
                </div>
              ) : historyList.length > 0 ? (
                historyList.map((item) => (
                  <ConsultationCard
                    key={item.id_pengajuan}
                    data={item}
                    role="consultant"
                    onHide={() => {}}
                    onCancel={() => {}}
                  />
                ))
              ) : (
                <div className="text-center py-16 bg-[#1f1d35]/30 rounded-3xl border border-white/5 border-dashed">
                  <MaterialIcon
                    name="history"
                    className="text-5xl text-[#48455a] mb-3"
                  />
                  <p className="text-[#aca8c1] text-sm">
                    Belum ada riwayat sesi konsultasi.
                  </p>
                </div>
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
