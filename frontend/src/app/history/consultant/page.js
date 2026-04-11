"use client";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import HistoryCardConsultant from "@/components/history/HistoryCardConsultant";
import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";

const HISTORY_MOCK = [
  {
    id: 1,
    name: "Aditya Pratama",
    category: "Hukum Perdata",
    price: 1500000,
    status: "Selesai",
    date: "12 Okt 2023",
    time: "14:00 - 15:30",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya",
  },
  {
    id: 2,
    name: "Siti Maemunah",
    category: "Konsultasi Bisnis",
    price: 850000,
    status: "Selesai",
    date: "11 Okt 2023",
    time: "10:00 - 11:00",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti",
  },
  {
    id: 3,
    name: "Budi Santoso",
    category: "Hukum Pidana",
    price: 0,
    status: "Dibatalkan",
    date: "10 Okt 2023",
    time: "15:30 - 16:30",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
  },
  {
    id: 4,
    name: "Linda Wijaya",
    category: "Hukum Keluarga",
    price: 1200000,
    status: "Selesai",
    date: "09 Okt 2023",
    time: "13:00 - 14:30",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Linda",
  },
];

export default function ConsultantHistoryPage() {
  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden font-['Inter',sans-serif]">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader 
          title="Riwayat" 
          rightElement={
            <Button variant="icon" className="!bg-transparent">
              <MaterialIcon name="tune" className="text-[#ada3ff]" />
            </Button>
          }
        />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Header Sesi Terakhir */}
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold text-white">Sesi Terakhir</h2>
              <span className="bg-[#1f1d35] text-[#ada3ff] text-[10px] font-bold px-4 py-1.5 rounded-full border border-white/5 uppercase tracking-widest">
                4 Selesai
              </span>
            </div>

            {/* List Cards */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {HISTORY_MOCK.map((item) => (
                <HistoryCardConsultant key={item.id} item={item} />
              ))}
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}