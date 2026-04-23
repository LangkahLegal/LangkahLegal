"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { userService } from "@/services/user.service";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import AboutHero from "@/components/setting/about/AboutHero";
import VisiMisiCards from "@/components/setting/about/VisiMisiCards";
import CoreValues from "@/components/setting/about/CoreValues";
import BottomBanner from "@/components/setting/about/BottomBanner";

export default function AboutPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("client");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userService.getFullProfile();
        setUserRole(data.role || "client");
      } catch (err) {
        console.error("Gagal ambil data profil:", err);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden">
      {/* Sidebar untuk Desktop */}
      <Sidebar role={userRole} />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader
          title="Tentang LangkahLegal"
          onSettingsClick={() => router.push("/setting")}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            
            <AboutHero />
            <VisiMisiCards />
            <CoreValues />
            <BottomBanner />

          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role={userRole} />
        </div>
      </div>
    </div>
  );
}