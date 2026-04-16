"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import HistoryCardConsultant from "@/components/history/HistoryCardConsultant";
import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";
import { consultantService } from "@/services/consultant.service";

const formatDateId = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// 1. UPDATE: Tambahkan semua kemungkinan enum di sini
const normalizeStatus = (status) => {
  const lowerStatus = (status || "").toLowerCase();
  switch (lowerStatus) {
    case "menunggu_pembayaran":
      return "Menunggu Pembayaran";
    case "terjadwal":
      return "Terjadwal";
    case "selesai":
      return "Selesai";
    case "dibatalkan":
      return "Dibatalkan";
    case "ditolak":
      return "Ditolak";
    case "kedaluwarsa":
      return "Kedaluwarsa";
    default:
      return status || "Tidak Diketahui";
  }
};

export default function ConsultantHistoryPage() {
  const [historyList, setHistoryList] = useState([]);
  const [totalSelesai, setTotalSelesai] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const response = await consultantService.getHistory();

        setTotalSelesai(response.total_sesi_selesai || 0);

        // 2. UPDATE: Filter data yang statusnya BUKAN pending
        const rawData = response.data || [];
        const filteredData = rawData.filter(
          (req) =>
            // Cek status_pengajuan atau status_akhir (sesuaikan dengan nama kolom DB kamu)
            (req.status_pengajuan || req.status_akhir)?.toLowerCase() !== "pending"
        );

        const formattedData = filteredData.map((req) => ({
          id: req.id_pengajuan,
          name: req.nama_klien || "Klien Anonim",
          price: req.nominal_konsultan || 0,
          // Sesuaikan pengambilan field status dengan backend kamu
          status: normalizeStatus(req.status_pengajuan || req.status_akhir),
          date: formatDateId(req.tanggal_konsultasi),
          time: req.rentang_waktu || "-",
          avatar: req.foto_profil || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.nama_klien || "K")}&background=1f1d35&color=ada3ff`,
          category: "Konsultasi Hukum",
        }));

        setHistoryList(formattedData);
      } catch (error) {
        console.error("Gagal memuat riwayat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    // ... SISA KODE UI SAMA PERSIS SEPERTI SEBELUMNYA ...
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

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8">

            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold text-white">Semua Sesi</h2>
              <span className="bg-[#1f1d35] text-[#ada3ff] text-[10px] font-bold px-4 py-1.5 rounded-full border border-white/5 uppercase tracking-widest">
                {isLoading ? "..." : `${totalSelesai} Selesai`}
              </span>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-[#6D57FC] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#ada3ff] animate-pulse">Memuat riwayat...</p>
                </div>
              ) : historyList.length > 0 ? (
                historyList.map((item) => (
                  <HistoryCardConsultant key={item.id} item={item} />
                ))
              ) : (
                <div className="text-center py-16 bg-[#1f1d35]/30 rounded-3xl border border-white/5 border-dashed">
                  <MaterialIcon name="history" className="text-5xl text-[#48455a] mb-3" />
                  <p className="text-[#aca8c1] text-sm">Belum ada riwayat sesi konsultasi.</p>
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