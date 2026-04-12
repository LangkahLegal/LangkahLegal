// app/consultant/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

import { consultantService } from "@/services/consultant.service";
import { consultationService } from "@/services/consultation.service";

import ConsultantHero from "@/components/konsultasi/pengajuan/ConsultantHero";
import PriceCard from "@/components/konsultasi/pengajuan/PriceCard";
import AboutSection from "@/components/konsultasi/pengajuan/AboutSection";
import SchedulePicker from "@/components/konsultasi/pengajuan/SchedulePicker";
import ConsultationForm from "@/components/konsultasi/pengajuan/ConsultationForm";

export default function ConsultantDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [consultant, setConsultant] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [dates, setDates] = useState([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  // --- LIFTING STATE ---
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [startTime, setStartTime] = useState("08:00"); // Default sesuai jam buka terkecil
  const [endTime, setEndTime] = useState("09:00");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoadingPage(true);
        const consultantId = parseInt(id);

        const [profileData, bookedData] = await Promise.all([
          consultantService.getConsultantDetail(consultantId),
          consultationService.getBookedSlots(consultantId).catch(() => []),
        ]);

        setConsultant(profileData);
        setBookedSlots(bookedData);

        if (profileData.jadwal_ketersediaan?.length > 0) {
          const formattedDates = profileData.jadwal_ketersediaan.map((j) => {
            const d = new Date(j.tanggal);
            return {
              day: d
                .toLocaleDateString("id-ID", { weekday: "short" })
                .toUpperCase(),
              date: d.getDate().toString(),
              fullDate: j.tanggal,
            };
          });

          setDates(formattedDates);
          setSelectedDate(formattedDates[0].fullDate);
          // Inisialisasi jam awal sesuai jam_mulai di DB
          setStartTime(
            profileData.jadwal_ketersediaan[0].jam_mulai.substring(0, 5),
          );
        }
      } catch (error) {
        console.error("Gagal memuat profil:", error);
      } finally {
        setIsLoadingPage(false);
      }
    };

    if (id) fetchAllData();
  }, [id]);

  const handleBooking = async () => {
    if (!description.trim()) return alert("Mohon isi deskripsi kasus Anda");

    try {
      setIsSubmitting(true);
      const currentSchedule = consultant?.jadwal_ketersediaan?.find(
        (s) => s.tanggal === selectedDate,
      );

      if (!currentSchedule) return alert("Jadwal tidak tersedia");

      const formatISO = (time) => `${selectedDate}T${time}:00+07:00`;

      const payload = {
        id_jadwal: currentSchedule.id_jadwal,
        deskripsi_kasus: description,
        jam_mulai: `${startTime}:00`, // Hasil: "08:00:00"
        jam_selesai: `${endTime}:00`,
      };

      await consultationService.createConsultation(payload, files);
      alert("Pengajuan berhasil dikirim!");
      router.push("/client/history");
    } catch (error) {
      alert(error.response?.data?.detail || "Gagal mengirim pengajuan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPage)
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f59fe]"></div>
      </div>
    );

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full overflow-x-hidden font-['Inter',sans-serif]">
      <Sidebar role="client" />
      <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64">
        <PageHeader title="Profil Konsultan" />
        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-2xl mx-auto w-full space-y-10">
            <ConsultantHero
              {...consultant}
              name={consultant.nama_lengkap || consultant.users?.nama}
              avatar={consultant.users?.foto_profil}
              rating={`${consultant.rating || "0.0"} (${consultant.reviews}+)`}
            />
            <PriceCard
              price={consultant.tarif_per_sesi?.toLocaleString("id-ID") || "0"}
            />
            <AboutSection
              bio={consultant.deskripsi_lengkap}
              tags={
                consultant.spesialisasi?.split(",").map((s) => s.trim()) || []
              }
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
              files={files}
              onFilesChange={setFiles}
            />
            <div className="pt-2">
              <Button
                fullWidth
                isLoading={isSubmitting}
                onClick={handleBooking}
                className="py-5 rounded-xl shadow-[0_10px_30px_rgba(111,89,254,0.3)]"
              >
                <div className="flex items-center gap-2 justify-center">
                  <MaterialIcon name="calendar_month" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Booking Konsultasi
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </main>
        <BottomNav role="client" className="lg:hidden" />
      </div>
    </div>
  );
}
