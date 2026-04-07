"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { consultantService } from "@/services/consultant.service";

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const formatTime = (value) => (value ? value.substring(0, 5) : "-");

const groupSchedules = (items) => {
  return items.reduce((acc, item) => {
    const dateKey = item?.tanggal || "Tidak diketahui";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});
};

export default function ConsultantDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [detailResponse, scheduleResponse] = await Promise.all([
          consultantService.getConsultantDetail(id),
          consultantService.getConsultantSchedules(id),
        ]);

        setDetail(detailResponse || null);
        setSchedules(Array.isArray(scheduleResponse) ? scheduleResponse : []);
      } catch (err) {
        console.error("Gagal memuat detail konsultan:", err);
        setError("Gagal memuat detail konsultan.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id]);

  const scheduleGroups = useMemo(() => groupSchedules(schedules), [schedules]);

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col relative min-h-screen ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Detail Konsultan" />

        <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-8 lg:px-12 space-y-8 pb-32 lg:pb-12">
          {isLoading ? (
            <div className="text-sm text-[#aca8c1]">Memuat detail...</div>
          ) : error ? (
            <div className="text-sm text-red-300">{error}</div>
          ) : detail ? (
            <>
              <section className="glass-card bg-[#1f1d35]/70 border border-white/5 p-6 rounded-3xl flex flex-col lg:flex-row gap-6">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-[#0e0c1e]">
                  <img
                    src={detail?.foto_profil || "/api/placeholder/80/80"}
                    alt={detail?.nama_lengkap || "Konsultan"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-2xl font-headline font-bold text-white">
                    {detail?.nama_lengkap || "Konsultan"}
                  </h2>
                  <p className="text-sm text-[#ada3ff]">
                    {detail?.spesialisasi || "Spesialisasi belum diatur"}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-[#aca8c1]">
                    <span>Kota: {detail?.kota_praktik || "Belum diatur"}</span>
                    <span>
                      Pengalaman: {detail?.pengalaman_tahun ?? 0} tahun
                    </span>
                    <span>
                      Tarif: Rp{" "}
                      {Number(detail?.tarif_per_sesi || 0).toLocaleString(
                        "id-ID",
                      )}
                    </span>
                  </div>
                </div>
              </section>

              <section className="glass-card bg-[#1f1d35]/70 border border-white/5 p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-headline font-bold text-white">
                  Portofolio
                </h3>
                <p className="text-sm text-[#aca8c1]">
                  {detail?.portofolio ||
                    "Belum ada portofolio yang ditambahkan."}
                </p>
              </section>

              <section className="glass-card bg-[#1f1d35]/70 border border-white/5 p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-headline font-bold text-white">
                  Jadwal Tersedia
                </h3>

                {schedules.length === 0 ? (
                  <p className="text-sm text-[#aca8c1]">
                    Belum ada jadwal tersedia.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(scheduleGroups).map(([date, items]) => (
                      <div key={date} className="space-y-2">
                        <div className="text-sm font-semibold text-[#ada3ff]">
                          {formatDate(date)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((item) => (
                            <span
                              key={item.id_jadwal}
                              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[#e8e2fc]"
                            >
                              {formatTime(item.jam_mulai)} -{" "}
                              {formatTime(item.jam_selesai)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="text-sm text-[#aca8c1]">
              Data konsultan tidak ditemukan.
            </div>
          )}
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
