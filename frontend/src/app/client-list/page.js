"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ClientCard from "@/components/client-list/ClientCard";
import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";
import { consultantService } from "@/services/consultant.service"; 

export default function ConsultantClientsPage() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortBy, setSortBy] = useState("pengajuan"); 
  const [sortOrder, setSortOrder] = useState("desc"); 
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        const response = await consultantService.getClientList();
        const rawData = response.data || []; 

        const formattedData = rawData.map((item) => ({
          id: item.id_pengajuan, 
          name: item.nama_klien,
          avatar: item.foto_profil,
          date: item.tanggal_konsultasi, 
          startTime: item.waktu_mulai,
          endTime: item.waktu_selesai,
          sentTimeRaw: item.tanggal_pengajuan,
          consultationDateRaw: `${item.tanggal_konsultasi}T${item.waktu_mulai}:00`, 
        }));

        setClients(formattedData);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data klien. Silakan coba lagi nanti.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleSortChange = (type, order) => {
    setSortBy(type);
    setSortOrder(order);
    setIsFilterOpen(false); 
  };

  const sortedClients = [...clients].sort((a, b) => {
    let dateA, dateB;
    
    if (sortBy === "pengajuan") {
      dateA = new Date(a.sentTimeRaw).getTime();
      dateB = new Date(b.sentTimeRaw).getTime();
    } else {
      dateA = new Date(a.consultationDateRaw).getTime();
      dateB = new Date(b.consultationDateRaw).getTime();
    }

    if (sortOrder === "asc") {
      return dateA - dateB; 
    } else {
      return dateB - dateA; 
    }
  });

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-x-hidden font-['Inter',sans-serif] w-full">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 w-full">
        <PageHeader title="Daftar Klien" />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            
            {/* Stats & Filter Header */}
            <div className="flex justify-between items-end px-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-[0.2em]">
                  Menunggu Konfirmasi
                </p>
                <h2 className="text-3xl font-black text-white">
                  {isLoading ? "..." : clients.length} <span className="text-[#ada3ff]">Klien</span>
                </h2>
              </div>
              
              {/* Filter Dropdown Area */}
              <div className="relative">
                <Button 
                  variant="icon" 
                  className={`!w-12 !h-12 !rounded-2xl border group ${
                    sortBy === "pengajuan" && sortOrder === "desc" 
                    ? "!bg-[#1f1d35] border-white/5 hover:!bg-[#6f59fe]" 
                    : "!bg-[#6f59fe]/20 border-[#6f59fe]/50 hover:!bg-[#6f59fe]/40" 
                  }`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  disabled={isLoading}
                >
                  <MaterialIcon name="filter_list" className="text-[#ada3ff] group-hover:text-white" />
                </Button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-[#1f1d35] rounded-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20 py-2 overflow-hidden flex flex-col">
                    {/* Urutkan Pengajuan */}
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider mb-2">Urutkan Pengajuan</p>
                      <button onClick={() => handleSortChange("pengajuan", "desc")} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg mb-1 ${sortBy === "pengajuan" && sortOrder === "desc" ? "bg-[#6f59fe] text-white font-bold" : "text-[#aca8c1] hover:bg-white/5 hover:text-white"}`}>
                        <div className="flex items-center gap-2"><MaterialIcon name="schedule" className="text-[14px]" /><span>Terbaru (Default)</span></div>
                        {sortBy === "pengajuan" && sortOrder === "desc" && <MaterialIcon name="check" className="text-[14px]" />}
                      </button>
                      <button onClick={() => handleSortChange("pengajuan", "asc")} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${sortBy === "pengajuan" && sortOrder === "asc" ? "bg-[#6f59fe] text-white font-bold" : "text-[#aca8c1] hover:bg-white/5 hover:text-white"}`}>
                        <div className="flex items-center gap-2"><MaterialIcon name="history" className="text-[14px]" /><span>Terlama</span></div>
                        {sortBy === "pengajuan" && sortOrder === "asc" && <MaterialIcon name="check" className="text-[14px]" />}
                      </button>
                    </div>

                    {/* Urutkan Jadwal */}
                    <div className="px-4 py-2">
                      <p className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider mb-2">Urutkan Jadwal</p>
                      <button onClick={() => handleSortChange("jadwal", "asc")} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg mb-1 ${sortBy === "jadwal" && sortOrder === "asc" ? "bg-[#6f59fe] text-white font-bold" : "text-[#aca8c1] hover:bg-white/5 hover:text-white"}`}>
                        <div className="flex items-center gap-2"><MaterialIcon name="arrow_downward" className="text-[14px]" /><span>Paling Dekat</span></div>
                        {sortBy === "jadwal" && sortOrder === "asc" && <MaterialIcon name="check" className="text-[14px]" />}
                      </button>
                      <button onClick={() => handleSortChange("jadwal", "desc")} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${sortBy === "jadwal" && sortOrder === "desc" ? "bg-[#6f59fe] text-white font-bold" : "text-[#aca8c1] hover:bg-white/5 hover:text-white"}`}>
                        <div className="flex items-center gap-2"><MaterialIcon name="arrow_upward" className="text-[14px]" /><span>Paling Jauh</span></div>
                        {sortBy === "jadwal" && sortOrder === "desc" && <MaterialIcon name="check" className="text-[14px]" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* List Klien */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 min-w-0 w-full">
              {isLoading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-[#6D57FC] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#ada3ff] animate-pulse">Memuat klien...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-10 text-red-400 text-sm">
                  {error}
                </div>
              ) : sortedClients.length > 0 ? (
                sortedClients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-[#aca8c1] text-sm">
                  Belum ada klien saat ini.
                </div>
              )}
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