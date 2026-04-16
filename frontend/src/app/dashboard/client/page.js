"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import EmptyConsultationCard from "@/components/dashboard/EmptyConsultationCard";
import FeaturedServices from "@/components/dashboard/FeaturedServices";
import CategoryList from "@/components/dashboard/CategoryList";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";

// Import Services
import { userService } from "@/services/user.service"; // Ganti ke userService
import { consultationService } from "@/services/consultation.service";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempHiddenIds, setTempHiddenIds] = useState([]);

  const DASHBOARD_CATEGORIES = [
    { id: "semua", label: "Semua" },
    { id: "pidana", label: "Pidana" },
    { id: "perdata", label: "Perdata" },
    { id: "umum", label: "Umum" },
  ];

  const SERVICES_DATA = {
    ai_service: {
      title: "Tanya AI Langkah",
      description: "Jawaban hukum instan berbasis AI yang akurat.",
      icon: "psychology",
    },
    small_services: [
      { title: "Litigasi", description: "Pendampingan sidang", icon: "gavel" },
      {
        title: "Review Akta",
        description: "Cek legalitas dokumen",
        icon: "description",
      },
    ],
  };

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        // 1. Ambil data rejected yang disembunyikan permanen dari LocalStorage
        const persistentHidden = JSON.parse(
          localStorage.getItem("hidden_rejected_ids") || "[]",
        );

        const [profile, consultations] = await Promise.all([
          userService.getFullProfile(),
          consultationService.getConsultations(),
        ]);

        setUser({
          nama: profile?.nama || "User",
          foto_profil: profile?.foto_profil || profile?.avatar || "",
        });

        const allowedStatuses = [
          "pending",
          "menunggu_pembayaran",
          "terjadwal",
          "ditolak",
        ];

        // 2. Filter data dari API
        const filtered = consultations
          .filter((item) => allowedStatuses.includes(item.status_pengajuan))
          // Buang ID yang sudah ada di LocalStorage (pasti yang statusnya ditolak)
          .filter((item) => !persistentHidden.includes(item.id_pengajuan))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (filtered.length > 0) {
          const raw = filtered[0];
          setActiveConsultation({
            id_pengajuan: raw.id_pengajuan,
            status_pengajuan: raw.status_pengajuan,
            jam_mulai: raw.jam_mulai,
            jam_selesai: raw.jam_selesai,
            jadwal_ketersediaan: {
              tanggal: raw.jadwal_ketersediaan?.tanggal,
              konsultan: {
                nama_lengkap: raw.jadwal_ketersediaan?.konsultan?.nama_lengkap,
                spesialisasi: raw.jadwal_ketersediaan?.konsultan?.spesialisasi,
                foto_profil: raw.jadwal_ketersediaan?.konsultan?.foto_profil,
              },
            },
          });
        } else {
          setActiveConsultation(null);
        }
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleHideCard = () => {
    if (!activeConsultation) return;

    const currentId = activeConsultation.id_pengajuan;
    const currentStatus = activeConsultation.status_pengajuan;

    if (currentStatus === "ditolak") {
      // MASUK LOCAL STORAGE (PERMANEN)
      const persistentHidden = JSON.parse(
        localStorage.getItem("hidden_rejected_ids") || "[]",
      );
      if (!persistentHidden.includes(currentId)) {
        const updatedList = [...persistentHidden, currentId];
        localStorage.setItem(
          "hidden_rejected_ids",
          JSON.stringify(updatedList),
        );
      }
      setActiveConsultation(null); // Langsung hapus dari layar
    } else {
      // MASUK STATE (SEMENTARA / RESET PAS REFRESH)
      setTempHiddenIds((prev) => [...prev, currentId]);
    }
  };

  const isTemporarilyHidden =
    activeConsultation &&
    tempHiddenIds.includes(activeConsultation.id_pengajuan);

  const handleCancelConsultation = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan konsultasi ini?")) return;
    try {
      const idPengajuan = activeConsultation?.id_pengajuan;
      await consultationService.updateStatus(idPengajuan, "dibatalkan");
      alert("Konsultasi berhasil dibatalkan.");
      window.location.reload();
    } catch (error) {
      alert("Gagal membatalkan konsultasi.");
    }
  };


  

  if (isLoading) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center text-[#ada3ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#ada3ff] border-t-transparent rounded-full animate-spin"></div>
          <p className="animate-pulse font-bold text-[10px] tracking-widest uppercase">
            Synchronizing Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <header className="sticky top-0 z-40 w-full">
          <DashboardHeader
            userName={user?.nama}
            foto_profil={user?.foto_profil}
          />
        </header>

        <main className="relative z-10 w-full px-4 py-6 md:px-8 lg:px-12 lg:py-12 pb-32 lg:pb-12">
          <div className="w-full max-w-full lg:max-w-[1600px] space-y-8 lg:space-y-12">
            <div className="w-full">
              {activeConsultation && !isTemporarilyHidden ? (
                <ConsultationCard
                  data={activeConsultation}
                  onCancel={handleCancelConsultation}
                  onHide={handleHideCard}
                />
              ) : (
                <EmptyConsultationCard />
              )}
            </div>

            <div className="hidden lg:block w-full">
              <CategoryList
                categories={DASHBOARD_CATEGORIES}
                activeCategory="semua"
                onCategoryChange={() => {}}
              />
            </div>

            <div className="w-full">
              <FeaturedServices services={SERVICES_DATA} />
            </div>

            <div className="lg:hidden w-full">
              <CategoryList
                categories={DASHBOARD_CATEGORIES}
                activeCategory="semua"
                onCategoryChange={() => {}}
              />
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
