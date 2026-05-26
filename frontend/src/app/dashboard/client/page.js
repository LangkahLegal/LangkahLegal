"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import EmptyConsultationCard from "@/components/dashboard/EmptyConsultationCard";
import FeaturedServices from "@/components/dashboard/FeaturedServices";
import CategoryList from "@/components/dashboard/CategoryList";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";

import { userService } from "@/services/user.service";
import { consultationService } from "@/services/consultation.service";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [tempHiddenIds, setTempHiddenIds] = useState([]);

  // --- 1. Fetch Profile ---
  const { data: user } = useQuery({
    queryKey: ["userProfile"],
    queryFn: userService.getFullProfile,
    select: (data) => ({
      nama: data?.nama || "User",
      foto_profil: data?.foto_profil || data?.avatar || "",
    }),
  });

  // --- 2. Fetch Consultations ---
  const { data: consultations, isLoading } = useQuery({
    queryKey: ["consultations"],
    queryFn: consultationService.getConsultations,
  });

  // --- 3. Mutation untuk Update Status ---
  const cancelMutation = useMutation({
    mutationFn: (id) => consultationService.updateStatus(id, "dibatalkan"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      alert("Konsultasi berhasil dibatalkan.");
    },
    onError: () => alert("Gagal membatalkan konsultasi."),
  });

  // --- 4. Logika Filtering Kartu Aktif ---
  const activeConsultation = useMemo(() => {
    if (!consultations) return null;

    const persistentHidden = JSON.parse(
      localStorage.getItem("hidden_rejected_ids") || "[]",
    ).map((id) => Number(id));

    const allowedStatuses = [
      "pending",
      "menunggu_pembayaran",
      "terjadwal",
      "ditolak",
    ];

    const filtered = consultations
      .filter((item) => allowedStatuses.includes(item.status_pengajuan))
      .filter((item) => !persistentHidden.includes(Number(item.id_pengajuan)))
      .filter((item) => !tempHiddenIds.includes(Number(item.id_pengajuan)))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return filtered.length > 0 ? filtered[0] : null;
  }, [consultations, tempHiddenIds]);

  const handleHideCard = () => {
    if (!activeConsultation) return;
    const currentId = Number(activeConsultation.id_pengajuan);
    const currentStatus = activeConsultation.status_pengajuan;

    if (currentStatus === "ditolak") {
      const stored = JSON.parse(
        localStorage.getItem("hidden_rejected_ids") || "[]",
      );
      const updated = [...new Set([...stored, currentId])];
      localStorage.setItem("hidden_rejected_ids", JSON.stringify(updated));
      setTempHiddenIds((prev) => [...prev, currentId]);
    } else {
      setTempHiddenIds((prev) => [...prev, currentId]);
    }
  };

  const handleCancelConsultation = () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan konsultasi ini?")) return;
    cancelMutation.mutate(activeConsultation.id_pengajuan);
  };

  // --- RENDER LOADING STATE (Theme Aware) ---
  if (isLoading) {
    return (
      /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-[#ada3ff] -> text-primary-light */
      <div className="bg-bg min-h-screen flex items-center justify-center text-primary-light transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          {/* REFACTOR: border-[#ada3ff] -> border-primary */}
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="animate-pulse font-bold text-[10px] tracking-widest uppercase">
            Synchronizing Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const DASHBOARD_CATEGORIES = [
    { id: "semua", label: "Semua" },
    { id: "pidana", label: "Pidana" },
    { id: "perdata", label: "Perdata" },
    { id: "umum", label: "Umum" },
  ];

  return (
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-[#e8e2fc] -> text-main */
    <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
      <Sidebar />
      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <header className="sticky top-0 z-40 w-full">
          <DashboardHeader
            userName={user?.nama}
            foto_profil={user?.foto_profil}
          />
        </header>

        <main className="relative z-10 w-full px-4 py-6 md:px-8 lg:px-12 lg:py-12 pb-32 lg:pb-12">
          <div className="w-full max-w-full lg:max-w-[1600px] space-y-8 lg:space-y-12 animate-fade-in">
            <div className="w-full">
              {activeConsultation ? (
                <ConsultationCard
                  data={activeConsultation}
                  onCancel={handleCancelConsultation}
                  onHide={handleHideCard}
                />
              ) : (
                <EmptyConsultationCard />
              )}
            </div>

            <FeaturedServices
              services={{
                ai_service: {
                  title: "Tanya AI Langkah",
                  description: "Jawaban hukum instan berbasis AI yang akurat.",
                  icon: "psychology",
                },
                small_services: [
                  {
                    title: "Litigasi",
                    description: "Pendampingan sidang",
                    icon: "gavel",
                  },
                  {
                    title: "Review Akta",
                    description: "Cek legalitas dokumen",
                    icon: "description",
                  },
                ],
              }}
            />

            <CategoryList
              categories={DASHBOARD_CATEGORIES}
              activeCategory="semua"
            />
          </div>
        </main>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
