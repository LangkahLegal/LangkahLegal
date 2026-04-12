"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ClientCard from "@/components/client-list/ClientCard";
import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";

// MOCK DATA: Diperbarui agar lebih realistis untuk di-sort
// Pastikan format date/time bisa diparsing jadi objek Date untuk disortir dengan benar.
const CLIENTS_LIST = [
  { 
    id: 1, 
    name: "Rizky Pratama", 
    startTime: "14:00",
    endTime: "15:00",
    date: "12 April 2026", 
    // Tambahkan field waktu pengajuan untuk simulasi sorting
    sentTimeRaw: "2026-04-12T08:30:00", // Format ISO
    consultationDateRaw: "2026-04-12T14:00:00", // Format ISO
    avatar: "https://i.pravatar.cc/150?u=1" 
  },
  { 
    id: 2, 
    name: "Siti Maemunah", 
    startTime: "09:00",
    endTime: "10:00",
    date: "13 April 2026", 
    sentTimeRaw: "2026-04-11T15:00:00", 
    consultationDateRaw: "2026-04-13T09:00:00",
    avatar: "https://i.pravatar.cc/150?u=2" 
  },
  { 
    id: 3, 
    name: "Nana Nanana",
    startTime: "09:00",
    endTime: "10:00",
    date: "13 April 2026", 
    sentTimeRaw: "2026-04-12T10:15:00",
    consultationDateRaw: "2026-04-13T09:00:00",
    avatar: "https://i.pravatar.cc/150?u=3" 
  },
  { 
    id: 4, 
    name: "Linda Wijaya", 
    startTime: "13:00",
    endTime: "14:00",
    date: "15 April 2026", 
    sentTimeRaw: "2026-04-10T11:20:00",
    consultationDateRaw: "2026-04-15T13:00:00",
    avatar: "https://i.pravatar.cc/150?u=4" 
  },
  { 
    id: 5, 
    name: "Aditya Pratama", 
    startTime: "15:00",
    endTime: "16:00",
    date: "16 April 2026", 
    sentTimeRaw: "2026-04-12T12:00:00",
    consultationDateRaw: "2026-04-16T15:00:00",
    avatar: "https://i.pravatar.cc/150?u=5" 
  },
];

export default function ConsultantClientsPage() {
  // 1. STATE UNTUK SORTING
  // Default: Waktu Pengajuan Terakhir (Terbaru di atas / Descending)
  const [sortBy, setSortBy] = useState("pengajuan"); // 'pengajuan' | 'jadwal'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' | 'desc'
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 2. FUNGSI UNTUK MENGUBAH SORTING
  const handleSortChange = (type, order) => {
    setSortBy(type);
    setSortOrder(order);
    setIsFilterOpen(false); // Tutup menu setelah memilih
  };

  // 3. LOGIKA SORTING DATA
  // Kita buat copy array (pakai [...]) supaya nggak mutasi state langsung
  const sortedClients = [...CLIENTS_LIST].sort((a, b) => {
    let dateA, dateB;

    if (sortBy === "pengajuan") {
      // Sort berdasarkan kapan klien mengirim pengajuan
      dateA = new Date(a.sentTimeRaw).getTime();
      dateB = new Date(b.sentTimeRaw).getTime();
    } else {
      // Sort berdasarkan kapan jadwal konsultasinya akan dimulai
      dateA = new Date(a.consultationDateRaw).getTime();
      dateB = new Date(b.consultationDateRaw).getTime();
    }

    if (sortOrder === "asc") {
      return dateA - dateB; // Lama ke Baru
    } else {
      return dateB - dateA; // Baru ke Lama (Terbaru di atas)
    }
  });

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-x-hidden font-['Inter',sans-serif] w-full">
      {/* Sidebar Desktop */}
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 w-full">
        <PageHeader title="Daftar Klien" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            
            {/* Stats & Filter Header */}
            <div className="flex justify-between items-end px-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-[0.2em]">
                  Total Klien Aktif
                </p>
                <h2 className="text-3xl font-black text-white">
                  24 <span className="text-[#ada3ff]">Klien</span>
                </h2>
              </div>
              
              {/* Filter Dropdown Area */}
              <div className="relative">
                <Button 
                  variant="icon" 
                  className={`!w-12 !h-12 !rounded-2xl border group ${
                    sortBy === "pengajuan" && sortOrder === "desc" 
                    ? "!bg-[#1f1d35] border-white/5 hover:!bg-[#6f59fe]" // Style Default
                    : "!bg-[#6f59fe]/20 border-[#6f59fe]/50 hover:!bg-[#6f59fe]/40" // Style saat filter aktif
                  }`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <MaterialIcon name="filter_list" className="text-[#ada3ff] group-hover:text-white" />
                </Button>

                {/* Dropdown Menu */}
                {isFilterOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-[#1f1d35] rounded-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20 py-2 overflow-hidden flex flex-col">
                    
                    {/* Kelompok Sort: Waktu Pengajuan */}
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider mb-2">Urutkan Pengajuan</p>
                      
                      <button 
                        onClick={() => handleSortChange("pengajuan", "desc")}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg mb-1 ${sortBy === "pengajuan" && sortOrder === "desc" ? "bg-[#6f59fe] text-white font-bold" : "text-[#aca8c1] hover:bg-white/5 hover:text-white"}`}
                      >
                        <div className="flex items-center gap-2">
                          <MaterialIcon name="schedule" className="text-[14px]" />
                          <span>Terbaru (Default)</span>
                        </div>
                        {sortBy === "pengajuan" && sortOrder === "desc" && <MaterialIcon name="check" className="text-[14px]" />}
                      </button>

                      <button 
                        onClick={() => handleSortChange("pengajuan", "asc")}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${sortBy === "pengajuan" && sortOrder === "asc" ? "bg-[#6f59fe] text-white font-bold" : "text-[#aca8c1] hover:bg-white/5 hover:text-white"}`}
                      >
                        <div className="flex items-center gap-2">
                          <MaterialIcon name="history" className="text-[14px]" />
                          <span>Terlama</span>
                        </div>
                        {sortBy === "pengajuan" && sortOrder === "asc" && <MaterialIcon name="check" className="text-[14px]" />}
                      </button>
                    </div>

                    {/* Kelompok Sort: Jadwal Konsultasi */}
                    <div className="px-4 py-2">
                      <p className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider mb-2">Urutkan Jadwal</p>
                      
                      <button 
                        onClick={() => handleSortChange("jadwal", "asc")}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg mb-1 ${sortBy === "jadwal" && sortOrder === "asc" ? "bg-[#6f59fe] text-white font-bold" : "text-[#aca8c1] hover:bg-white/5 hover:text-white"}`}
                      >
                        <div className="flex items-center gap-2">
                          <MaterialIcon name="arrow_downward" className="text-[14px]" />
                          <span>Paling Dekat</span>
                        </div>
                        {sortBy === "jadwal" && sortOrder === "asc" && <MaterialIcon name="check" className="text-[14px]" />}
                      </button>

                      <button 
                        onClick={() => handleSortChange("jadwal", "desc")}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${sortBy === "jadwal" && sortOrder === "desc" ? "bg-[#6f59fe] text-white font-bold" : "text-[#aca8c1] hover:bg-white/5 hover:text-white"}`}
                      >
                        <div className="flex items-center gap-2">
                          <MaterialIcon name="arrow_upward" className="text-[14px]" />
                          <span>Paling Jauh</span>
                        </div>
                        {sortBy === "jadwal" && sortOrder === "desc" && <MaterialIcon name="check" className="text-[14px]" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* List Klien */}
            <div className="space-y-4 min-w-0 w-full">
              {sortedClients.length > 0 ? (
                sortedClients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))
              ) : (
                <div className="text-center py-10 text-[#aca8c1] text-sm">
                  Belum ada klien aktif.
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Navigation Mobile */}
        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}