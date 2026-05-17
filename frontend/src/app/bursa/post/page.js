"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SuccessView from "@/components/layout/SuccessView";
import { Button, FileUpload } from "@/components/ui";
import { caseService } from "@/services/case.service";
import { consultationService } from "@/services/consultation.service";
import SchedulePicker from "@/components/explore/pengajuan/SchedulePicker";
import AttachedDocuments from "@/components/documents/AttachedDocuments";
import CategoryList from "@/components/dashboard/CategoryList";
import ConsultationForm from "@/components/explore/pengajuan/ConsultationForm";
import { MaterialIcon } from "@/components/ui/Icons";

const KATEGORI_OPTIONS = [
  { id: "umum", label: "Umum" },
  { id: "pidana", label: "Pidana" },
  { id: "perdata", label: "Perdata" }
];

export default function PostCasePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0].id);
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Ambil data konsultasi klien untuk mencegah double booking
  const { data: myConsultations = [] } = useQuery({
    queryKey: ["myConsultations"],
    queryFn: consultationService.getConsultations,
  });

  const bookedSlots = useMemo(() => {
    // Hanya filter yang masih pending atau terjadwal
    return myConsultations.filter(
      (c) => c.status_pengajuan !== "selesai" && c.status_pengajuan !== "dibatalkan"
    );
  }, [myConsultations]);

  const displayFiles = useMemo(() => {
    return files.map((file, index) => ({
      id: index,
      name: file?.name || "Untitled",
      size: ((file?.size || 0) / 1024 / 1024).toFixed(2) + " MB",
      type: file?.type?.includes("pdf") ? "pdf" : "image",
      url: file ? URL.createObjectURL(file) : "",
    }));
  }, [files]);

  const handleFileChange = (newFile) => {
    if (files.length >= 10) return alert("Maksimal 10 file");
    setFiles((prev) => [...prev, newFile]);
  };

  const handleRemoveFile = (id) => {
    setFiles((prev) => prev.filter((_, i) => i !== id));
  };

  const postMutation = useMutation({
    mutationFn: ({ payload, files }) => caseService.createCase(payload, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bursa_cases"] });
      queryClient.invalidateQueries({ queryKey: ["myConsultations"] });
      setIsSubmitted(true);
    },
    onError: (err) => {
      alert(err?.response?.data?.detail || "Gagal memposting kasus.");
    },
  });

  const handleSubmit = () => {
    if (!deskripsi.trim() || !tanggal || !jamMulai || !jamSelesai) {
        return alert("Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).");
    }

    postMutation.mutate({
      payload: {
        kategori_hukum: kategori,
        deskripsi_kasus_awam: deskripsi.trim(),
        tanggal_konsultasi: tanggal,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
      },
      files,
    });
  };

  // --- SUCCESS STATE ---
  if (isSubmitted) {
    return (
      <SuccessView
        title="Kasus Berhasil Diposting ke Ruang Publik!"
        description="Kasus Anda kini tersedia di Ruang Publik secara anonim. Mitra konsultan kami akan segera meninjau dan mengklaim kasus Anda."
        onAction={() => router.push("/dashboard/client")}
      />
    );
  }

  // --- NORMAL STATE ---
  return (
    <div className="bg-bg text-main min-h-screen flex w-full overflow-x-hidden font-primary transition-colors duration-500">
      <Sidebar role="client" />
      <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64 transition-all duration-300">
        <PageHeader title="Pengajuan Anonim" backHref="/dashboard/client" />

        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-2xl mx-auto w-full space-y-10 animate-fade-in">
            
            {/* Header Form bergaya Hero */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-6 rounded-3xl border border-surface shadow-soft rounded-3xl p-6 lg:p-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                  <MaterialIcon
                    name="storefront"
                    className="text-primary-light text-3xl"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-main tracking-tight font-headline">
                Ajukan Kasus ke Ruang Publik
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                Identitas Anda akan disamarkan. Konsultan ahli kami akan melihat rincian kasus dan menjadwalkan konsultasi dengan Anda.
              </p>
            </div>
              </div>
            </div>

            {/* Category */}
            <CategoryList
              title="Kategori Hukum"
              categories={KATEGORI_OPTIONS}
              activeCategory={kategori}
              onCategoryChange={setKategori}
              useStyledTitle={true}
            />

            {/* Description */}
            <ConsultationForm
              description={deskripsi}
              onDescriptionChange={setDeskripsi}
            />

            {/* Schedule Picker */}
            <SchedulePicker
              selectedDate={tanggal}
              onDateSelect={setTanggal}
              startTime={jamMulai}
              onStartTimeChange={setJamMulai}
              endTime={jamSelesai}
              onEndTimeChange={setJamSelesai}
              isPublic={true}
              bookedSlots={bookedSlots}
            />

            {/* Documents */}
            <div className="space-y-4">
              <AttachedDocuments
                title="Dokumen Pendukung"
                documents={displayFiles}
                showCount={true}
                allowDelete={true}
                onDelete={handleRemoveFile}
                useStyledTitle={true}
              />
              <FileUpload
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                maxSizeMB={10}
              />
            </div>

            {/* Info Anonim */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3">
              <MaterialIcon
                name="shield"
                className="text-primary-light text-xl mt-0.5 shrink-0"
              />
              <p className="text-xs text-muted leading-relaxed">
                Kasus Anda akan diposting <strong className="text-main">secara anonim</strong>. Konsultan hanya akan
                melihat kategori, deskripsi, dan jadwal — bukan identitas Anda.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                fullWidth
                isLoading={postMutation.isPending}
                onClick={handleSubmit}
                className="py-5 rounded-xl shadow-lg shadow-primary/20"
              >
                Posting ke Ruang Publik
              </Button>
            </div>

          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
