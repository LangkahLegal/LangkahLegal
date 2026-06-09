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
import { EmptyState } from "@/components/ui/EmptyState";

export default function ConsultantHistoryPage() {
  const router = useRouter();
  const { theme } = useTheme();

  // Mapping warna untuk UI Avatars
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
          (req.status)?.toLowerCase() !==
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
        id_bursa: req.id_bursa || null,
        status_pengajuan: req.status,
        nominal_consultant: req.nominal_konsultan || 0,
        jam_mulai: req.jam_mulai || null,
        jam_selesai: req.jam_selesai || null,
        tanggal_pengajuan: req.tanggal_konsultasi || null, // fallback
        tanggal_konsultasi: req.tanggal_konsultasi || null,
        jadwal_ketersediaan: {
          tanggal: req.tanggal_konsultasi || null,
          jam_mulai: req.jam_mulai || null,
          jam_selesai: req.jam_selesai || null,
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
    <div className="bg-bg text-main min-h-screen flex overflow-hidden font-primary transition-colors duration-500">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 w-full">
        <PageHeader
          title="Riwayat Sesi"
          rightElement={
            <Button variant="icon" className="!bg-transparent">
              <MaterialIcon name="tune" className="text-primary-light" />
            </Button>
          }
        />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-6 lg:px-10 lg:py-8 pb-32 lg:pb-12 min-h-[80vh] scroll-smooth">
          <div className="w-full max-w-full lg:max-w-[1600px] space-y-8 animate-fade-in">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold text-main tracking-tight">
                Semua Sesi
              </h2>
              <span className="bg-primary/10 text-primary-light text-[10px] font-black px-4 py-1.5 rounded-full border border-primary/20 uppercase tracking-widest transition-colors">
                {isLoading ? "..." : `${totalSelesai} Selesai`}
              </span>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-5">
                  <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                    Memuat Riwayat...
                  </p>
                </div>
              ) : historyList.length > 0 ? (
                <div className="space-y-4">
                  {historyList.map((item) => (
                    <ConsultationCard
                      key={item.id_pengajuan}
                      data={item}
                      role="consultant"
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
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}
