"use client";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ChangePasswordCard from "@/components/setting/security/ChangePasswordCard";
import TwoFactorCard from "@/components/setting/security/TwoFactorCard";

export default function SecurityPage() {
  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex font-['Inter']">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-64">
        <PageHeader title="Keamanan & Sandi" />

        <main className="flex-1 px-6 pt-8 pb-32">
          <div className="max-w-2xl mx-auto space-y-6">
            <ChangePasswordCard />
            <TwoFactorCard />
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}