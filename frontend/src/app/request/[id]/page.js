"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Layout & UI
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SuccessView from "@/components/layout/SuccessView"; // Import SuccessView

// Komponen lokal
import ClientCard from "@/components/request/ClientCard";
import InfoGrid from "@/components/request/InfoGrid";
import CaseDescription from "@/components/request/CaseDescription";
import AttachedDocuments from "@/components/documents/AttachedDocuments";
import ActionButtons from "@/components/request/ActionButtons";

// Import service
import { consultationService } from "@/services/consultation.service";

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- STATE UNTUK SUCCESS VIEW ---
  const [isProcessed, setIsProcessed] = useState(false);
  const [actionLabel, setActionLabel] = useState("");

  // --- 1. FETCH DATA DETAIL ---
  const { data: requestData, isLoading } = useQuery({
    queryKey: ["consultationRequest", id],
    queryFn: () => consultationService.getConsultationDetail(id),
    enabled: !!id,
    select: (data) => ({
      clientName: data.nama_klien,
      fotoProfil: data.foto_profil,
      rawDate: data.created_at,
      consultationDate: data.tanggal_konsultasi,
      consultationTime: data.rentang_waktu,
      caseDescription: data.deskripsi_kasus,
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

  // --- 2. MUTATION UNTUK UPDATE STATUS ---
  const statusMutation = useMutation({
    mutationFn: (newStatus) => consultationService.updateStatus(id, newStatus),
    onSuccess: (_, newStatus) => {
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["activeRequests"] });

      // Set label untuk SuccessView
      setActionLabel(
        newStatus === "menunggu_pembayaran" ? "Diterima" : "Ditolak",
      );
      setIsProcessed(true);
    },
    onError: (error) => {
      alert("Gagal memproses permintaan.");
    },
  });

  const handleAction = (action) => {
    const newStatus = action === "terima" ? "menunggu_pembayaran" : "ditolak";
    statusMutation.mutate(newStatus);
  };

  // --- RENDER SUCCESS VIEW ---
  if (isProcessed) {
    return (
      <SuccessView
        title={`Permintaan Berhasil ${actionLabel}!`}
        description={`Permintaan konsultasi dari ${requestData?.clientName} telah berhasil ${actionLabel.toLowerCase()}. Klien akan segera mendapatkan notifikasi.`}
        onAction={() => router.push("/dashboard/consultant")}
      />
    );
  }

  // --- RENDER LOADING ---
  if (isLoading) return <LoadingSpinner />;

  // --- RENDER NOT FOUND ---
  if (!requestData)
    return (
      <div className="text-white text-center mt-20 font-bold uppercase tracking-widest opacity-40">
        Data tidak ditemukan.
      </div>
    );

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-w-0 relative lg:ml-64 transition-all">
        <PageHeader title="Detail Permintaan" />

        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-8">
            {/* Informasi Klien */}
            <ClientCard
              name={requestData.clientName}
              createdAt={requestData.rawDate}
              avatar={requestData.fotoProfil}
            />

            {/* Grid Informasi Waktu */}
            <InfoGrid
              date={requestData.consultationDate}
              time={requestData.consultationTime}
            />

            {/* Deskripsi Kasus */}
            <CaseDescription description={requestData.caseDescription} />

            {/* Dokumen Lampiran dengan Preview Modal */}
            <AttachedDocuments
              title="Dokumen Terlampir"
              titleClassName="text-xs font-bold text-[#aca8c1] uppercase tracking-[0.2em] ml-2"
              documents={requestData.documents}
              showCount={true}
              allowDelete={false}
            />

            {/* Tombol Aksi Terima/Tolak */}
            <ActionButtons
              onReject={() => handleAction("tolak")}
              onAccept={() => handleAction("terima")}
              isLoading={statusMutation.isPending}
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

const LoadingSpinner = () => (
  <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6f59fe]"></div>
      <p className="text-[#ada3ff] text-[10px] font-bold tracking-widest uppercase animate-pulse">
        Loading Detail...
      </p>
    </div>
  </div>
);
