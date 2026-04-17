"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ClientCard from "@/components/request/ClientCard";
import InfoGrid from "@/components/request/InfoGrid";
import CaseDescription from "@/components/request/CaseDescription";
import AttachedDocuments from "@/components/documents/AttachedDocuments";
import ZoomLinkCard from "@/components/client-list/ZoomLinkCard";
import { consultationService } from "@/services/consultation.service";

export default function ConsultationDetail() {
  const { id } = useParams();
    const router = useRouter();
  
    const [requestData, setRequestData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
  
    // --- HELPER UNTUK FORMAT WAKTU RELATIF (REVISI: SELALU HARI) ---
    const formatRelativeTime = (dateString) => {
      if (!dateString) return "-";
  
      const now = new Date();
  
      // PAKSA asumsikan string dari database adalah UTC dengan menambahkan 'Z'
      // 15:13:05 -> 15:13:05Z
      const standardizedDate = dateString.endsWith("Z")
        ? dateString
        : `${dateString}Z`;
  
      const past = new Date(standardizedDate);
      const diffInMs = now - past;
  
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
  
      if (diffInSeconds < 0) return "Baru saja";
  
      if (diffInSeconds < 60) return "Baru saja";
      if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
      if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
  
      return `${diffInDays} hari yang lalu`;
    };
    useEffect(() => {
      const fetchDetail = async () => {
        try {
          setIsLoading(true);
          const data = await consultationService.getConsultationDetail(id);
  
          setRequestData({
            clientName: data.nama_klien,
            fotoProfil: data.foto_profil,
            timeAgo: formatRelativeTime(data.tanggal_pengajuan),
            consultationDate: data.tanggal_konsultasi,
            consultationTime: data.rentang_waktu,
            caseDescription: data.deskripsi_kasus,
            zoomLink: data.link_zoom,
            documents: data.berkas_pendukung.map((doc) => ({
              id: doc.id_dokumen,
              name: doc.nama_dokumen,
              date: "Dokumen Pendukung",
              size: `${(doc.ukuran_kb / 1024).toFixed(2)} MB`,
              type: doc.tipe_file?.includes("pdf") ? "pdf" : "image",
              url: doc.file_url,
            })),
          });
        } catch (error) {
          console.error("Gagal mengambil detail pengajuan:", error);
        } finally {
          setIsLoading(false);
        }
      };
  
      if (id) fetchDetail();
    }, [id]);

  if (isLoading) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-[#6D57FC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-w-0 relative lg:ml-64 transition-all">
        <PageHeader title="Detail Konsultasi" />

        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-2xl mx-auto px-6 pt-8 pb-24 space-y-8">
            <ClientCard
              name={requestData.clientName}
              timeAgo={requestData.timeAgo}
              avatar={requestData.fotoProfil}
            />

            <InfoGrid
              date={requestData.consultationDate}
              time={requestData.consultationTime}
            />

            <CaseDescription description={requestData.caseDescription} />

            <AttachedDocuments 
              documents={requestData.documents} 
              title="Dokumen Terlampir"
              titleClassName="text-xs font-bold text-[#aca8c1] uppercase tracking-[0.2em] ml-2"
              allowDelete={false} 
            />

            <ZoomLinkCard 
              link={requestData.zoomLink} 
              password={requestData.zoomPassword} 
            />

          </div>
        </main>
        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}