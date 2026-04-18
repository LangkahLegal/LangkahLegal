"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";
import { consultantService } from "@/services/consultant.service";

export default function ConsultantClientsPage() {
  const [sortBy, setSortBy] = useState("pengajuan");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- 1. Fetch Data ---
  const {
    data: rawRequests = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["activeRequests"],
    queryFn: () => consultantService.getActiveRequests(),
    select: (data) =>
      data.map((item) => ({
        id_pengajuan: item.id_pengajuan,
        status_pengajuan: item.status_pengajuan,
        nominal_konsultan: item.nominal_konsultan || 0,
        jam_mulai: item.jam_mulai,
        jam_selesai: item.jam_selesai,
        sentTimeRaw: item.created_at,
        consultationDateRaw: `${item.tanggal_pengajuan}T${item.jam_mulai || "00:00"}`,
        jadwal_ketersediaan: {
          tanggal: item.tanggal_pengajuan,
          konsultan: {
            nama_lengkap: item.users?.nama || "Klien",
            foto_profil: item.users?.foto_profil,
          },
        },
      })),
  });

  // --- 2. Sorting Logic ---
  const sortedClients = useMemo(() => {
    return [...rawRequests].sort((a, b) => {
      let dateA, dateB;
      if (sortBy === "pengajuan") {
        dateA = new Date(a.sentTimeRaw).getTime();
        dateB = new Date(b.sentTimeRaw).getTime();
      } else {
        dateA = new Date(a.consultationDateRaw).getTime();
        dateB = new Date(b.consultationDateRaw).getTime();
      }
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [rawRequests, sortBy, sortOrder]);

  const handleSortChange = (type, order) => {
    setSortBy(type);
    setSortOrder(order);
    setIsFilterOpen(false);
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-x-hidden font-['Inter',sans-serif] w-full">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative ml-0 lg:ml-64 min-w-0 w-full transition-all duration-300">
        <PageHeader title="Daftar Klien" />

        {/* REVISI: Menggunakan w-full tanpa max-width sempit agar card bisa melebar penuh */}
        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="w-full max-w-[1600px] mx-auto space-y-8">
            {/* Stats & Filter Header */}
            <div className="flex justify-between items-end px-1">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-[0.2em]">
                  Klien Aktif
                </p>
                <h2 className="text-3xl font-black text-white">
                  {isLoading ? "..." : rawRequests.length}{" "}
                  <span className="text-[#ada3ff]">Klien</span>
                </h2>
              </div>

              <div className="relative">
                <Button
                  variant="icon"
                  className={`!w-12 !h-12 !rounded-2xl border group transition-all ${
                    isFilterOpen
                      ? "!bg-[#6f59fe] border-[#6f59fe]"
                      : "!bg-[#1f1d35] border-white/5 hover:border-[#6f59fe]/50"
                  }`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  disabled={isLoading}
                >
                  <MaterialIcon
                    name="filter_list"
                    className={
                      isFilterOpen
                        ? "text-white"
                        : "text-[#ada3ff] group-hover:text-white"
                    }
                  />
                </Button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-[#1f1d35] rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20 py-2 overflow-hidden flex flex-col">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider mb-2">
                        Urutkan Pengajuan
                      </p>
                      <SortButton
                        active={sortBy === "pengajuan" && sortOrder === "desc"}
                        onClick={() => handleSortChange("pengajuan", "desc")}
                        icon="schedule"
                        label="Terbaru"
                      />
                      <SortButton
                        active={sortBy === "pengajuan" && sortOrder === "asc"}
                        onClick={() => handleSortChange("pengajuan", "asc")}
                        icon="history"
                        label="Terlama"
                      />
                    </div>
                    <div className="px-4 py-2">
                      <p className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider mb-2">
                        Urutkan Jadwal
                      </p>
                      <SortButton
                        active={sortBy === "jadwal" && sortOrder === "asc"}
                        onClick={() => handleSortChange("jadwal", "asc")}
                        icon="event_upcoming"
                        label="Paling Dekat"
                      />
                      <SortButton
                        active={sortBy === "jadwal" && sortOrder === "desc"}
                        onClick={() => handleSortChange("jadwal", "desc")}
                        icon="event_busy"
                        label="Paling Jauh"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* REVISI: Grid diubah menjadi 1 kolom (grid-cols-1) agar card memanjang penuh ke samping */}
            <div className="grid grid-cols-1 gap-6 w-full">
              {isLoading ? (
                <LoadingState />
              ) : isError ? (
                <div className="text-center py-20 text-rose-400 text-sm">
                  Gagal memuat data klien.
                </div>
              ) : sortedClients.length > 0 ? (
                sortedClients.map((client) => (
                  <div key={client.id_pengajuan} className="w-full">
                    <ConsultationCard
                      data={client}
                      role="konsultan"
                      onHide={() => {}}
                      onCancel={() => {}}
                    />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-[#1f1d35]/20 rounded-[2rem] border border-dashed border-white/5">
                  <MaterialIcon
                    name="group_off"
                    className="text-5xl text-[#48455a] mb-4"
                  />
                  <p className="text-[#aca8c1] text-sm">
                    Belum ada klien terjadwal.
                  </p>
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

// --- SUB-COMPONENTS ---
const SortButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl mb-1 transition-all ${
      active
        ? "bg-[#6f59fe] text-white font-bold"
        : "text-[#aca8c1] hover:bg-white/5 hover:text-white"
    }`}
  >
    <div className="flex items-center gap-2">
      <MaterialIcon name={icon} className="text-[16px]" />
      <span>{label}</span>
    </div>
    {active && <MaterialIcon name="check" className="text-[16px]" />}
  </button>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-32 gap-4">
    <div className="w-12 h-12 border-4 border-[#6f59fe] border-t-transparent rounded-full animate-spin" />
    <p className="text-sm text-[#ada3ff] animate-pulse uppercase tracking-[0.2em] font-bold text-[10px]">
      Synchronizing...
    </p>
  </div>
);
