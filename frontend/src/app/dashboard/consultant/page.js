"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

// Components
import AppShell from "@/components/layout/AppShell";
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

// Backend (waktu WIB) yang menentukan apakah jadwal sudah lewat; jam perangkat hanya cadangan
// bila field `sudah_lewat` tidak tersedia.
const isRequestPast = (req) =>
  req.sudah_lewat ?? isSchedulePast(req.tanggal_pengajuan, req.jam_mulai);

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

  const { data: nextSession = null, isLoading: isActiveLoading } = useQuery({
    queryKey: ["nextSession"],
    queryFn: () => consultantService.getNextSession(),
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

  // Sesi terdekat dipilih backend (/consultants/me/next-session)
  const closestSession = useMemo(
    () => (nextSession ? transformToCardData(nextSession) : null),
    [nextSession],
  );

  const mappedRequests = useMemo(() => {
    return pendingRequests
      .filter((req) => !isRequestPast(req))
      .map((req) => transformToCardData(req));
  }, [pendingRequests]);

  const isLoadingScreen = isStatsLoading || isActiveLoading || isPendingLoading;

  // --- 3. LOGICA HIDE & SHOW DENGAN LOADING STATE ---
  return (
    <AppShell role="konsultan" contentClassName="min-h-screen">
        <DashboardHeader
          userName={user?.name}
          foto_profil={user?.foto_profil}
          isLoading={!user}
        />

        <main className="w-full max-w-6xl mx-auto px-6 py-5 lg:px-8 lg:py-6 pb-28 lg:pb-10 min-h-[80vh]">
          {isLoadingScreen ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5">
              <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                Memuat Dashboard...
              </p>
            </div>
          ) : (
            <div className="space-y-6 lg:space-y-7 animate-fade-in">
              {/* NOTIFICATION: REJECTION ALERT */}
              {user?.status_verifikasi === "ditolak" && user?.alasan_penolakan && (
                <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex items-start gap-3.5">
                  <MaterialIcon
                    name="error"
                    className="text-danger text-xl shrink-0 mt-0.5"
                  />
                  <div>
                    <h3 className="text-danger font-bold text-sm md:text-base mb-0.5 leading-tight">
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

              {/* KPI SUMMARY GRID: Pendapatan & Statistik */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4 w-full">
                <div className="col-span-2">
                  <IncomeCard
                    amount={formatCurrency(stats?.income)}
                    className="h-full"
                  />
                </div>
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
              <section className="space-y-3.5 w-full">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-5 bg-primary rounded-full shadow-soft" />
                  <h2 className="text-base lg:text-lg font-headline font-bold text-main tracking-tight uppercase">
                    Jadwal Terdekat
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                  {closestSession ? (
                    <ConsultationCard
                      data={closestSession}
                      role="konsultan"
                      onHide={() => {}}
                      onCancel={() => {}}
                    />
                  ) : (
                    <div className="col-span-full">
                      <EmptyState
                        icon="event_busy"
                        title="Jadwal Kosong"
                        description="Tidak ada jadwal mendatang yang tersedia."
                        className="py-10"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* PERMINTAAN BARU */}
              <section className="space-y-3.5 w-full">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1 h-5 bg-primary-light rounded-full shadow-soft opacity-70" />
                  <h2 className="text-base lg:text-lg font-headline font-bold text-main tracking-tight uppercase">
                    Permintaan Baru
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
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
                    <div className="col-span-full">
                      <EmptyState
                        icon="inbox"
                        title="Kotak Masuk Bersih"
                        description="Tidak ada permintaan baru untuk waktu mendatang."
                        className="py-10"
                      />
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
    </AppShell>
  );
}
