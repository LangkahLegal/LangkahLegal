"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import PageHeader from "@/components/layout/PageHeader";
import { Button, FileUpload } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";
import { caseService } from "@/services/case.service";
import BursaSchedulePicker from "@/components/bursa/BursaSchedulePicker";
import AttachedDocuments from "@/components/documents/AttachedDocuments";

const KATEGORI_OPTIONS = [
  {
    value: "pidana",
    label: "Pidana",
    icon: "gavel",
    desc: "Kasus pelanggaran hukum & tindak kejahatan",
  },
  {
    value: "perdata",
    label: "Perdata",
    icon: "handshake",
    desc: "Sengketa antar pihak, kontrak, warisan",
  },
  {
    value: "bisnis",
    label: "Bisnis",
    icon: "business_center",
    desc: "Permasalahan hukum perusahaan & komersial",
  },
];

export default function PostCasePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [kategori, setKategori] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [dokumen, setDokumen] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const [files, setFiles] = useState([]);

  const displayFiles = useMemo(() => {
    return files.map((file, index) => ({
      id: index,
      name: file?.name || "Untitled",
      size: ((file?.size || 0) / 1024 / 1024).toFixed(2) + " MB",
      type: file?.type?.includes("pdf") ? "pdf" : "image",
      url: file ? URL.createObjectURL(file) : "",
    }));
  }, [files]);

  const handleFileChange = (newFile) => {
    if (files.length >= 10) return alert("Maksimal 10 file");
    setFiles((prev) => [...prev, newFile]);
  };

  const handleRemoveFile = (id) => {
    setFiles((prev) => prev.filter((_, i) => i !== id));
  };

  const postMutation = useMutation({
    mutationFn: ({ payload, files }) => caseService.createCase(payload, files),
    onSuccess: () => setStep(3),
    onError: (err) => {
      alert(err?.response?.data?.detail || "Gagal memposting kasus.");
    },
  });

  const handleSubmit = () => {
    if (!deskripsi.trim() || !tanggal || !jamMulai || !jamSelesai) return;
    postMutation.mutate({
      payload: {
        kategori_hukum: kategori,
        deskripsi_kasus_awam: deskripsi.trim(),
        dokumen_bukti: dokumen.trim() || null,
        tanggal_konsultasi: tanggal,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
      },
      files,
    });
  };

  // --- STEP 3: SUCCESS ---
  if (step === 3) {
    return (
      <div className="bg-bg text-main min-h-screen flex flex-col lg:flex-row overflow-x-hidden transition-colors duration-500">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64">
          <PageHeader title="Posting Kasus" backHref="/dashboard/client" />
          <main className="flex-1 flex items-center justify-center px-6 py-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20 }}
              className="text-center max-w-md space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                <MaterialIcon
                  name="check_circle"
                  className="text-green-400 text-5xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                />
              </div>
              <h2 className="text-2xl font-bold font-headline">
                Kasus Berhasil Diposting!
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                Kasus Anda kini tersedia di bursa. Konsultan akan segera
                mengklaim dan menghubungi Anda.
              </p>
              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={() => router.push("/dashboard/client")}>
                  <MaterialIcon name="home" className="text-xl" />
                  Kembali ke Dashboard
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep(1);
                    setKategori("");
                    setDeskripsi("");
                    setDokumen("");
                    setTanggal("");
                    setJamMulai("");
                    setJamSelesai("");
                    setFiles([]);
                  }}
                >
                  <MaterialIcon name="add_circle" className="text-xl" />
                  Posting Kasus Lain
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
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-0 lg:ml-64">
        <PageHeader title="Posting Kasus" backHref="/dashboard/client" />

        <main className="w-full max-w-[800px] mx-auto px-6 py-8 pb-32 lg:pb-12 space-y-8 animate-fade-in">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step >= s
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "bg-surface text-muted"
                  }`}
                >
                  {step > s ? (
                    <MaterialIcon name="check" className="text-lg" />
                  ) : (
                    s
                  )}
                </div>
                {s < 2 && (
                  <div
                    className={`w-16 h-0.5 rounded-full transition-all duration-500 ${
                      step > s ? "bg-primary" : "bg-surface"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* --- STEP 1: Pilih Kategori --- */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold font-headline">
                    Pilih Kategori Hukum
                  </h2>
                  <p className="text-muted text-sm">
                    Pilih kategori yang paling sesuai dengan permasalahan Anda.
                  </p>
                </div>

                <div className="grid gap-4">
                  {KATEGORI_OPTIONS.map((opt) => {
                    const selected = kategori === opt.value;
                    return (
                      <button
                        key={opt.value}
                        id={`category-${opt.value}`}
                        onClick={() => setKategori(opt.value)}
                        className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 group ${
                          selected
                            ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10"
                            : "bg-card border-surface hover:border-muted/20 hover:bg-surface/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              selected
                                ? "bg-primary/20 text-primary-light"
                                : "bg-surface text-muted group-hover:text-main"
                            }`}
                          >
                            <MaterialIcon
                              name={opt.icon}
                              className="text-2xl"
                            />
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`font-bold text-base ${
                                selected ? "text-primary-light" : "text-main"
                              }`}
                            >
                              {opt.label}
                            </h3>
                            <p className="text-muted text-xs mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              selected
                                ? "border-primary bg-primary"
                                : "border-muted/30"
                            }`}
                          >
                            {selected && (
                              <MaterialIcon
                                name="check"
                                className="text-white text-sm"
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  id="next-step-btn"
                  fullWidth
                  disabled={!kategori}
                  onClick={() => setStep(2)}
                  className="!rounded-2xl !py-4"
                >
                  Lanjutkan
                  <MaterialIcon name="arrow_forward" className="text-xl" />
                </Button>
              </motion.div>
            )}

            {/* --- STEP 2: Deskripsi Kasus --- */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-bold font-headline">
                    Deskripsikan Kasus Anda
                  </h2>
                  <p className="text-muted text-sm">
                    Jelaskan kronologi dan permasalahan Anda dengan bahasa
                    sehari-hari. Identitas Anda akan dirahasiakan.
                  </p>
                </div>

                {/* Kategori Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Kategori:</span>
                  <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary-light text-xs font-bold rounded-full capitalize">
                    {kategori}
                  </span>
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-main">
                    Deskripsi Kasus{" "}
                    <span className="text-danger text-xs">*</span>
                  </label>
                  <textarea
                    id="case-description"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Contoh: Saya ditipu oleh rekan bisnis yang tidak memenuhi kontrak kerjasama..."
                    rows={6}
                    className="w-full bg-input border border-surface rounded-2xl px-5 py-4 text-main text-sm placeholder:text-muted/50 resize-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <p className="text-xs text-muted">
                    {deskripsi.length} / 2000 karakter
                  </p>
                </div>

                {/* Dokumen Pendukung (File Upload) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-primary rounded-full" />
                    <h3 className="text-sm font-bold text-main uppercase tracking-wider">
                      Dokumen Pendukung
                    </h3>
                    <span className="text-muted text-xs">(Opsional)</span>
                  </div>

                  {/* Link Google Drive */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-main">
                      Link Dokumen{" "}
                      <span className="text-muted text-xs">(Google Drive, dll)</span>
                    </label>
                    <input
                      id="case-document"
                      type="text"
                      value={dokumen}
                      onChange={(e) => setDokumen(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-input border border-surface rounded-xl px-5 py-3.5 text-main text-sm placeholder:text-muted/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>

                  {/* File Upload */}
                  <AttachedDocuments
                    title="Berkas Terunggah"
                    documents={displayFiles}
                    showCount={true}
                    allowDelete={true}
                    onDelete={handleRemoveFile}
                  />
                  <FileUpload
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSizeMB={10}
                  />
                </div>

                {/* Jadwal Konsultasi — BursaSchedulePicker */}
                <BursaSchedulePicker
                  selectedDate={tanggal}
                  onDateSelect={setTanggal}
                  startTime={jamMulai}
                  onStartTimeChange={setJamMulai}
                  endTime={jamSelesai}
                  onEndTimeChange={setJamSelesai}
                />

                {/* Info Card */}
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3">
                  <MaterialIcon
                    name="shield"
                    className="text-primary-light text-xl mt-0.5 shrink-0"
                  />
                  <p className="text-xs text-muted leading-relaxed">
                    Kasus Anda akan diposting{" "}
                    <strong className="text-main">secara anonim</strong>. Konsultan hanya akan
                    melihat kategori, deskripsi, dan jadwal — bukan identitas Anda.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="!rounded-2xl !py-4"
                  >
                    <MaterialIcon name="arrow_back" className="text-xl" />
                    Kembali
                  </Button>
                  <Button
                    id="submit-case-btn"
                    fullWidth
                    disabled={!deskripsi.trim() || !tanggal || !jamMulai || !jamSelesai}
                    isLoading={postMutation.isPending}
                    onClick={handleSubmit}
                    className="!rounded-2xl !py-4"
                  >
                    <MaterialIcon name="send" className="text-xl" />
                    Posting Kasus
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
