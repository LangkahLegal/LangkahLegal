"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

// Components
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import IncomeCard from "@/components/dashboard/IncomeCard";
import StatCard from "@/components/dashboard/StatCard";
import ConsultationCard from "@/components/dashboard/ConsultationCard";
import { MaterialIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

// Services
import { consultantService } from "@/services/consultant.service";
import { userService } from "@/services/user.service";

// --- HELPERS ---
const formatCurrency = (value) => {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `Rp ${safeValue.toLocaleString("id-ID")}`;
};

const isSchedulePast = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false; // Bursa claims tanpa jadwal tetap tampil
  const datePart = dateStr.split("T")[0];
  const scheduleDateTime = new Date(`${datePart}T${timeStr}`);
  const now = new Date();
  return scheduleDateTime < now;
};

export default function ConsultantDashboardPage() {
  const router = useRouter();

  // --- 1. QUERIES ---
  const { data: user } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => userService.getFullProfile(),
    select: (data) => ({
      name: data?.nama || data?.nama_lengkap || "Konsultan",
      foto_profil: data?.foto_profil || data?.avatar,
      status_verifikasi: data?.status_verifikasi,
      alasan_penolakan: data?.alasan_penolakan,
    }),
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["consultantStats"],
    queryFn: () => consultantService.getDashboardStats(),
    select: (data) => ({
      income: data?.total_income ?? 0,
      activeConsultations: data?.total_klien_aktif ?? 0,
      totalClients: data?.total_klien ?? 0,
    }),
  });

  const { data: pendingRequests = [], isLoading: isPendingLoading } = useQuery({
    queryKey: ["pendingRequests"],
    queryFn: () => consultantService.getPendingRequests(),
    refetchInterval: 30000,
  });

  const { data: activeRequests = [], isLoading: isActiveLoading } = useQuery({
    queryKey: ["activeRequests"],
    queryFn: () => consultantService.getActiveRequests(),
    refetchInterval: 60000,
  });

  // --- 2. LOGIKA MAPPING & FILTERING ---
  const transformToCardData = (raw) => ({
    id_pengajuan: raw.id_pengajuan,
    status_pengajuan: raw.status_pengajuan,
    jam_mulai: raw.jam_mulai,
    jam_selesai: raw.jam_selesai,
    nominal_konsultan: raw.nominal_konsultan || 0,
    jadwal_ketersediaan: {
      tanggal: raw.tanggal_pengajuan,
      konsultan: {
        nama_lengkap: raw.users?.nama || "Klien",
        foto_profil: raw.users?.foto_profil,
      },
    },
  });

  const closestSession = useMemo(() => {
    if (!activeRequests?.length) return null;
    const filtered = activeRequests.filter((req) => {
      const isScheduled = req.status_pengajuan?.toLowerCase() === "terjadwal";
      const isFuture = !isSchedulePast(req.tanggal_pengajuan, req.jam_mulai);
      return isScheduled && isFuture;
    });
    if (!filtered.length) return null;
    const sorted = filtered.sort((a, b) => {
      const dateTimeA = new Date(
        `${a.tanggal_pengajuan.split("T")[0]}T${a.jam_mulai}`,
      );
      const dateTimeB = new Date(
        `${b.tanggal_pengajuan.split("T")[0]}T${b.jam_mulai}`,
      );
      return dateTimeA - dateTimeB;
    });
    return transformToCardData(sorted[0]);
  }, [activeRequests]);

  const mappedRequests = useMemo(() => {
    return pendingRequests
      .filter((req) => !isSchedulePast(req.tanggal_pengajuan, req.jam_mulai))
      .map((req) => transformToCardData(req));
  }, [pendingRequests]);

  const isLoadingScreen = isStatsLoading || isActiveLoading || isPendingLoading;

  // --- 3. LOGICA HIDE & SHOW DENGAN LOADING STATE ---
  return (
    <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64 transition-all">
        <DashboardHeader
          userName={user?.name}
          foto_profil={user?.foto_profil}
          isLoading={!user}
        />

        <main className="w-full max-w-[1600px] mx-auto px-6 py-6 lg:px-10 lg:py-8 pb-32 lg:pb-12 min-h-[80vh]">
          {isLoadingScreen ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5">
              <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                Memuat Dashboard...
              </p>
            </div>
          ) : (
            <div className="space-y-10 animate-fade-in">
              {/* NOTIFICATION: REJECTION ALERT */}
              {user?.status_verifikasi === "ditolak" && user?.alasan_penolakan && (
                <div className="bg-danger/10 border border-danger/20 rounded-2xl p-5 flex items-start gap-4">
                  <MaterialIcon
                    name="error"
                    className="text-danger text-2xl shrink-0 mt-0.5"
                  />
                  <div>
                    <h3 className="text-danger font-bold text-base md:text-lg mb-1 leading-tight">
                      Pengajuan Verifikasi Ditolak
                    </h3>
                    <p className="text-main/80 text-xs md:text-sm leading-relaxed">
                      Mohon maaf, pengajuan Anda tidak dapat disetujui karena:{" "}
                      <strong>&quot;{user.alasan_penolakan}&quot;</strong>. Silakan
                      lengkapi atau perbaiki profil Anda di menu{" "}
                      <span
                        className="font-semibold cursor-pointer underline hover:text-primary transition-colors"
                        onClick={() => router.push("/setting/profile")}
                      >
                        Pengaturan Profil
                      </span>
                      .
                    </p>
                  </div>
                </div>
              )}

              {/* INCOME SECTION */}
              <IncomeCard amount={formatCurrency(stats?.income)} />

              {/* STATS GRID */}
              <section className="grid grid-cols-2 gap-4 lg:gap-8 w-full">
                <StatCard
                  label="Konsultasi Aktif"
                  val={stats?.activeConsultations || 0}
                  icon="gavel"
                  variant="primary"
                />
                <StatCard
                  label="Total Klien"
                  val={stats?.totalClients || 0}
                  icon="group"
                  variant="secondary"
                />
              </section>

              {/* JADWAL TERDEKAT */}
              <section className="space-y-6 w-full">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-6 bg-primary rounded-full shadow-soft" />
                  <h2 className="text-xl font-headline font-black text-main tracking-tight uppercase">
                    Jadwal Terdekat
                  </h2>
                </div>

                <div className="w-full">
                  {closestSession ? (
                    <ConsultationCard
                      data={closestSession}
                      role="konsultan"
                      onHide={() => {}}
                      onCancel={() => {}}
                    />
                  ) : (
                    <EmptyState
                      icon="event_busy"
                      title="Jadwal Kosong"
                      description="Tidak ada jadwal mendatang yang tersedia."
                      className="py-12"
                    />
                  )}
                </div>
              </section>

              {/* PERMINTAAN BARU */}
              <section className="space-y-6 w-full">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-6 bg-primary-light rounded-full shadow-soft opacity-70" />
                  <h2 className="text-xl font-headline font-black text-main tracking-tight uppercase">
                    Permintaan Baru
                  </h2>
                </div>

                <div className="space-y-4 w-full">
                  {mappedRequests.length > 0 ? (
                    mappedRequests.map((req) => (
                      <ConsultationCard
                        key={req.id_pengajuan}
                        data={req}
                        role="konsultan"
                        onHide={() => {}}
                        onCancel={() => {}}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon="inbox"
                      title="Kotak Masuk Bersih"
                      description="Tidak ada permintaan baru untuk waktu mendatang."
                      className="py-12"
                    />
                  )}
                </div>
              </section>
            </div>
          )}
        </main>

        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}
