"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import FeaturedServices from "@/components/dashboard/FeaturedServices";
import CategoryList from "@/components/dashboard/CategoryList";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";

const USER_DATA = {
  name: "Muhammad Luthfi Aziz",
  avatar: "/api/placeholder/48/48",
};
const CONSULTATION_DATA = {
  status: "MENUNGGU KONFIRMASI",
  consultant: {
    name: "Adv. Ahmad Sudirman, S.H., M.H.",
    specialization: "Hukum Perdata & Pidana",
    avatar: "/api/placeholder/48/48",
  },
  time: "Senin, 12 Des 2024 - 10:30 WIB",
};
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
export default function DashboardPage() {
  return (
    /* flex-col untuk mobile (nav di bawah), flex-row untuk desktop (nav di samping) */
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      {/* 1. SIDEBAR: Otomatis tersembunyi di mobile karena class 'hidden lg:flex' di dalamnya */}
      <Sidebar />

      {/* 2. WRAPPER UTAMA: ml-0 di mobile, ml-64 hanya di desktop */}
      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        {/* Header: Full width di keduanya, tapi padding menyesuaikan */}
        <header className="sticky top-0 z-40 w-full">
          <DashboardHeader
            userName="Muhammad Luthfi Aziz"
            avatarUrl="/api/placeholder/48/48"
          />
        </header>

        {/* 3. MAIN CONTENT */}
        <main className="relative z-10 w-full px-4 py-6 md:px-8 lg:px-12 lg:py-12 pb-32 lg:pb-12">
          {/* Container ini yang akan melebar ke kanan di desktop */}
          <div className="w-full max-w-full lg:max-w-[1600px] space-y-8 lg:space-y-12">
            {/* Konsultasi */}
            <div className="w-full">
              <ConsultationCard data={CONSULTATION_DATA} />
            </div>

            {/* Kategori: Muncul di tengah di desktop, di bawah di mobile */}
            <div className="hidden lg:block w-full">
              <CategoryList />
            </div>

            {/* Layanan Unggulan */}
            <div className="w-full">
              <FeaturedServices services={SERVICES_DATA} />
            </div>

            {/* Kategori untuk Mobile: Hanya muncul di layar kecil */}
            <div className="lg:hidden w-full">
              <CategoryList />
            </div>
          </div>
        </main>

        {/* 4. BOTTOM NAV: Hanya muncul di mobile (max-width lg) */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
