"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Layout & UI
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SuccessView from "@/components/layout/SuccessView";
import { Button, FileUpload } from "@/components/ui";
import { useTheme } from "@/providers/ThemeProvider";

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
import { EmptyState } from "@/components/ui/EmptyState";
import { clearConsultationDraft, readIncomingConsultationDraft } from "@/lib/consultationDraft";
import { useClientValue } from "@/lib/useClientValue";
import { getStoredAccessToken, getStoredRole } from "@/lib/authStorage";

const readIsReady = () => true;
const readHasSession = () => Boolean(getStoredAccessToken());
const readViewerRole = () => getStoredRole()?.toLowerCase() || null;

export default function ConsultantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  // null = belum diketik user, sehingga ringkasan dari Tanya AI (kalau ada) yang ditampilkan.
  const [typedDescription, setDescription] = useState(null);
  const aiDraftDescription = useClientValue(readIncomingConsultationDraft, null);
  const description = typedDescription ?? aiDraftDescription ?? "";
  const [files, setFiles] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isReady = useClientValue(readIsReady, false);
  const hasSession = useClientValue(readHasSession, false);
  const viewerRole = useClientValue(readViewerRole, null);
  const canBook = hasSession && viewerRole === "client";
  const { theme } = useTheme();
  const currentTheme = theme || "dark-tech";

  const themeColors = {
    "dark-tech": { bg: "1f1d35", color: "ada3ff" },
    "theme-cyber-slate": { bg: "17203a", color: "29d1ff" },
    "theme-white-modern": { bg: "f3f1eb", color: "2d1e17" },
  };

  // --- 1. FETCH DATA ---
  const {
    data: consultant,
    isLoading: isLoadingConsultant,
    isError: isConsultantMissing,
  } = useQuery({
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
      name: file?.name || "Untitled",
      size: ((file?.size || 0) / 1024 / 1024).toFixed(2) + " MB",
      type: file?.type?.includes("pdf") ? "pdf" : "image",
      url: file ? URL.createObjectURL(file) : "",
    }));
  }, [files]);

  const selectedDurationMinutes = useMemo(() => {
    if (!startTime || !endTime) return 30;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const diff = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
    return diff > 0 ? diff : 30;
  }, [startTime, endTime]);

  // --- 2. MUTATION ---
  const bookingMutation = useMutation({
    mutationFn: ({ payload, files }) =>
      consultationService.createConsultation(payload, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      clearConsultationDraft();
      setIsSubmitted(true);
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.detail || "Gagal mengirim pengajuan";
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
    if (!selectedDate || !startTime || !endTime || !description?.trim()) {
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

  // --- GENERATE FALLBACK URL ---
  const activeColors = themeColors[currentTheme] || themeColors["dark-tech"];
  const displayName =
    consultant?.nama_lengkap || consultant?.users?.nama || "Konsultan";
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${activeColors.bg}&color=${activeColors.color}&size=128&bold=true`;

  // --- LOADING STATE (THEME AWARE) ---
  if (isLoadingConsultant)
    return (
      <div className="bg-bg min-h-screen flex items-center justify-center transition-colors duration-500">
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5">
          <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
            Memuat Profil Konsultan...
          </p>
        </div>
      </div>
    );

  if (isConsultantMissing || !consultant)
    return (
      <div className="bg-bg text-main min-h-screen flex items-center justify-center px-6 transition-colors duration-500">
        <EmptyState
          icon="person_off"
          title="Konsultan Tidak Ditemukan"
          description="Profil konsultan ini tidak tersedia atau sudah tidak aktif."
          actionLabel="Kembali ke Katalog"
          actionIcon="arrow_back"
          onAction={() => router.push("/explore")}
        />
      </div>
    );

  // --- SUCCESS STATE ---
  if (isSubmitted) {
    return (
      <SuccessView
        title="Permintaan Booking Berhasil Terkirim!"
        description="Mohon tunggu konfirmasi dari Konsultan, anda akan menerima email segera setelah jadwal dikonfirmasi."
        onAction={() => router.push("/dashboard/client")}
      />
    );
  }

  // --- NORMAL STATE ---
  return (
    <div className="bg-bg text-main min-h-screen flex w-full overflow-x-hidden font-primary transition-colors duration-500">
      <Sidebar role="client" />
      <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64 transition-all duration-300">
        <PageHeader title="Profil Konsultan" />

        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8 pb-32 lg:pb-12 scroll-smooth w-full">
          <div className="max-w-2xl mx-auto w-full space-y-10 animate-fade-in">
            {/* Konten Utama Profil */}
            <ConsultantHero
              {...consultant}
              name={displayName}
              avatar={
                consultant?.foto_profil ||
                consultant?.users?.foto_profil ||
                fallbackUrl
              }
              rating={`${consultant?.rating || "0.0"} (${consultant?.reviews || 0}+)`}
            />

            <PriceCard
              price={consultant?.tarif_per_sesi?.toLocaleString("id-ID") || "0"}
              durationMinutes={selectedDurationMinutes}
            />

            <AboutSection
              bio={consultant?.deskripsi_lengkap || "Tidak ada deskripsi."}
              tags={consultant?.spesialisasi?.split(",") || []}
            />

            {!isReady ? null : canBook ? (
              <>
              <SchedulePicker
                consultantId={parseInt(id)}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                startTime={startTime}
                onStartTimeChange={setStartTime}
                endTime={endTime}
                onEndTimeChange={setEndTime}
                rawSchedules={consultant?.jadwal_ketersediaan || []}
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
                  useStyledTitle={true}
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
                  className="py-5 rounded-xl shadow-lg shadow-primary/20"
                >
                  Booking Konsultasi
                </Button>
              </div>
              </>
            ) : (
              <div
                className="bg-surface/60 border border-surface rounded-2xl p-6 text-center space-y-4"
                data-testid="booking-unavailable"
              >
                <p className="text-sm text-muted">
                  {hasSession
                    ? "Hanya akun klien yang dapat mengajukan konsultasi."
                    : "Masuk sebagai klien untuk memilih jadwal dan mengajukan konsultasi."}
                </p>
                {!hasSession && (
                  <Button fullWidth onClick={() => router.push("/auth/login")} className="py-4 rounded-xl">
                    Masuk untuk Mengajukan
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
