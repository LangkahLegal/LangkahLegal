"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import ConsultantCard from "@/components/verification/VerificationCard";
import { MaterialIcon } from "@/components/ui/Icons";
import TransactionMonitoring from "@/components/dashboard/TransactionMonitoring";
import { userService } from "@/services/user.service";
import { getAdminStats, getConsultants } from "@/services/admin.service";

export default function AdminDashboardPage() {
  const router = useRouter();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => userService.getFullProfile(),
    select: (data) => ({
      name: data?.nama || data?.nama_lengkap || "Admin",
      foto_profil: data?.foto_profil || data?.avatar,
    }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getAdminStats(),
  });

  const { data: consultantsData, isLoading: isConsultantsLoading } = useQuery({
    queryKey: ["consultants", "all"],
    queryFn: () => getConsultants(),
  });

  const stats = statsData || {};

  const latestPending = (consultantsData?.data || [])
    .filter((c) => c.status_verifikasi === "pending")
    .slice(0, 1);

  return (
    <div className="bg-bg text-main min-h-screen flex transition-colors duration-500">
      <Sidebar role="admin" />

      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64 transition-all overflow-x-hidden">
        <DashboardHeader
          userName={isUserLoading ? "Loading..." : user?.name || "Admin"}
          foto_profil={user?.foto_profil}
        />

        <main className="relative z-10 w-full px-4 py-6 md:px-8 lg:px-12 lg:py-12 pb-32 lg:pb-12">
          <div className="w-full max-w-full lg:max-w-[1600px] space-y-8 lg:space-y-12">

            {/* 1. OVERVIEW STATS */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total User" val={stats.total_users || 0} icon="group" />
              <StatCard label="Total Client" val={stats.total_clients || 0} icon="person" />
              <StatCard label="Total Konsultan" val={stats.total_consultants || 0} icon="work" />
              <StatCard label="Pending Verifikasi" val={stats.pending_verification || 0} icon="hourglass_top" />
            </section>

            {/* 2. PENGAJUAN VERIFIKASI */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-main">Pengajuan Verifikasi Terbaru</h2>

              {isConsultantsLoading ? (
                <p className="text-sm text-muted animate-pulse">Memuat data...</p>
              ) : latestPending.length > 0 ? (
                latestPending.map((item) => (
                  <ConsultantCard
                    key={item.id_konsultan}
                    item={{
                      id: item.id_konsultan,
                      nama_lengkap: item.nama_lengkap,
                      spesialisasi: item.spesialisasi,
                      kota_praktik: item.kota_praktik,
                      pengalaman_tahun: item.pengalaman_tahun,
                      tarif_per_sesi: item.tarif_per_sesi,
                      status: item.status_verifikasi,
                      waktu_submit: {
                        date: new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit", month: "short", year: "numeric",
                        }),
                        time: new Date(item.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit", minute: "2-digit",
                        }),
                      },
                      foto_profil: item.foto_profil || item.users?.foto_profil,
                    }}
                    onDetail={(item) => router.push(`/verification/${item.id}`)}
                  />
                ))
              ) : (
                <div className="text-sm text-muted py-10 bg-card/30 rounded-[1.5rem] border border-dashed border-surface text-center flex flex-col items-center gap-3">
                  <MaterialIcon name="verified" className="text-4xl opacity-20" />
                  <span>Tidak ada pengajuan verifikasi yang tertunda.</span>
                </div>
              )}
            </section>

            {/* 3. RINGKASAN KEUANGAN */}
            <TransactionMonitoring stats={stats} />

          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="admin" />
        </div>
      </div>
    </div>
  );
}