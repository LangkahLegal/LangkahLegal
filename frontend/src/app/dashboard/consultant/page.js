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

// Services
import { consultantService } from "@/services/consultant.service";
import { userService } from "@/services/user.service";

// --- HELPERS ---
const formatCurrency = (value) => {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `Rp ${safeValue.toLocaleString("id-ID")}`;
};

const isSchedulePast = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return true;
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

  // --- 3. LOADING GATE (Theme Aware) ---
  if (isStatsLoading || isActiveLoading) {
    return (
      <div className="bg-bg min-h-screen flex items-center justify-center transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          <p className="text-primary-light text-[10px] font-black tracking-[0.2em] uppercase animate-pulse text-center">
            Synchronizing Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64 transition-all">
        <DashboardHeader
          userName={user?.name}
          foto_profil={user?.foto_profil}
        />

        <main className="w-full max-w-[1600px] mx-auto px-6 py-8 space-y-10 pb-32 lg:pb-12 animate-fade-in">
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
                <div className="bg-card border border-surface p-8 rounded-[2rem] text-sm text-muted italic flex items-center gap-4 shadow-soft">
                  <MaterialIcon
                    name="event_busy"
                    className="text-2xl text-primary opacity-40"
                  />
                  <span className="font-medium">
                    Tidak ada jadwal mendatang yang tersedia.
                  </span>
                </div>
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
              {isPendingLoading ? (
                <div className="text-sm text-muted animate-pulse italic px-2">
                  Memperbarui permintaan...
                </div>
              ) : mappedRequests.length > 0 ? (
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
                <div className="text-sm text-muted py-12 bg-card/30 rounded-[2.5rem] border border-dashed border-surface text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-1">
                    <MaterialIcon
                      name="mail_outline"
                      className="text-3xl text-muted opacity-30"
                    />
                  </div>
                  <span className="max-w-xs font-medium">
                    Kotak masuk bersih. Tidak ada permintaan baru yang valid
                    untuk waktu mendatang.
                  </span>
                </div>
              )}
            </div>
          </section>
        </main>

        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}
