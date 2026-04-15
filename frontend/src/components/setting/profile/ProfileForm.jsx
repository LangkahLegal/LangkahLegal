"use client";

import LinkedInField from "@/components/setting/profile/LinkedInField";
import { InputField, Dropdown, FileUpload } from "@/components/ui";
import FileItem from "@/components/ui/FileItem";

export default function ProfileForm({ data, onChange, role, portofolioFile }) {
  const isConsultant = role === "konsultan";

  const SPESIALISASI_OPTIONS = ["Umum", "Pidana", "Perdata"];

  // Fungsi pembantu untuk memproses nama file dari URL
  const getFileNameFromUrl = (url) => {
    if (!url) return "";
    return url.split("/").pop().split("?")[0];
  };

  // FUNGSI UNTUK MELIHAT DOKUMEN
  const handleViewFile = () => {
    if (portofolioFile) {
      // Jika file baru dipilih (Object File), buat URL sementara
      const localUrl = URL.createObjectURL(portofolioFile);
      window.open(localUrl, "_blank");
    } else if (data.portofolio) {
      // Jika file sudah ada di server (URL String)
      window.open(data.portofolio, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* DASAR (Client & Konsultan) */}
      <InputField
        label="Nama Lengkap"
        type="text"
        placeholder="John Doe"
        value={data.name || data.nama_lengkap}
        onChange={(e) => onChange("name", e.target.value)}
      />
      <InputField
        label="Email"
        type="email"
        placeholder="example@langkahlegal.id"
        value={data.email}
        onChange={(e) => onChange("email", e.target.value)}
      />

      {/* KHUSUS KONSULTAN */}
      {isConsultant && (
        <>
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-[#ada3ff] text-xs font-bold tracking-widest uppercase mb-6">
              Kredensial Profesional
            </h3>
          </div>

          <InputField
            label="Bio Singkat"
            placeholder="Contoh: Pengacara spesialis hukum perdata dengan fokus sengketa tanah."
            type="text"
            value={data.bio_singkat || ""}
            onChange={(e) => onChange("bio_singkat", e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Gelar Akademik"
              placeholder="Contoh: S.H., M.H."
              type="text"
              value={data.gelar_akademik || ""}
              onChange={(e) => onChange("gelar_akademik", e.target.value)}
            />
            <InputField
              label="Pendidikan Terakhir"
              placeholder="Contoh: Sarjana"
              type="text"
              value={data.pendidikan_terakhir || ""}
              onChange={(e) => onChange("pendidikan_terakhir", e.target.value)}
            />
          </div>

          <InputField
            label="Kota Praktik"
            type="text"
            value={data.kota_praktik || ""}
            onChange={(e) => onChange("kota_praktik", e.target.value)}
          />

          <InputField
            label="Nomor Izin Praktik"
            placeholder="Masukkan nomor lisensi resmi Anda"
            type="text"
            value={data.nomor_izin_praktik || ""}
            onChange={(e) => onChange("nomor_izin_praktik", e.target.value)}
          />

          <Dropdown
            label="Spesialisasi"
            value={data.spesialisasi || "Umum"}
            options={SPESIALISASI_OPTIONS}
            onChange={(val) => onChange("spesialisasi", val)}
            className="w-full"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Pengalaman Praktik (Tahun)"
              type="number"
              placeholder="Contoh: 5"
              value={data.pengalaman_tahun || ""}
              onChange={(e) => onChange("pengalaman_tahun", e.target.value)}
            />
            <InputField
              label="Tarif Konsultasi (Rp)"
              type="number"
              step={50000}
              min={0}
              placeholder="Rp 150.000"
              value={data.tarif_per_sesi || ""}
              onChange={(e) => onChange("tarif_per_sesi", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="form-label">Deskripsi Lengkap</label>
            <textarea
              rows={5}
              placeholder="Ceritakan pengalaman profesional Anda..."
              value={data.deskripsi_lengkap || ""}
              onChange={(e) => onChange("deskripsi_lengkap", e.target.value)}
              className="w-full bg-[#1f1d35] border border-[#48455a]/50 rounded-2xl py-4 px-6 text-[#e8e2fc] focus:outline-none focus:border-[#6f59fe] focus:ring-2 focus:ring-[#6f59fe]/20 transition-all duration-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <label className="form-label">Portofolio</label>

            {/* Menampilkan FileItem jika ada file baru atau file yang sudah terupload */}
            {(portofolioFile || data.portofolio) && (
              <FileItem
                onClick={handleViewFile}
                onDelete={() => {
                  // Hapus file baru (jika ada) dan set portofolio ke "" untuk hapus di DB
                  onChange("portofolio_file", null);
                  onChange("portofolio", "");
                }}
                file={
                  portofolioFile
                    ? {
                        name: portofolioFile.name,
                        type: "pdf",
                        date: "Baru dipilih",
                        size:
                          (portofolioFile.size / 1024 / 1024).toFixed(2) +
                          " MB",
                      }
                    : {
                        name: getFileNameFromUrl(data.portofolio),
                        type: "pdf",
                        date: "Sudah terupload",
                        size: "PDF Dokumen",
                      }
                }
              />
            )}

            <FileUpload
              label="Ganti Portofolio"
              file={portofolioFile}
              onChange={(val) => onChange("portofolio_file", val)}
              accept=".pdf"
              maxSizeMB={5}
              helperText="PDF (Maks. 5MB)"
            />
          </div>

          <LinkedInField
            value={data.linkedin}
            placeholder="https://www.linkedin.com/in/nama-anda"
            onChange={(e) => onChange("linkedin", e.target.value)}
          />
        </>
      )}
    </div>
  );
}
