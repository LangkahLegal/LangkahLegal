"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

// Import Custom Components
import IncomeCard from "@/components/dashboard/IncomeCard";
import StatCard from "@/components/dashboard/StatCard";
import LiveSessionCard from "@/components/dashboard/LiveSessionCard";
import UpcomingSessionCard from "@/components/dashboard/UpcomingSessionCard";
import RequestCard from "@/components/dashboard/RequestCard";
import { consultantService } from "@/services/consultant.service";
import { userService } from "@/services/user.service";

const formatCurrency = (value) => {
  const parsedValue = Number(value);
  const safeValue = Number.isFinite(parsedValue) ? parsedValue : 0;
  return `Rp ${safeValue.toLocaleString("id-ID")}`;
};

const normalizeSchedule = (request) => {
  const schedule = request?.jadwal_ketersediaan;
  if (Array.isArray(schedule)) return schedule[0];
  return schedule || null;
};

const formatDateLabel = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
};

const formatTimeRange = (schedule) => {
  const start = schedule?.jam_mulai?.substring(0, 5);
  const end = schedule?.jam_selesai?.substring(0, 5);
  if (!start || !end) return null;
  return `${start}-${end}`;
};

const formatRequestTime = (request) => {
  const schedule = normalizeSchedule(request);
  const dateLabel = formatDateLabel(schedule?.tanggal);
  const timeRange = formatTimeRange(schedule);
  if (dateLabel && timeRange) return `${dateLabel} ${timeRange}`;
  const createdLabel = formatDateLabel(request?.created_at);
  return createdLabel || "Menunggu jadwal";
};

export default function ConsultantDashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    income: 0,
    activeConsultations: 0,
    totalClients: 0,
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const [userResponse, statsResponse, pendingResponse, activeResponse] =
          await Promise.all([
            userService.getSettings(),
            consultantService.getDashboardStats(),
            consultantService.getPendingRequests(),
            consultantService.getActiveRequests(),
          ]);

        setUser({
          name: userResponse?.nama,
          avatar: userResponse?.avatar,
        });

        setStats({
          income: statsResponse?.total_income || 0,
          activeConsultations: statsResponse?.total_klien_aktif || 0,
          totalClients: statsResponse?.total_klien || 0,
        });
        setPendingRequests(pendingResponse || []);
        setActiveRequests(activeResponse || []);
      } catch (error) {
        console.error("Gagal memuat dashboard konsultan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const liveSession = activeRequests[0];
  const upcomingSession = activeRequests[1];
  const mappedRequests = pendingRequests.map((request) => ({
    id: request.id_pengajuan,
    name: request.users?.nama || "Klien",
    caseType: request.deskripsi_kasus || "Kasus baru",
    time: formatRequestTime(request),
  }));

  const upcomingSchedule = normalizeSchedule(upcomingSession);
  const upcomingDateLabel =
    formatDateLabel(upcomingSchedule?.tanggal) || "Terjadwal";
  const upcomingTime = formatTimeRange(upcomingSchedule) || "TBA";

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <DashboardHeader
          userName={user?.name || "Konsultan"}
          avatarUrl={user?.avatar || "/api/placeholder/40/40"}
        />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-8 lg:px-12 space-y-10 pb-32 lg:pb-12">
          {/* Income Section */}
          <IncomeCard amount={formatCurrency(stats.income)} />

          {/* Stats Section */}
          <section className="grid grid-cols-2 gap-4 lg:gap-8">
            <StatCard
              label="Konsultasi Aktif"
              val={stats.activeConsultations}
              icon="gavel"
            />
            <StatCard
              label="Total Klien"
              val={stats.totalClients}
              icon="group"
            />
          </section>

          {/* Schedule Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-headline font-bold text-white">
                Jadwal Terdekat
              </h2>
              <button className="text-xs font-bold text-[#ada3ff] hover:underline">
                Lihat semua
              </button>
            </div>

            {liveSession ? (
              <LiveSessionCard
                clientName={liveSession.users?.nama || "Klien"}
                caseType={liveSession.deskripsi_kasus || "Konsultasi"}
                time={formatRequestTime(liveSession)}
                avatar={liveSession.users?.foto_profil}
              />
            ) : (
              <div className="glass-card bg-[#1f1d35] border border-white/5 p-6 rounded-3xl text-sm text-[#aca8c1]">
                Belum ada sesi aktif.
              </div>
            )}

            {upcomingSession && (
              <UpcomingSessionCard
                name={upcomingSession.users?.nama || "Klien"}
                caseType={upcomingSession.deskripsi_kasus || "Konsultasi"}
                time={upcomingTime}
                dateLabel={upcomingDateLabel}
              />
            )}
          </section>

          {/* New Requests Section */}
          <section className="space-y-6">
            <h2 className="text-xl font-headline font-bold text-white">
              Permintaan Baru
            </h2>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-sm text-[#aca8c1]">
                  Memuat permintaan...
                </div>
              ) : mappedRequests.length > 0 ? (
                mappedRequests.map((req) => (
                  <RequestCard key={req.id} {...req} />
                ))
              ) : (
                <div className="text-sm text-[#aca8c1]">
                  Belum ada permintaan baru.
                </div>
              )}
            </div>
          </section>
        </main>

        <div className="lg:hidden">
          <BottomNav
            role="konsultan"
            customItems={
              [
                /* Custom Pro Items */
              ]
            }
          />
        </div>
      </div>
    </div>
  );
}
