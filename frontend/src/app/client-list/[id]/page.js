"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

// Mock data detail pengajuan
const MOCK_DETAIL = {
  id: "1",
  clientName: "Rizky Pratama",
  avatar: "https://i.pravatar.cc/150?u=1",
  isVerified: true,
  sentTime: "2 jam lalu",
  consultationDate: "24 Mei 2024",
  consultationTime: "10:00 - 11:00 WIB",
  caseDescription: "Permintaan peninjauan dokumen legalitas terkait kasus Kriminal Umum. Klien memerlukan analisis mendalam terhadap berkas perkara untuk memastikan seluruh prosedur hukum telah dipenuhi sesuai regulasi yang berlaku.",
  clientNote: "Mohon bantuannya untuk memeriksa berkas bukti yang saya lampirkan untuk sesi konsultasi nanti.",
  driveLink: "https://drive.google.com/drive/folders/1A2b3C4d5E6f7G8h9I0jK?usp=sharing"
};

export default function ClientDetailPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(MOCK_DETAIL.clientName)}&background=1f1d35&color=ada3ff`;

  const handleAction = (type) => {
    setIsProcessing(true);
    console.log(`Action: ${type} for ID: ${id}`);
    
    setTimeout(() => {
      setIsProcessing(false);
      router.push("/client-list");
    }, 1500);
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex w-full overflow-x-hidden font-['Inter',sans-serif]">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-w-0 w-full relative ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Detail Pengajuan" showBackButton />

        <main className="flex-1 overflow-y-auto px-6 pb-32 pt-8 scroll-smooth w-full">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            
            {/* Profile Section (Hero Style - Seragam dengan ConsultantHero) */}
            <div className="flex flex-col items-center justify-center pt-4 pb-8 relative">
              {/* Ambient Glow Background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#6f59fe]/20 blur-[80px] -z-10 rounded-full" />
              
              {/* Avatar Section */}
              <div className="relative mb-4 sm:mb-6">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[6px] border-[#6f59fe]/10 p-1.5 backdrop-blur-sm shadow-inner bg-[#0e0c1e]/50">
                  <div className="w-full h-full rounded-full border-2 border-[#6f59fe] p-1 bg-[#1f1d35]">
                    <img 
                      src={MOCK_DETAIL.avatar || fallbackAvatar} 
                      alt={MOCK_DETAIL.clientName} 
                      className="w-full h-full rounded-full object-cover shadow-2xl"
                    />
                  </div>
                </div>
              </div>
              
              {/* Nama */}
              <div className="relative z-10 text-center space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight px-2">
                  {MOCK_DETAIL.clientName}
                </h2>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <InfoCard icon="schedule" label="Waktu Pengajuan" value={MOCK_DETAIL.sentTime} className="col-span-2"/>
              <InfoCard icon="calendar_today" label="Tanggal Konsultasi" value={MOCK_DETAIL.consultationDate} />
              <InfoCard icon="access_time" label="Jam Konsultasi" value={MOCK_DETAIL.consultationTime} />
            </div>

            {/* Case Description Section */}
            <div className="bg-[#1f1d35] rounded-[2rem] p-6 space-y-4 border border-white/5 shadow-lg">
              <div className="flex items-center gap-2 border-l-4 border-[#ada3ff] pl-3">
                <h3 className="font-bold text-lg text-white">Deskripsi Kasus</h3>
              </div>
              <p className="text-[#aca8c1] text-sm leading-relaxed">
                {MOCK_DETAIL.caseDescription}
              </p>
              <div className="bg-[#2c2945]/50 p-4 rounded-2xl border border-white/5 italic text-[#ada3ff] text-sm">
                "{MOCK_DETAIL.clientNote}"
              </div>
            </div>

            {/* Documents Section */}
            <div className="space-y-4 min-w-0 w-full">
              <h3 className="text-xs font-bold text-[#aca8c1] uppercase tracking-widest px-2">Dokumen Terlampir</h3>
              
              {/* Tampilan GDrive Link */}
              {MOCK_DETAIL.driveLink ? (
                <a 
                  href={MOCK_DETAIL.driveLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#1f1d35] p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 flex items-center justify-between hover:bg-[#2c2945] hover:border-[#6f59fe]/30 transition-all cursor-pointer group shadow-md w-full min-w-0"
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#6f59fe]/20 flex items-center justify-center shrink-0">
                      <MaterialIcon name="link" className="text-[#ada3ff] text-xl" />
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5 flex-1">
                      <span className="text-sm md:text-base font-bold text-white truncate">
                        Akses Google Drive
                      </span>
                      <span className="text-[10px] md:text-xs text-[#aca8c1] truncate opacity-80">
                        {MOCK_DETAIL.driveLink}
                      </span>
                    </div>
                  </div>
                  <MaterialIcon 
                    name="open_in_new" 
                    className="text-[#aca8c1] group-hover:text-[#ada3ff] shrink-0 ml-3 text-lg md:text-xl transition-colors" 
                  />
                </a>
              ) : (
                <div className="bg-[#1f1d35] p-5 rounded-[2rem] border border-white/5 text-center">
                  <p className="text-sm text-[#aca8c1] italic">Tidak ada tautan dokumen yang dilampirkan.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => handleAction("reject")}
                className="!border-[#f87171]/30 !text-[#f87171] hover:!bg-[#f87171]/10 !rounded-2xl py-4"
              >
                <div className="flex items-center gap-2">
                  <MaterialIcon name="close" />
                  <span>Tolak</span>
                </div>
              </Button>
              <Button 
                fullWidth 
                onClick={() => handleAction("approve")}
                isLoading={isProcessing}
                className="!bg-[#6f59fe] hover:!bg-[#5b46e0] !rounded-2xl py-4 shadow-[0_10px_20px_rgba(111,89,254,0.3)]"
              >
                <div className="flex items-center gap-2">
                  <MaterialIcon name="check_circle" />
                  <span>Terima</span>
                </div>
              </Button>
            </div>
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, className = "" }) {
  return (
    <div className={`bg-[#1f1d35] p-3.5 md:p-5 rounded-[1.5rem] border border-white/5 flex flex-col justify-center gap-1.5 ${className}`}>
      <p className="text-[9px] md:text-[10px] font-bold text-[#aca8c1] uppercase tracking-wider line-clamp-1">
        {label}
      </p>
      <div className="flex items-center gap-1.5 md:gap-2">
        <MaterialIcon name={icon} className="text-[#ada3ff] text-[14px] md:text-sm shrink-0" />
        <span className="text-xs md:text-sm font-bold text-white truncate">{value}</span>
      </div>
    </div>
  );
}