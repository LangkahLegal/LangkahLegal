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
import { useTheme } from "@/providers/ThemeProvider"; // Import Hook Tema

export default function ConsultantHistoryPage() {
  const router = useRouter();
  const { theme } = useTheme();

  // Mapping warna untuk UI Avatars (Solusi 1)
  const themeColors = {
    "dark-tech": { bg: "1f1d35", color: "ada3ff" },
    "theme-cyber-slate": { bg: "17203a", color: "29d1ff" },
    "theme-white-modern": { bg: "f3f1eb", color: "2d1e17" },
  };
  const activeColors = themeColors[theme] || themeColors["dark-tech"];

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
      .sort((a, b) => {
        const dateA = new Date(
          `${a.tanggal_konsultasi}T${a.jam_mulai || "00:00"}`,
        );
        const dateB = new Date(
          `${b.tanggal_konsultasi}T${b.jam_mulai || "00:00"}`,
        );
        return dateB - dateA;
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
              )}&background=${activeColors.bg}&color=${activeColors.color}`,
          },
        },
      }));

    return {
      historyList: formatted,
      totalSelesai: historyData.total_sesi_selesai || 0,
    };
  }, [historyData, activeColors]);

  return (
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-[#e8e2fc] -> text-main */
    <div className="bg-bg text-main min-h-screen flex overflow-hidden font-primary transition-colors duration-500">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 w-full">
        <PageHeader
          title="Riwayat Sesi"
          rightElement={
            <Button variant="icon" className="!bg-transparent">
              {/* REFACTOR: text-[#ada3ff] -> text-primary-light */}
              <MaterialIcon name="tune" className="text-primary-light" />
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold text-main tracking-tight">
                Semua Sesi
              </h2>
              {/* REFACTOR: bg/border/text primary & primary-light */}
              <span className="bg-primary/10 text-primary-light text-[10px] font-black px-4 py-1.5 rounded-full border border-primary/20 uppercase tracking-widest transition-colors">
                {isLoading ? "..." : `${totalSelesai} Selesai`}
              </span>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  {/* REFACTOR: border-[#6f59fe] -> border-primary */}
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-primary-light animate-pulse uppercase tracking-widest text-[10px] font-bold">
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
                /* REFACTOR: bg-[#1f1d35]/30 -> bg-card/30 | border-white/5 -> border-surface */
                <div className="text-center py-16 bg-card/30 rounded-3xl border border-surface border-dashed">
                  <MaterialIcon
                    name="history"
                    /* REFACTOR: text-[#48455a] -> text-muted/30 */
                    className="text-5xl text-muted/30 mb-3"
                  />
                  <p className="text-muted text-sm font-medium">
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
