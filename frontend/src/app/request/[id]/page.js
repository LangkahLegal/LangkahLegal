"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import FileItem from "@/components/ui/FileItem";

// Komponen lokal
import ClientCard from "@/components/request/ClientCard";
import InfoGrid from "@/components/request/InfoGrid";
import CaseDescription from "@/components/request/CaseDescription";
import ActionButtons from "@/components/request/ActionButtons";

// Import service
import { consultationService } from "@/services/consultation.service";

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [requestData, setRequestData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- HELPER UNTUK FORMAT WAKTU RELATIF (REVISI: SELALU HARI) ---
  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;

    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;

    // Jika lebih dari 24 jam, akan selalu menampilkan jumlah hari tanpa batas
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

  const handleAction = async (action) => {
    try {
      setIsProcessing(true);

      // Sesuaikan dengan isi ENUM database kamu
      const newStatus = action === "terima" ? "menunggu_pembayaran" : "ditolak";

      // Kirim ke backend
      await consultationService.updateStatus(id, newStatus);

      alert(`Permintaan berhasil di-${action}!`);
      router.push("/dashboard/consultant");
    } catch (error) {
      // Jika error, kemungkinan besar karena typo string yang tidak ada di ENUM
      console.error("Gagal update status:", error);
      alert("Gagal memproses permintaan. Pastikan status sesuai ENUM.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#6f59fe]"></div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center text-white">
        Data tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-w-0 relative lg:ml-64 transition-all">
        <PageHeader title="Detail Permintaan" showSettings />

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

            <section className="space-y-4">
              <h3 className="text-xs font-bold text-[#aca8c1] uppercase tracking-[0.2em] ml-2">
                Dokumen Terlampir
              </h3>
              <div className="space-y-3">
                {requestData.documents.map((doc) => (
                  <FileItem
                    key={doc.id}
                    file={doc}
                    onClick={() => window.open(doc.url, "_blank")}
                  />
                ))}
              </div>
            </section>

            <ActionButtons
              onReject={() => handleAction("tolak")}
              onAccept={() => handleAction("terima")}
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
