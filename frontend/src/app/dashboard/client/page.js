"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import EmptyConsultationCard from "@/components/dashboard/EmptyConsultationCard";
import FeaturedServices from "@/components/dashboard/FeaturedServices";
import AppShell from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

import { userService } from "@/services/user.service";
import { consultationService } from "@/services/consultation.service";

/** Daftar kartu yang disembunyikan pengguna; data yang rusak dianggap kosong dan dibuang. */
const readHiddenRejectedIds = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("hidden_rejected_ids") || "[]");
    return Array.isArray(stored) ? stored.map((id) => Number(id)) : [];
  } catch {
    localStorage.removeItem("hidden_rejected_ids");
    return [];
  }
};

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
  const {
    data: consultations,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["consultations", "aktif"],
    queryFn: consultationService.getActiveConsultations,
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

    const persistentHidden = readHiddenRejectedIds();

    // Status yang relevan dan urutan terbaru sudah disaring backend (?aktif=true);
    // di sini hanya kartu yang disembunyikan pengguna yang dibuang.
    const filtered = consultations
      .filter((item) => !persistentHidden.includes(Number(item.id_pengajuan)))
      .filter((item) => !tempHiddenIds.includes(Number(item.id_pengajuan)));

    return filtered.length > 0 ? filtered[0] : null;
  }, [consultations, tempHiddenIds]);

  const handleHideCard = () => {
    if (!activeConsultation) return;
    const currentId = Number(activeConsultation.id_pengajuan);
    const currentStatus = activeConsultation.status_pengajuan;

    if (currentStatus === "ditolak") {
      const stored = readHiddenRejectedIds();
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
    <AppShell role="client" contentClassName="min-h-screen">
        <DashboardHeader
          userName={user?.nama}
          foto_profil={user?.foto_profil}
          isLoading={isLoadingUser}
        />

        <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-5 lg:px-8 lg:py-6 pb-28 lg:pb-10 min-h-[80vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5">
              <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                Memuat Dashboard...
              </p>
            </div>
          ) : (
            <div className="w-full space-y-6 lg:space-y-8 animate-fade-in">
              <div className="w-full">
                {isError ? (
                  <EmptyState
                    icon="error"
                    title="Gagal Memuat Konsultasi"
                    description="Data konsultasi tidak dapat dimuat. Periksa koneksi Anda lalu coba lagi."
                    actionLabel="Coba Lagi"
                    actionIcon="refresh"
                    onAction={() => refetch()}
                    variant="card"
                    className="py-12"
                  />
                ) : activeConsultation ? (
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
    </AppShell>
  );
}
