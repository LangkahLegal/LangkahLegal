"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Layout & UI
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SuccessView from "@/components/layout/SuccessView"; // Import SuccessView (Fullscreen)
import { MaterialIcon } from "@/components/ui/Icons";
import { Button, FileUpload } from "@/components/ui";

// Services
import { consultantService } from "@/services/consultant.service";
import { consultationService } from "@/services/consultation.service";

// Local Components
import ConsultantHero from "@/components/explore/pengajuan/ConsultantHero";
import PriceCard from "@/components/explore/pengajuan/PriceCard";
import AboutSection from "@/components/explore/pengajuan/AboutSection";
import SchedulePicker from "@/components/explore/pengajuan/SchedulePicker";
import ConsultationForm from "@/components/explore/pengajuan/ConsultationForm";
import AttachedDocuments from "@/components/documents/AttachedDocuments";

export default function ConsultantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false); // State untuk mengontrol Fullscreen View

  // --- 1. FETCH DATA ---
  const { data: consultant, isLoading: isLoadingConsultant } = useQuery({
    queryKey: ["consultant", id],
    queryFn: () => consultantService.getConsultantDetail(parseInt(id)),
    enabled: !!id,
  });

  const { data: bookedSlots = [] } = useQuery({
    queryKey: ["bookedSlots", id],
    queryFn: () => consultationService.getBookedSlots(parseInt(id)),
    enabled: !!id,
    retry: 1,
  });

  const displayFiles = useMemo(() => {
    return files.map((file, index) => ({
      id: index,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      type: file.type.includes("pdf") ? "pdf" : "image",
      url: URL.createObjectURL(file),
    }));
  }, [files]);

  // --- 2. MUTATION ---
  const bookingMutation = useMutation({
    mutationFn: ({ payload, files }) =>
      consultationService.createConsultation(payload, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      setIsSubmitted(true); // Aktifkan tampilan sukses fullscreen
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.detail || "Gagal mengirim pengajuan";
      alert(errorMessage);
    },
  });

  // --- HANDLERS ---
  const handleFileChange = (newFile) => {
    if (files.length >= 10) return alert("Maksimal 10 file");
    setFiles((prev) => [...prev, newFile]);
  };

  const handleRemoveFile = (id) => {
    setFiles((prev) => prev.filter((_, i) => i !== id));
  };

  const handleBooking = () => {
    if (!selectedDate || !startTime || !endTime || !description.trim()) {
      return alert("Mohon lengkapi semua data pengajuan.");
    }

    const currentSchedule = consultant?.jadwal_ketersediaan?.find(
      (s) => s.tanggal === selectedDate,
    );

    if (!currentSchedule) return alert("Jadwal tidak tersedia.");

    const payload = {
      id_jadwal: currentSchedule.id_jadwal,
      deskripsi_kasus: description,
      tanggal_pengajuan: selectedDate,
      jam_mulai: `${startTime}:00`,
      jam_selesai: `${endTime}:00`,
    };

    bookingMutation.mutate({ payload, files });
  };

  // --- LOADING STATE ---
  if (isLoadingConsultant)
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f59fe]"></div>
      </div>
    );

  // --- SUCCESS STATE (FULLSCREEN VIEW) ---
  if (isSubmitted) {
    return (
      <SuccessView
        title="Permintaan Booking Berhasil Terkirim!"
        description="Mohon tunggu konfirmasi dari Konsultan, anda akan menerima email segera setelah jadwal dikonfirmasi."
        onAction={() => router.push("/dashboard/client")}
      />
    );
  }

  // --- NORMAL STATE (PROFIL KONSULTAN) ---
  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full overflow-x-hidden font-['Inter',sans-serif]">
      <Sidebar role="client" />
      <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64">
        <PageHeader title="Profil Konsultan" />

        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-2xl mx-auto w-full space-y-10">
            {/* Konten Utama Profil */}
            <ConsultantHero {...consultant} />

            <PriceCard
              price={consultant.tarif_per_sesi?.toLocaleString("id-ID") || "0"}
            />

            <AboutSection
              bio={consultant.deskripsi_lengkap}
              tags={consultant.spesialisasi?.split(",") || []}
            />

            <SchedulePicker
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              startTime={startTime}
              onStartTimeChange={setStartTime}
              endTime={endTime}
              onEndTimeChange={setEndTime}
              rawSchedules={consultant.jadwal_ketersediaan || []}
              bookedSlots={bookedSlots}
            />

            <ConsultationForm
              description={description}
              onDescriptionChange={setDescription}
            />

            <div className="space-y-4">
              <AttachedDocuments
                title="Dokumen Pendukung"
                documents={displayFiles}
                showCount={true}
                allowDelete={true}
                onDelete={handleRemoveFile}
              />
              <FileUpload
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                maxSizeMB={10}
              />
            </div>

            <div className="pt-2">
              <Button
                fullWidth
                isLoading={bookingMutation.isPending}
                onClick={handleBooking}
                className="py-5 rounded-xl shadow-[0_10px_30px_rgba(111,89,254,0.3)]"
              >
                Booking Konsultasi
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
