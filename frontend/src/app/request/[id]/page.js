"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Layout & UI
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import SuccessView from "@/components/layout/SuccessView";

// Komponen lokal
import ClientCard from "@/components/request/ClientCard";
import InfoGrid from "@/components/request/InfoGrid";
import CaseDescription from "@/components/request/CaseDescription";
import AttachedDocuments from "@/components/documents/AttachedDocuments";
import ActionButtons from "@/components/request/ActionButtons";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";

// Import service
import { consultationService } from "@/services/consultation.service";
import { consultantService } from "@/services/consultant.service";

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isProcessed, setIsProcessed] = useState(false);
  const [actionLabel, setActionLabel] = useState("");

  // State untuk schedule picker (khusus bursa)
  const [selectedJadwal, setSelectedJadwal] = useState(null);
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");

  // --- 1. FETCH DATA DETAIL ---
  const { data: requestData, isLoading } = useQuery({
    queryKey: ["consultationRequest", id],
    queryFn: () => consultationService.getConsultationDetail(id),
    enabled: !!id,
    select: (data) => ({
      clientName: data.nama_klien,
      fotoProfil: data.foto_profil,
      rawDate: data.created_at,
      consultationDate: data.tanggal_konsultasi,
      consultationTime: data.rentang_waktu,
      caseDescription: data.deskripsi_kasus,
      isBursaClaim: !!data.id_bursa && !data.id_jadwal,
      id_bursa: data.id_bursa,
      documents:
        data.berkas_pendukung?.map((doc) => ({
          id: doc.id_dokumen,
          name: doc.nama_dokumen,
          date: "Dokumen Pendukung",
          size: `${(doc.ukuran_kb / 1024).toFixed(2)} MB`,
          type: doc.tipe_file?.includes("pdf") ? "pdf" : "image",
          url: doc.file_url,
        })) || [],
    }),
  });

  // --- 2. FETCH JADWAL KONSULTAN (hanya untuk bursa claims) ---
  const { data: mySchedules = [] } = useQuery({
    queryKey: ["mySchedules"],
    queryFn: () => consultantService.getMySchedules(),
    enabled: !!requestData?.isBursaClaim,
    select: (data) =>
      (data || []).filter((s) => s.status_tersedia),
  });

  // --- 3. MUTATION UNTUK UPDATE STATUS (Normal flow) ---
  const statusMutation = useMutation({
    mutationFn: (newStatus) => consultationService.updateStatus(id, newStatus),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["activeRequests"] });

      setActionLabel(
        newStatus === "menunggu_pembayaran" ? "Diterima" : "Ditolak",
      );
      setIsProcessed(true);
    },
    onError: () => {
      alert("Gagal memproses permintaan.");
    },
  });

  // --- 4. MUTATION UNTUK ASSIGN SCHEDULE (Bursa flow) ---
  const assignMutation = useMutation({
    mutationFn: (payload) =>
      consultationService.assignSchedule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["activeRequests"] });
      setActionLabel("Diterima & Dijadwalkan");
      setIsProcessed(true);
    },
    onError: (err) => {
      alert(err?.response?.data?.detail || "Gagal mengatur jadwal.");
    },
  });

  const handleAction = (action) => {
    if (action === "tolak") {
      statusMutation.mutate("ditolak");
      return;
    }

    // Untuk bursa claims → gunakan assign-schedule
    if (requestData?.isBursaClaim) {
      if (!selectedJadwal || !jamMulai || !jamSelesai) {
        alert("Silakan pilih jadwal dan atur jam terlebih dahulu.");
        return;
      }
      assignMutation.mutate({
        id_jadwal: selectedJadwal.id_jadwal,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
      });
      return;
    }

    // Normal flow
    statusMutation.mutate("menunggu_pembayaran");
  };

  // --- Generate time options dalam 30 menit ---
  const timeOptions = useMemo(() => {
    if (!selectedJadwal) return [];
    const slots = [];
    const [startH, startM] = selectedJadwal.jam_mulai.split(":").map(Number);
    const [endH, endM] = selectedJadwal.jam_selesai.split(":").map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current <= end) {
      const h = String(Math.floor(current / 60)).padStart(2, "0");
      const m = String(current % 60).padStart(2, "0");
      slots.push(`${h}:${m}:00`);
      current += 30;
    }
    return slots;
  }, [selectedJadwal]);

  // --- RENDER SUCCESS VIEW ---
  if (isProcessed) {
    return (
      <SuccessView
        title={`Permintaan Berhasil ${actionLabel}!`}
        description={`Permintaan konsultasi dari ${requestData?.clientName} telah berhasil ${actionLabel.toLowerCase()}. Klien akan segera mendapatkan notifikasi.`}
        onAction={() => router.push("/dashboard/consultant")}
      />
    );
  }

  // --- RENDER LOADING ---
  if (isLoading) return <LoadingSpinner />;

  // --- RENDER NOT FOUND ---
  if (!requestData)
    return (
      <div className="text-main text-center mt-20 font-bold uppercase tracking-widest opacity-40 transition-colors duration-500">
        Data tidak ditemukan.
      </div>
    );

  return (
    <div className="bg-bg text-main min-h-screen flex transition-colors duration-500 font-primary">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col min-w-0 relative lg:ml-64 transition-all duration-300">
        <PageHeader title="Detail Permintaan" />

        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-2xl mx-auto px-6 pt-8 pb-32 space-y-8 animate-fade-in">
            {/* Informasi Klien */}
            <ClientCard
              name={requestData.clientName}
              createdAt={requestData.rawDate}
              avatar={requestData.fotoProfil}
            />

            {/* Bursa Badge */}
            {requestData.isBursaClaim && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                <MaterialIcon
                  name="storefront"
                  className="text-amber-400 text-xl mt-0.5 shrink-0"
                />
                <div>
                  <p className="text-sm font-bold text-amber-400 mb-0.5">
                    Dari Bursa Kasus
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    Kasus ini diklaim dari bursa. Pilih jadwal konsultasi Anda
                    di bawah untuk menerima dan menjadwalkan sesi ini.
                  </p>
                </div>
              </div>
            )}

            {/* Grid Informasi Waktu ATAU Schedule Picker */}
            {requestData.isBursaClaim ? (
              <section className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-primary rounded-full" />
                  <h3 className="text-sm font-bold text-main uppercase tracking-wider">
                    Pilih Jadwal Konsultasi
                  </h3>
                </div>

                {/* Pilih Slot Tanggal */}
                {mySchedules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mySchedules.map((jadwal) => {
                      const isSelected =
                        selectedJadwal?.id_jadwal === jadwal.id_jadwal;
                      return (
                        <button
                          key={jadwal.id_jadwal}
                          onClick={() => {
                            setSelectedJadwal(jadwal);
                            setJamMulai("");
                            setJamSelesai("");
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                            isSelected
                              ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10"
                              : "bg-card border-surface hover:border-muted/20"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isSelected
                                  ? "bg-primary/20 text-primary-light"
                                  : "bg-surface text-muted"
                              }`}
                            >
                              <MaterialIcon
                                name="calendar_today"
                                className="text-lg"
                              />
                            </div>
                            <div>
                              <p
                                className={`text-sm font-bold ${
                                  isSelected
                                    ? "text-primary-light"
                                    : "text-main"
                                }`}
                              >
                                {new Date(
                                  jadwal.tanggal,
                                ).toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="text-xs text-muted">
                                {jadwal.jam_mulai?.substring(0, 5)} -{" "}
                                {jadwal.jam_selesai?.substring(0, 5)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-card border border-dashed border-surface rounded-2xl p-6 text-center">
                    <MaterialIcon
                      name="event_busy"
                      className="text-3xl text-muted/30 mb-2"
                    />
                    <p className="text-sm text-muted">
                      Belum ada slot jadwal tersedia. Tambahkan jadwal di
                      halaman{" "}
                      <span
                        className="text-primary-light cursor-pointer underline"
                        onClick={() => router.push("/schedule")}
                      >
                        Jadwal
                      </span>{" "}
                      terlebih dahulu.
                    </p>
                  </div>
                )}

                {/* Pilih Jam Mulai & Selesai */}
                {selectedJadwal && timeOptions.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Jam Mulai */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">
                        Jam Mulai
                      </label>
                      <select
                        id="jam-mulai-select"
                        value={jamMulai}
                        onChange={(e) => {
                          setJamMulai(e.target.value);
                          setJamSelesai("");
                        }}
                        className="w-full bg-input border border-surface rounded-xl px-4 py-3 text-main text-sm focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all appearance-none"
                      >
                        <option value="">Pilih jam</option>
                        {timeOptions.slice(0, -1).map((t) => (
                          <option key={`start-${t}`} value={t}>
                            {t.substring(0, 5)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Jam Selesai */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase tracking-wider">
                        Jam Selesai
                      </label>
                      <select
                        id="jam-selesai-select"
                        value={jamSelesai}
                        onChange={(e) => setJamSelesai(e.target.value)}
                        disabled={!jamMulai}
                        className="w-full bg-input border border-surface rounded-xl px-4 py-3 text-main text-sm focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all appearance-none disabled:opacity-40"
                      >
                        <option value="">Pilih jam</option>
                        {timeOptions
                          .filter((t) => t > jamMulai)
                          .map((t) => (
                            <option key={`end-${t}`} value={t}>
                              {t.substring(0, 5)}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Preview Jadwal Terpilih */}
                {selectedJadwal && jamMulai && jamSelesai && (
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-3">
                    <MaterialIcon
                      name="event_available"
                      className="text-primary-light text-xl shrink-0"
                    />
                    <p className="text-sm text-main">
                      <strong>
                        {new Date(
                          selectedJadwal.tanggal,
                        ).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </strong>
                      {" • "}
                      {jamMulai.substring(0, 5)} - {jamSelesai.substring(0, 5)}
                    </p>
                  </div>
                )}
              </section>
            ) : (
              <InfoGrid
                date={requestData.consultationDate}
                time={requestData.consultationTime}
              />
            )}

            {/* Deskripsi Kasus */}
            <CaseDescription description={requestData.caseDescription} />

            {/* Dokumen Lampiran */}
            <AttachedDocuments
              title="Dokumen Terlampir"
              titleClassName="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-2"
              documents={requestData.documents}
              showCount={true}
              allowDelete={false}
            />

            {/* Tombol Aksi */}
            {requestData.isBursaClaim ? (
              <div className="flex gap-4 pt-4">
                <Button
                  variant="danger"
                  onClick={() => handleAction("tolak")}
                  fullWidth
                  className="!h-14 !rounded-2xl"
                  isLoading={statusMutation.isPending}
                >
                  <MaterialIcon name="close" className="text-xl" />
                  <span>Tolak</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleAction("terima")}
                  fullWidth
                  disabled={!selectedJadwal || !jamMulai || !jamSelesai}
                  className="!h-14 !rounded-2xl shadow-soft"
                  isLoading={assignMutation.isPending}
                >
                  <MaterialIcon
                    name="event_available"
                    className="text-xl"
                  />
                  <span>Terima & Jadwalkan</span>
                </Button>
              </div>
            ) : (
              <ActionButtons
                onReject={() => handleAction("tolak")}
                onAccept={() => handleAction("terima")}
                isLoading={statusMutation.isPending}
              />
            )}
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}

const LoadingSpinner = () => (
  <div className="bg-bg min-h-screen flex items-center justify-center transition-colors duration-500">
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-5">
      <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
        Memuat Detail Permintaan...
      </p>
    </div>
  </div>
);
