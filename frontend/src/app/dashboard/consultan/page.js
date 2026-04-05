"use client";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

// Import Custom Components
import IncomeCard from "@/components/dashboard/IncomeCard";
import StatCard from "@/components/dashboard/StatCard";
import LiveSessionCard from "@/components/dashboard/LiveSessionCard";
import UpcomingSessionCard from "@/components/dashboard/UpcomingSessionCard";
import RequestCard from "@/components/dashboard/RequestCard";


const PRO_STATS = {
  income: "Rp 15.000.000",
  activeConsultations: 5,
  totalClients: 12,
};
const REQUESTS = [
  { id: 1, name: "Rizky Pratama", case: "Kriminal Umum", time: "2 jam lalu" },
  { id: 2, name: "Linda Wijaya", case: "Hukum Bisnis", time: "5 jam lalu" },
];

export default function ConsultanDashboardPage() {
  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <DashboardHeader userName="Adv. Ahmad" />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-8 lg:px-12 space-y-10 pb-32 lg:pb-12">
          {/* Income Section */}
          <IncomeCard amount={PRO_STATS.income} />

          {/* Stats Section */}
          <section className="grid grid-cols-2 gap-4 lg:gap-8">
            <StatCard
              label="Konsultasi Aktif"
              val={PRO_STATS.activeConsultations}
              icon="gavel"
            />
            <StatCard
              label="Total Klien"
              val={PRO_STATS.totalClients}
              icon="group"
            />
          </section>

          {/* Schedule Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-headline font-bold text-white">
                Jadwal Terdekat
              </h2>
              <button className="text-xs font-bold text-[#ada3ff] hover:underline">
                Lihat semua
              </button>
            </div>

            <LiveSessionCard
              clientName="Bambang Subianto"
              caseType="Sengketa Tanah"
              time="Hari ini, 10:00 WIB"
            />

            <UpcomingSessionCard
              name="Siti Aminah"
              caseType="Konsultasi Waris"
              time="14:00 WIB"
              dateLabel="Besok"
            />
          </section>

          {/* New Requests Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-headline font-bold text-white">
              Permintaan Baru
            </h2>
            <div className="space-y-4">
              {REQUESTS.map((req) => (
                <RequestCard key={req.id} {...req} />
              ))}
            </div>
          </section>
        </main>

        <div className="lg:hidden">
          <BottomNav
            customItems={
              [
                /* Custom Pro Items */
              ]
            }
          />
        </div>
      </div>
    </div>
  );
}
