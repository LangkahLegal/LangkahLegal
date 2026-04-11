"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

import ConsultantHero from "@/components/konsultasi/pengajuan/ConsultantHero";
import PriceCard from "@/components/konsultasi/pengajuan/PriceCard";
import AboutSection from "@/components/konsultasi/pengajuan/AboutSection";
import SchedulePicker from "@/components/konsultasi/pengajuan/SchedulePicker";
import ConsultationForm from "@/components/konsultasi/pengajuan/ConsultationForm";

const MOCK_CONSULTANT = {
  name: "Adv. Ahmad Sudirman, S.H., M.H.",
  rating: "4.9 (120+)",
  price: "150.000",
  bio: "Adv. Ahmad Sudirman memiliki pengalaman lebih dari 15 tahun dalam menangani berbagai kasus hukum di Indonesia. Spesialisasi beliau mencakup Hukum Perdata (sengketa kontrak, keluarga) dan Hukum Pidana (korporasi & umum).",
  tags: ["Litigasi", "Somasi", "Legal Opinion"],
  avatar: "https://i.pravatar.cc/150?u=ahmad",
};

const DATES = [
  { day: "SEN", date: "12" },
  { day: "SEL", date: "13" },
  { day: "RAB", date: "14" },
  { day: "KAM", date: "15" },
  { day: "JUM", date: "16" },
  { day: "SAB", date: "17" },
];

export default function ConsultantDetailPage() {
  const [selectedDate, setSelectedDate] = useState("13");
  const [description, setDescription] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBooking = async () => {
    setIsLoading(true);
    // Simulasi API Call
    console.log("Submit:", { selectedDate, description, driveLink });
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full overflow-x-hidden font-['Inter',sans-serif]">
      <Sidebar role="client" />

      <div className="flex-1 flex flex-col min-w-0 w-full relative lg:ml-64 transition-all duration-300">
        <PageHeader title="Profil Konsultan" />

        <main className="flex-1 overflow-y-auto px-5 pb-40 pt-6 scroll-smooth w-full">
          <div className="max-w-2xl mx-auto w-full space-y-10">
            <ConsultantHero {...MOCK_CONSULTANT} />

            <PriceCard price={MOCK_CONSULTANT.price} />

            <AboutSection
              bio={MOCK_CONSULTANT.bio}
              tags={MOCK_CONSULTANT.tags}
            />

            <SchedulePicker
              dates={DATES}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />

            <ConsultationForm
              description={description}
              onDescriptionChange={setDescription}
              driveLink={driveLink}
              onDriveLinkChange={setDriveLink}
            />

            <div className="pt-2">
              <Button
                fullWidth
                isLoading={isLoading}
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

        <div className="lg:hidden">
          <BottomNav role="client" />
        </div>
      </div>
    </div>
  );
}
