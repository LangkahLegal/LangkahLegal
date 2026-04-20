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

/**
 * Helper untuk mengecek apakah jadwal sudah terlewat berdasarkan WIB
 * API Date: 2026-04-22T00:00:00
 * API Time: 01:30:00
 */
const isSchedulePast = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return true;

  // Ambil bagian YYYY-MM-DD dari string ISO
  const datePart = dateStr.split("T")[0];
  // Gabungkan dengan jam dari API
  const scheduleDateTime = new Date(`${datePart}T${timeStr}`);

  // Waktu sekarang
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

  // Filter dan ambil jadwal terdekat yang BELUM terlewat
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

  // Filter permintaan baru yang BELUM terlewat
  const mappedRequests = useMemo(() => {
    return pendingRequests
      .filter((req) => !isSchedulePast(req.tanggal_pengajuan, req.jam_mulai))
      .map((req) => transformToCardData(req));
  }, [pendingRequests]);

  // --- 3. LOADING GATE ---
  const isInitialLoading = isStatsLoading || isActiveLoading;

  if (isInitialLoading) {
    return (
      <div className="bg-[#0e0c1e] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#6f59fe]"></div>
          <p className="text-[#ada3ff] text-[10px] font-bold tracking-widest uppercase animate-pulse text-center">
            Synchronizing Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64 transition-all">
        <DashboardHeader
          userName={user?.name}
          foto_profil={user?.foto_profil}
        />

        <main className="w-full max-w-[1600px] mx-auto px-6 py-8 space-y-10 pb-32 lg:pb-12">
          <IncomeCard amount={formatCurrency(stats?.income)} />

          <section className="grid grid-cols-2 gap-4 lg:gap-8 w-full">
            <StatCard
              label="Konsultasi Aktif"
              val={stats?.activeConsultations || 0}
              icon="gavel"
            />
            <StatCard
              label="Total Klien"
              val={stats?.totalClients || 0}
              icon="group"
            />
          </section>

          {/* JADWAL TERDEKAT */}
          <section className="space-y-6 w-full">
            <h2 className="text-xl font-headline font-bold text-white px-1">
              Jadwal Terdekat
            </h2>
            <div className="w-full">
              {closestSession ? (
                <ConsultationCard
                  data={closestSession}
                  role="konsultan"
                  onHide={() => {}}
                  onCancel={() => {}}
                />
              ) : (
                <div className="bg-[#1f1d35]/50 border border-white/5 p-8 rounded-[1.5rem] sm:rounded-[2rem] text-sm text-[#aca8c1] italic flex items-center gap-3">
                  <MaterialIcon
                    name="event_busy"
                    className="text-xl opacity-40"
                  />
                  <span>Tidak ada jadwal mendatang yang tersedia.</span>
                </div>
              )}
            </div>
          </section>

          {/* PERMINTAAN BARU */}
          <section className="space-y-6 w-full">
            <h2 className="text-xl font-headline font-bold text-white px-1">
              Permintaan Baru
            </h2>
            <div className="space-y-4 w-full">
              {isPendingLoading ? (
                <div className="text-sm text-[#aca8c1] animate-pulse italic">
                  Memperbarui...
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
                <div className="text-sm text-[#aca8c1] py-8 bg-[#1f1d35]/30 rounded-[2rem] border border-dashed border-white/5 text-center flex flex-col items-center gap-2">
                  <MaterialIcon
                    name="mail_outline"
                    className="text-3xl opacity-20"
                  />
                  <span>
                    Tidak ada permintaan baru yang valid untuk waktu mendatang.
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
