"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { consultationService } from "@/services/consultation.service"; 
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ClientHero from "@/components/client-list/detail/ClientHero";
import InfoGrid from "@/components/client-list/detail/InfoGrid";
import CaseDescription from "@/components/client-list/detail/CaseDescription";
import DocumentSection from "@/components/client-list/detail/DocumentSection";
import ActionButtons from "@/components/client-list/detail/ActionButtons";

// "2026-04-15T16:44:14.988544" menjadi "15 April 2026, 16.44"
const formatDateTime = (isoString) => {
  if (!isoString) return "-";
  const utcString = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
  const date = new Date(utcString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date).replace("pukul", ","); 
};

// "2026-04-16" menjadi "16 April 2026"
const formatDateOnly = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export default function ClientDetailPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  
  const [data, setData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoadingData(true);
        const response = await consultationService.getConsultationDetail(id);
        setData(response); 
      } catch (err) {
        console.error("Error fetching detail:", err);
        setError("Gagal memuat detail pengajuan.");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id]);

  const handleAction = async (type) => {
    if (isProcessing) return; 
    
    try {
      setIsProcessing(true);
      
      const newStatus = type === "approve" ? "terjadwal" : "ditolak";
      
      await consultationService.updateStatus(id, newStatus);
      
      alert(`Pengajuan berhasil ${type === "approve" ? "diterima" : "ditolak"}!`);
      
      router.push("/client-list");
      
    } catch (err) {
      console.error(`Gagal memproses aksi ${type}:`, err);
      alert("Terjadi kesalahan saat memproses data. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full">
        <Sidebar role="konsultan" />
        <div className="flex-1 flex flex-col items-center justify-center ml-0 lg:ml-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f59fe]"></div>
          <p className="mt-4 text-[#aca8c1]">Memuat detail pengajuan...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full">
        <Sidebar role="konsultan" />
        <div className="flex-1 flex flex-col items-center justify-center ml-0 lg:ml-64">
          <p className="text-[#f87171]">{error || "Data tidak ditemukan."}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-[#1f1d35] rounded-xl border border-white/10 hover:bg-[#2c2945] transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }
  const clientName = data.nama_klien || "Client";
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=1f1d35&color=ada3ff`;

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full overflow-x-hidden font-['Inter',sans-serif]">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-w-0 w-full relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Detail Pengajuan" showBackButton />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            
            <ClientHero 
              name={clientName} 
              avatar={data.foto_profil} 
              fallback={avatarFallback}
            />

            <InfoGrid 
              sentTime={formatDateTime(data.tanggal_pengajuan)}
              date={formatDateOnly(data.tanggal_konsultasi)}
              time={data.rentang_waktu}
            />

            <CaseDescription 
              description={data.deskripsi_kasus || data.deskripsi} 
            />

            <DocumentSection 
              documents={data.berkas_pendukung} 
            />
            {data.status_pengajuan === "pending" && (
              <ActionButtons 
                onAction={handleAction} 
                isLoading={isProcessing} 
              />
            )}

          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}