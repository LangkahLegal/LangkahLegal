"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // 1. Import useRouter
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import IncomeCard from "@/components/dashboard/IncomeCard";
import StatCard from "@/components/dashboard/StatCard";
import LiveSessionCard from "@/components/dashboard/LiveSessionCard";
import UpcomingSessionCard from "@/components/dashboard/UpcomingSessionCard";
import RequestCard from "@/components/dashboard/RequestCard";
import { consultantService } from "@/services/consultant.service";
import { userService } from "@/services/user.service";

// --- HELPERS ---
const formatCurrency = (value) => {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `Rp ${safeValue.toLocaleString("id-ID")}`;
};

const formatDateLabel = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
};

const formatTimeRange = (start, end) => {
  const s = start?.substring(0, 5);
  const e = end?.substring(0, 5);
  if (!s || !e) return null;
  return `${s} - ${e}`;
};

const formatFullSchedule = (item) => {
  const date = formatDateLabel(item?.tanggal_pengajuan);
  const time = formatTimeRange(item?.jam_mulai, item?.jam_selesai);
  if (date && time) return `${date} • ${time}`;
  return formatDateLabel(item?.created_at) || "Menunggu jadwal";
};

export default function ConsultantDashboardPage() {
  const router = useRouter(); // 2. Inisialisasi router
  const [user, setUser] = useState({ name: "", foto_profil: "" });
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
      setIsLoading(true);
      try {
        const [userResponse, statsResponse, pendingResponse, activeResponse] =
          await Promise.all([
            userService.getFullProfile(),
            consultantService.getDashboardStats(),
            consultantService.getPendingRequests(),
            consultantService.getActiveRequests(),
          ]);

        setUser({
          name: userResponse?.nama || userResponse?.nama_lengkap || "Konsultan",
          foto_profil: userResponse?.foto_profil || userResponse?.avatar,
        });

        setStats({
          income: statsResponse?.total_income ?? 0,
          activeConsultations: statsResponse?.total_klien_aktif ?? 0,
          totalClients: statsResponse?.total_klien ?? 0,
        });

        setPendingRequests(pendingResponse || []);
        setActiveRequests(activeResponse || []);
      } catch (error) {
        console.error("Gagal memuat dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const liveSession = activeRequests[0];
  const upcomingSession = activeRequests[1];

  const mappedRequests = pendingRequests.map((req) => ({
    id: req.id_pengajuan,
    name: req.users?.nama || "Klien",
    time: formatFullSchedule(req),
  }));

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64 transition-all">
        <DashboardHeader userName={user.name} foto_profil={user.foto_profil} />

        <main className="w-full max-w-[1600px] mx-auto px-6 py-8 space-y-10 pb-32 lg:pb-12">
          <IncomeCard amount={formatCurrency(stats.income)} />

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

          <section className="space-y-6">
            <h2 className="text-xl font-headline font-bold text-white">
              Jadwal Terdekat
            </h2>

            {liveSession ? (
              <LiveSessionCard
                clientName={liveSession.users?.nama}
                caseType={liveSession.deskripsi_kasus}
                time={formatFullSchedule(liveSession)}
                avatar={liveSession.users?.foto_profil}
              />
            ) : (
              <div className="bg-[#1f1d35] border border-white/5 p-6 rounded-3xl text-sm text-[#aca8c1]">
                Belum ada sesi aktif saat ini.
              </div>
            )}

            {upcomingSession && (
              <UpcomingSessionCard
                name={upcomingSession.users?.nama}
                caseType={upcomingSession.deskripsi_kasus}
                time={formatTimeRange(
                  upcomingSession.jam_mulai,
                  upcomingSession.jam_selesai,
                )}
                dateLabel={formatDateLabel(upcomingSession.tanggal_pengajuan)}
              />
            )}
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-headline font-bold text-white">
              Permintaan Baru
            </h2>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-sm text-[#aca8c1] animate-pulse">
                  Memuat permintaan...
                </div>
              ) : mappedRequests.length > 0 ? (
                mappedRequests.map((req) => (
                  // 3. Tambahkan onClick untuk navigasi ke /request/[id]
                  <RequestCard
                    key={req.id}
                    name={req.name}
                    time={req.time}
                    onClick={() => router.push(`/request/${req.id}`)}
                  />
                ))
              ) : (
                <div className="text-sm text-[#aca8c1]">
                  Tidak ada permintaan pending.
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
