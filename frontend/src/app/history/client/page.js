"use client";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";

// Import Komponen Baru
import HistoryStats from "@/components/history/HistoryStats";
import HistoryCard from "@/components/history/HistoryCard";

const HISTORY_DATA = [
  {
    id: 1,
    name: "Adv. Budi Santoso, S.H.",
    role: "Hukum Pidana & Perdata",
    status: "Selesai",
    time: "12 Okt 2023, 14:30",
    avatar: "https://i.pravatar.cc/150?u=budi",
  },
  {
    id: 2,
    name: "Siti Aminah, M.H.",
    role: "Konsultan Hak Kekayaan Intelektual",
    status: "Selesai",
    time: "05 Okt 2023, 10:00",
    avatar: "https://i.pravatar.cc/150?u=siti",
  },
  {
    id: 3,
    name: "Dr. Pratama Putra, S.H.",
    role: "Spesialis Hukum Bisnis",
    status: "Berlangsung",
    time: null,
    avatar: "https://i.pravatar.cc/150?u=pratama",
  },
];

export default function HistoryPage() {
  // Sortir data agar "Berlangsung" selalu di atas
  const sortedHistory = [...HISTORY_DATA].sort((a, b) => {
    if (a.status === "Berlangsung") return -1;
    if (b.status === "Berlangsung") return 1;
    return 0;
  });

  const completedCount = HISTORY_DATA.filter(
    (i) => i.status === "Selesai",
  ).length;

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden font-['Inter',sans-serif]">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Riwayat" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-8">
            <HistoryStats count={completedCount} />

            <div className="space-y-4">
              {sortedHistory.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
