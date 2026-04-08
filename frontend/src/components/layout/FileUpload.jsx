"use client";

import { useRef } from "react";
import { MaterialIcon } from "@/components/ui/Icons";

export default function FileUpload({
  file,
  onChange,
  accept = ".pdf,.doc,.docx,.jpg,.png",
  maxSizeMB = 10,
}) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndProcess(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndProcess(dropped);
  };

  const validateAndProcess = (selectedFile) => {
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      alert(`File terlalu besar! Maksimal ${maxSizeMB}MB`);
      return;
    }
    onChange(selectedFile);
  };

  return (
    <section
      className="relative group"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center transition-all cursor-pointer
          ${
            file
              ? "border-[#6f59fe] bg-[#6f59fe]/10"
              : "border-[#6f59fe]/30 bg-[#1f1d35]/30 hover:bg-[#1f1d35]/50 hover:border-[#6f59fe]/60"
          }
        `}
      >
        {/* Icon Circle */}
        <div
          className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-2xl transition-transform group-hover:scale-110
          ${file ? "bg-[#6f59fe] text-white" : "bg-[#6f59fe]/20 text-[#6f59fe]"}
        `}
        >
          <MaterialIcon
            name={file ? "check_circle" : "cloud_upload"}
            className="text-3xl"
          />
        </div>

        {/* Text Content */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-white mb-1">
            {file ? "Berkas Terpilih" : "Unggah Berkas Baru"}
          </h3>

          {file ? (
            <p className="text-[#ada3ff] text-xs mb-6 font-medium animate-in fade-in">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          ) : (
            <p className="text-[#aca8c1] text-xs mb-6">
              PDF, DOCX, JPG, PNG (Maks. {maxSizeMB}MB)
            </p>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          className={`
            px-8 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-xl
            ${
              file
                ? "bg-white/10 text-[#ada3ff] hover:bg-white/20"
                : "bg-[#6f59fe] text-white hover:shadow-[0_0_20px_rgba(111,89,254,0.4)]"
            }
          `}
        >
          {file ? "Ganti File" : "Pilih File"}
        </button>

        {/* Hidden Input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </section>
  );
}
