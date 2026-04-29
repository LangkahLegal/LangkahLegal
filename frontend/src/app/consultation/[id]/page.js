"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

// Layout & UI
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui";
import ClientCard from "@/components/request/ClientCard";
import InfoGrid from "@/components/request/InfoGrid";
import CaseDescription from "@/components/request/CaseDescription";
import AttachedDocuments from "@/components/documents/AttachedDocuments";
import ZoomLinkCard from "@/components/consultation/ZoomLinkCard";

// Services
import { consultationService } from "@/services/consultation.service";

export default function ConsultationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "client";
    setUserRole(role);
  }, []);

  // --- 1. FETCH DATA DETAIL (TanStack Query) ---
  const {
    data: requestData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["consultationRequest", id],
    queryFn: () => consultationService.getConsultationDetail(id),
    enabled: !!id,
    select: (data) => ({
      clientName: data.nama_klien,
      fotoProfil: data.foto_profil,
      createdAt: data.created_at,
      consultationDate: data.tanggal_konsultasi,
      consultationTime: data.rentang_waktu,
      caseDescription: data.deskripsi_kasus,
      zoomLink: data.link_zoom,
      zoomPassword: data.zoom_password || data.password_zoom,
      status: data.status_pengajuan,
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
      /* REFACTOR: bg-[#0e0c1e] -> bg-bg | border-[#6f59fe] -> border-primary | text-[#ada3ff] -> text-primary-light */
      <div className="bg-bg min-h-screen flex items-center justify-center transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-primary-light text-[10px] font-bold tracking-widest uppercase animate-pulse">
            Synchronizing Detail...
          </p>
        </div>
      </div>
    );
  }

  // --- 3. ERROR STATE ---
  if (isError || !requestData) {
    return (
      /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-white -> text-main | text-rose-400 -> text-danger | bg-white/10 -> bg-surface */
      <div className="bg-bg min-h-screen flex items-center justify-center text-main p-6 text-center transition-colors duration-500">
        <div>
          <p className="text-danger font-bold mb-4">
            Gagal memuat detail konsultasi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs bg-surface px-4 py-2 rounded-lg hover:opacity-80 transition-all border border-surface"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    /* REFACTOR: bg-[#0e0c1e] -> bg-bg | text-[#e8e2fc] -> text-main */
    <div className="bg-bg text-main min-h-screen flex transition-colors duration-500 font-primary">
      <Sidebar role={userRole} />

      <div className="flex-1 flex flex-col min-w-0 relative lg:ml-64 transition-all duration-300">
        <PageHeader title="Detail Konsultasi" />

        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-8 animate-fade-in">
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
              /* REFACTOR: text-[#aca8c1] -> text-muted */
              titleClassName="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-2"
              allowDelete={false}
            />

            <ZoomLinkCard
              link={requestData.zoomLink}
              password={requestData.zoomPassword}
              status={requestData.status}
              role={userRole}
            />
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role={userRole} />
        </div>
      </div>
    </div>
  );
}
