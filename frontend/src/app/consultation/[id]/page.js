"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

// Layout & UI
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import ClientCard from "@/components/request/ClientCard";
import InfoGrid from "@/components/request/InfoGrid";
import CaseDescription from "@/components/request/CaseDescription";
import AttachedDocuments from "@/components/documents/AttachedDocuments";
import ZoomLinkCard from "@/components/consultation/ZoomLinkCard";

// Services
import { consultationService } from "@/services/consultation.service";

export default function ConsultationDetail() {
  const { id } = useParams();

  // --- 1. FETCH DATA DETAIL (TanStack Query) ---
  const {
    data: requestData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["consultationRequest", id],
    queryFn: () => consultationService.getConsultationDetail(id),
    enabled: !!id,
    // Transformasi data agar siap pakai di komponen
    select: (data) => ({
      clientName: data.nama_klien,
      fotoProfil: data.foto_profil,
      createdAt: data.created_at, // Mengirim Raw Date (ISO String)
      consultationDate: data.tanggal_konsultasi,
      consultationTime: data.rentang_waktu,
      caseDescription: data.deskripsi_kasus,
      zoomLink: data.link_zoom,
      zoomPassword: data.zoom_password || data.password_zoom, // Sesuaikan field backend
      documents:
        data.berkas_pendukung?.map((doc) => ({
          id: doc.id_dokumen,
          name: doc.nama_dokumen,
          date: "Dokumen Pendukung",
          size: `${(doc.ukuran_kb / 1024).toFixed(2)} MB`,
          type: doc.tipe_file?.includes("pdf") ? "pdf" : "image",
          url: doc.file_url,
        })) || [],
    }),
  });

  // --- 2. LOADING STATE ---
  if (isLoading) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#6f59fe] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#ada3ff] text-[10px] font-bold tracking-widest uppercase animate-pulse">
            Synchronizing Detail...
          </p>
        </div>
      </div>
    );
  }

  // --- 3. ERROR STATE ---
  if (isError || !requestData) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center text-white p-6 text-center">
        <div>
          <p className="text-rose-400 font-bold mb-4">
            Gagal memuat detail konsultasi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-w-0 relative lg:ml-64 transition-all duration-300">
        <PageHeader title="Detail Konsultasi" />

        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-8">
            {/* Mengirim createdAt (Raw Date) ke ClientCard */}
            <ClientCard
              name={requestData.clientName}
              createdAt={requestData.createdAt}
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

            {/* Menampilkan Zoom Link jika tersedia */}
            {requestData.zoomLink && (
              <ZoomLinkCard
                link={requestData.zoomLink}
                password={requestData.zoomPassword}
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
