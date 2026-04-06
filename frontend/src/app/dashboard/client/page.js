"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import EmptyConsultationCard from "@/components/dashboard/EmptyConsultationCard"; // Pastikan sudah dibuat
import FeaturedServices from "@/components/dashboard/FeaturedServices";
import CategoryList from "@/components/dashboard/CategoryList";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";

// Import Services
import { authService } from "@/services/auth.service";
import { consultationService } from "@/services/consultation.service";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data Statis untuk FeaturedServices
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
      try {
        setIsLoading(true);

        // 1. Fetch data secara paralel agar lebih cepat
        const [profile, consultations] = await Promise.all([
          authService.getProfile(),
          consultationService.getConsultations(),
        ]);

        setUser(profile);

        // 2. Cek apakah ada pengajuan konsultasi
        if (consultations && consultations.length > 0) {
          const raw = consultations[0]; // Ambil data terbaru

          // Mapping ke format yang dibutuhkan ConsultationCard
          const mappedData = {
            status_pengajuan: raw.status_pengajuan,
            jadwal_ketersediaan: {
              tanggal: raw.jadwal_ketersediaan?.tanggal,
              jam_mulai: raw.jadwal_ketersediaan?.jam_mulai,
              jam_selesai: raw.jadwal_ketersediaan?.jam_selesai,
              konsultan: {
                nama_lengkap: raw.jadwal_ketersediaan?.konsultan?.nama_lengkap,
                spesialisasi: raw.jadwal_ketersediaan?.konsultan?.spesialisasi,
                foto_profile: raw.jadwal_ketersediaan?.konsultan?.foto_profile,
              },
            },
          };
          setActiveConsultation(mappedData);
        } else {
          setActiveConsultation(null);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center text-[#ada3ff]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#ada3ff] border-t-transparent rounded-full animate-spin"></div>
          <p className="animate-pulse font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      {/* 1. SIDEBAR */}
      <Sidebar />

      {/* 2. WRAPPER UTAMA */}
      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <header className="sticky top-0 z-40 w-full">
          <DashboardHeader
            userName={user?.nama || "User"}
            avatarUrl={user?.avatar_url || "/api/placeholder/48/48"}
          />
        </header>

        {/* 3. MAIN CONTENT */}
        <main className="relative z-10 w-full px-4 py-6 md:px-8 lg:px-12 lg:py-12 pb-32 lg:pb-12">
          <div className="w-full max-w-full lg:max-w-[1600px] space-y-8 lg:space-y-12">
            {/* Bagian Konsultasi: Conditional Rendering */}
            <div className="w-full">
              {activeConsultation ? (
                <ConsultationCard data={activeConsultation} />
              ) : (
                <EmptyConsultationCard />
              )}
            </div>

            {/* Kategori Desktop */}
            <div className="hidden lg:block w-full">
              <CategoryList />
            </div>

            {/* Layanan Unggulan */}
            <div className="w-full">
              <FeaturedServices services={SERVICES_DATA} />
            </div>

            {/* Kategori Mobile */}
            <div className="lg:hidden w-full">
              <CategoryList />
            </div>
          </div>
        </main>

        {/* 4. BOTTOM NAV MOBILE */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
