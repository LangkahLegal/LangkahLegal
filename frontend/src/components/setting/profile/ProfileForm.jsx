"use client";

import { useState, useRef, useEffect } from "react";
import FileUpload from "@/components/layout/FileUpload";
import LinkedInField from "@/components/setting/profile/LinkedInField";
import { InputField } from "@/components/ui";

export default function ProfileForm({ data, onChange, role }) {
  const isConsultant = role === "konsultan";
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const OPTIONS = ["Umum", "Pidana", "Perdata"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      {/* SEKSI DASAR (Client & Konsultan) */}
      <InputField
        label="Nama Lengkap"
        type="text"
        value={data.name || data.nama_lengkap}
        onChange={(e) => onChange("name", e.target.value)}
      />
      <InputField
        label="Email"
        type="email"
        value={data.email}
        onChange={(e) => onChange("email", e.target.value)}
      />

      {/* SEKSI KHUSUS KONSULTAN */}
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

          {/* CUSTOM ROUNDED DROPDOWN SPESIALISASI */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-[#aca8c1] ml-2">
              Spesialisasi
            </label>
            <div
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full bg-[#1f1d35] border cursor-pointer ${isOpen ? "border-[#6f59fe] ring-2 ring-[#6f59fe]/20" : "border-[#48455a]/50"} rounded-2xl py-4 px-6 flex justify-between items-center transition-all duration-300`}
            >
              <span className="text-[#e8e2fc]">
                {data.spesialisasi || "Umum"}
              </span>
              <span
                className={`material-symbols-outlined text-[#aca8c1] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              >
                expand_more
              </span>
            </div>
            {isOpen && (
              <div className="absolute z-50 w-full mt-2 bg-[#1f1d35] border border-[#48455a]/50 rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-2 space-y-1">
                  {OPTIONS.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        onChange("spesialisasi", opt);
                        setIsOpen(false);
                      }}
                      className={`px-5 py-3 rounded-2xl cursor-pointer transition-all duration-200 flex justify-between items-center ${data.spesialisasi === opt ? "bg-[#6f59fe] text-white" : "text-[#aca8c1] hover:bg-[#6f59fe]/10 hover:text-[#ada3ff]"}`}
                    >
                      <span className="font-medium">{opt}</span>
                      {data.spesialisasi === opt && (
                        <span className="material-symbols-outlined text-sm">
                          check
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Pengalaman Praktik (Tahun)"
              type="number"
              value={data.pengalaman_tahun || ""}
              onChange={(e) => onChange("pengalaman_tahun", e.target.value)}
            />
            <InputField
              label="Tarif Konsultasi (Rp)"
              type="number"
              value={data.tarif_per_sesi || ""}
              onChange={(e) => onChange("tarif_per_sesi", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#aca8c1] ml-2">
              Deskripsi Lengkap
            </label>
            <textarea
              rows={5}
              placeholder="Ceritakan pengalaman profesional Anda..."
              value={data.deskripsi_lengkap || ""}
              onChange={(e) => onChange("deskripsi_lengkap", e.target.value)}
              className="w-full bg-[#1f1d35] border border-[#48455a]/50 rounded-2xl py-4 px-6 text-[#e8e2fc] focus:outline-none focus:border-[#6f59fe] focus:ring-2 focus:ring-[#6f59fe]/20 transition-all duration-300 resize-none"
            />
          </div>

          {/* Menggunakan FileUpload Global */}
          <FileUpload
            label="Unggah Portofolio"
            file={data.porto}
            onChange={(val) => onChange("porto", val)}
            accept=".pdf,.doc,.docx"
            maxSizeMB={5}
            helperText="PDF, DOC (Maks. 5MB)"
          />

          <LinkedInField
            value={data.linkedin}
            onChange={(e) => onChange("linkedin", e.target.value)}
          />
        </>
      )}
    </div>
  );
}
