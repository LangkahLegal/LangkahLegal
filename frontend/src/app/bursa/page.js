"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";
import { caseService } from "@/services/case.service";

// --- Helper: Format waktu relatif ---
function timeAgo(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
}

// --- Helper: Ikon kategori ---
const KATEGORI_META = {
  pidana: { icon: "gavel", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  perdata: { icon: "handshake", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  bisnis: { icon: "business_center", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

function getKategoriMeta(kategori) {
  return KATEGORI_META[kategori?.toLowerCase()] || {
    icon: "folder", color: "text-muted", bg: "bg-surface", border: "border-surface",
  };
}

export default function BursaKasusPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [claimingId, setClaimingId] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [filterKategori, setFilterKategori] = useState("semua");

  // --- Fetch semua kasus open ---
  const {
    data: cases = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["bursaKasus"],
    queryFn: caseService.listOpenCases,
    refetchInterval: 15000, // Auto-refresh tiap 15 detik
  });

  // --- Mutation klaim ---
  const claimMutation = useMutation({
    mutationFn: (idBursa) => caseService.claimCase(idBursa),
    onSuccess: (data) => {
      setSuccessData(data);
      setClaimingId(null);
      queryClient.invalidateQueries({ queryKey: ["bursaKasus"] });
    },
    onError: (err) => {
      alert(err?.response?.data?.detail || "Gagal mengklaim kasus.");
      setClaimingId(null);
    },
  });

  const handleClaim = (idBursa) => {
    setClaimingId(idBursa);
  };

  const confirmClaim = () => {
    if (!claimingId) return;
    claimMutation.mutate(claimingId);
  };

  // --- Filter logic ---
  const filteredCases =
    filterKategori === "semua"
      ? cases
      : cases.filter(
          (c) => c.kategori_hukum?.toLowerCase() === filterKategori
        );

  const uniqueCategories = [
    "semua",
    ...new Set(cases.map((c) => c.kategori_hukum?.toLowerCase()).filter(Boolean)),
  ];

  // --- SUCCESS VIEW ---
  if (successData) {
    return (
      <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
        <Sidebar role="konsultan" />
        <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64">
          <PageHeader title="Bursa Kasus" backHref="/dashboard/consultant" />
          <main className="flex-1 flex items-center justify-center px-6 py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20 }}
              className="text-center max-w-md space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                <MaterialIcon
                  name="task_alt"
                  className="text-green-400 text-5xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                />
              </div>
              <h2 className="text-2xl font-bold font-headline">
                Kasus Berhasil Diklaim!
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                Konsultasi sudah otomatis terjadwal dengan jadwal yang dipilih
                klien. Anda bisa langsung menghubungi klien saat jadwal tiba.
              </p>
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  onClick={() => router.push("/consultation")}
                  className="!rounded-2xl"
                >
                  <MaterialIcon name="group" className="text-xl" />
                  Lihat Daftar Klien
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setSuccessData(null)}
                  className="!rounded-2xl"
                >
                  <MaterialIcon name="storefront" className="text-xl" />
                  Kembali ke Bursa
                </Button>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64">
        <PageHeader title="Bursa Kasus" backHref="/dashboard/consultant" />

        <main className="w-full max-w-[1200px] mx-auto px-6 py-8 pb-32 lg:pb-12 space-y-8 animate-fade-in">
          {/* Header Info */}
          <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/10 rounded-3xl p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <MaterialIcon
                  name="storefront"
                  className="text-primary-light text-3xl"
                />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold font-headline mb-1">
                  Bursa Kasus Tersedia
                </h2>
                <p className="text-muted text-sm leading-relaxed">
                  Klaim langsung kasus yang sesuai dengan keahlian Anda.
                  Sesi konsultasi akan otomatis terbentuk setelah klaim.
                </p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-6 mt-6 pt-5 border-t border-surface">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-muted">
                  <strong className="text-main">{cases.length}</strong> kasus
                  tersedia
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MaterialIcon
                  name="update"
                  className="text-muted text-base"
                />
                <span className="text-xs text-muted">
                  Auto-refresh setiap 15 detik
                </span>
              </div>
            </div>
          </div>

          {/* Filter Chips */}
          {cases.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterKategori(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 border ${
                    filterKategori === cat
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                      : "bg-card border-surface text-muted hover:border-muted/20 hover:text-main"
                  }`}
                >
                  {cat === "semua" ? "Semua" : cat}
                </button>
              ))}
            </div>
          )}

          {/* LOADING STATE */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-primary-light text-[10px] font-black tracking-[0.2em] uppercase animate-pulse">
                Memuat Bursa Kasus...
              </p>
            </div>
          )}

          {/* ERROR STATE */}
          {isError && (
            <div className="bg-danger/10 border border-danger/20 rounded-2xl p-6 text-center">
              <MaterialIcon
                name="error"
                className="text-danger text-3xl mb-2"
              />
              <p className="text-sm text-danger font-medium">
                Gagal memuat data bursa. Pastikan Anda login sebagai konsultan.
              </p>
            </div>
          )}

          {/* EMPTY STATE */}
          {!isLoading && !isError && filteredCases.length === 0 && (
            <div className="text-sm text-muted py-16 bg-card/30 rounded-[2.5rem] border border-dashed border-surface text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
                <MaterialIcon
                  name="inbox"
                  className="text-4xl text-muted opacity-30"
                />
              </div>
              <span className="max-w-xs font-medium leading-relaxed">
                {filterKategori !== "semua"
                  ? `Tidak ada kasus "${filterKategori}" yang tersedia saat ini.`
                  : "Belum ada kasus tersedia di bursa saat ini. Cek kembali nanti."}
              </span>
            </div>
          )}

          {/* CASE CARDS */}
          {!isLoading && !isError && filteredCases.length > 0 && (
            <div className="grid gap-5">
              <AnimatePresence>
                {filteredCases.map((kasus, idx) => {
                  const meta = getKategoriMeta(kasus.kategori_hukum);
                  return (
                    <motion.div
                      key={kasus.id_bursa}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      className="bg-card border border-surface rounded-[1.75rem] p-6 hover:border-primary/15 transition-all duration-300 group"
                    >
                      {/* Top Row: Kategori + Waktu */}
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${meta.bg} ${meta.border}`}
                        >
                          <MaterialIcon
                            name={meta.icon}
                            className={`text-base ${meta.color}`}
                          />
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}
                          >
                            {kasus.kategori_hukum}
                          </span>
                        </div>
                        <span className="text-xs text-muted flex items-center gap-1.5">
                          <MaterialIcon
                            name="schedule"
                            className="text-sm"
                          />
                          {timeAgo(kasus.created_at)}
                        </span>
                      </div>

                      {/* Deskripsi */}
                      <p className="text-main text-sm leading-relaxed mb-5 line-clamp-4">
                        {kasus.deskripsi_kasus_awam}
                      </p>

                      {/* Jadwal yang diinginkan klien */}
                      {kasus.tanggal_konsultasi && (
                        <div className="flex items-center gap-2 mb-5 px-3 py-2.5 bg-primary/5 border border-primary/10 rounded-xl">
                          <MaterialIcon name="event" className="text-primary-light text-base" />
                          <span className="text-xs text-main font-semibold">
                            {new Date(kasus.tanggal_konsultasi + "T00:00:00").toLocaleDateString("id-ID", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-muted text-xs">•</span>
                          <MaterialIcon name="schedule" className="text-primary-light text-base" />
                          <span className="text-xs text-main font-semibold">
                            {kasus.jam_mulai?.substring(0,5)} - {kasus.jam_selesai?.substring(0,5)}
                          </span>
                        </div>
                      )}

                      {/* Dokumen Link (jika ada) */}
                      {kasus.dokumen_bukti && (
                        <div className="flex items-center gap-2 mb-5 text-xs text-primary-light">
                          <MaterialIcon name="attach_file" className="text-sm" />
                          <a
                            href={kasus.dokumen_bukti}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary transition-colors"
                          >
                            Lihat Dokumen Pendukung
                          </a>
                        </div>
                      )}

                      {/* Footer: ID + Claim Button */}
                      <div className="flex items-center justify-between pt-4 border-t border-surface">
                        <span className="text-xs text-muted font-mono">
                          #BK-{String(kasus.id_bursa).padStart(4, "0")}
                        </span>
                        <Button
                          id={`claim-case-${kasus.id_bursa}`}
                          onClick={() => handleClaim(kasus.id_bursa)}
                          isLoading={
                            claimMutation.isPending &&
                            claimingId === kasus.id_bursa
                          }
                          className="!rounded-xl !px-5 !py-2.5 text-xs"
                        >
                          <MaterialIcon
                            name="front_hand"
                            className="text-base"
                          />
                          Klaim Kasus
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </main>

        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>

      {/* --- CONFIRM DIALOG --- */}
      <AnimatePresence>
        {claimingId && !claimMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center px-6"
            onClick={() => setClaimingId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-card border border-surface rounded-3xl p-8 max-w-sm w-full space-y-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MaterialIcon
                  name="front_hand"
                  className="text-primary-light text-3xl"
                />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold font-headline">
                  Konfirmasi Klaim
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  Setelah diklaim, kasus ini akan menjadi tanggung jawab Anda dan
                  sesi konsultasi akan otomatis dibuat.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setClaimingId(null)}
                  className="!rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  fullWidth
                  onClick={confirmClaim}
                  isLoading={claimMutation.isPending}
                  className="!rounded-xl"
                >
                  Ya, Klaim
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
