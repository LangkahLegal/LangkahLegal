"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import EmptyConsultationCard from "@/components/dashboard/EmptyConsultationCard";
import FeaturedServices from "@/components/dashboard/FeaturedServices";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import { Spinner } from "@/components/ui/Spinner";

import { userService } from "@/services/user.service";
import { consultationService } from "@/services/consultation.service";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [tempHiddenIds, setTempHiddenIds] = useState([]);

  // --- 1. Fetch Profile ---
  const { data: user, isLoading: isLoadingUser } = useQuery({
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

  return (
    <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
      <Sidebar />
      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <header className="sticky top-0 z-40 w-full">
          <DashboardHeader
            userName={user?.nama}
            foto_profil={user?.foto_profil}
            isLoading={isLoadingUser}
          />
        </header>

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-6 lg:px-10 lg:py-8 pb-32 lg:pb-12 min-h-[80vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5">
              <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                Memuat Dashboard...
              </p>
            </div>
          ) : (
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
                  href: "/ai",
                },
                small_services: [
                  {
                    title: "Eksplorasi Konsultan",
                    description: "Temukan ahli hukum yang tepat",
                    icon: "person_search",
                    href: "/explore",
                  },
                  {
                    title: "Ajukan Kasus Anonim",
                    description: "Posting kasus ke Bursa Hukum",
                    icon: "campaign",
                    href: "/bursa/post",
                  },
                ],
              }}
            />
          </div>
          )}
        </main>
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
