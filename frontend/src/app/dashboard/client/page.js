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
  const [hideCard, setHideCard] = useState(false);

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
        const [profile, consultations] = await Promise.all([
          userService.getFullProfile(), 
          consultationService.getConsultations(),
        ]);

        // Mapping Profil Client
        setUser({
          nama: profile?.nama || "User",
          foto_profil: profile?.foto_profil || profile?.avatar || "",
        });

        // Mapping Konsultasi Aktif
        if (consultations && consultations.length > 0) {
          const raw = consultations[0];
          setActiveConsultation({
            status_pengajuan: raw.status_pengajuan,
            jadwal_ketersediaan: {
              tanggal: raw.jadwal_ketersediaan?.tanggal,
              jam_mulai: raw.jadwal_ketersediaan?.jam_mulai,
              jam_selesai: raw.jadwal_ketersediaan?.jam_selesai,
              konsultan: {
                nama_lengkap: raw.jadwal_ketersediaan?.konsultan?.nama_lengkap,
                spesialisasi: raw.jadwal_ketersediaan?.konsultan?.spesialisasi,
                foto_profil: raw.jadwal_ketersediaan?.konsultan?.foto_profil,
              },
            },
          });
        }
      } catch (error) {
        // Kalau gagal, error-nya bakal muncul merah-merah di Console
        console.error("Gagal memuat data dashboard client:", error);
      } finally {
        // Berhasil ataupun gagal, loading HARUS dimatikan
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleCancelConsultation = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan konsultasi ini?")) return;

    try {
      // Asumsi kita ambil ID dari activeConsultation yang di-set saat fetch
      // Kita butuh ID pengajuan yang aslinya disimpan di konsultasi
      const idPengajuan = activeConsultation?.id_pengajuan;

      await consultationService.updateStatus(idPengajuan, "dibatalkan");

      // Refresh data agar status berubah jadi dibatalkan
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
              {activeConsultation && !hideCard ? (
                <ConsultationCard
                  data={activeConsultation}
                  onCancel={handleCancelConsultation}
                  onHide={() => setHideCard(true)}
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
