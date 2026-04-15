"use client";

import { useRef } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui";

export function FileUpload({
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
          border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer
          ${
            file
              ? "border-primary bg-primary/10"
              : "border-primary/30 bg-input/30 hover:bg-input/50 hover:border-primary/60"
          }
        `}
      >
        {/* Icon Circle */}
        <div
          className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-2xl transition-transform group-hover:scale-110
          ${file ? "bg-primary text-dark" : "bg-primary/20 text-primary"}
        `}
        >
          <MaterialIcon
            name={file ? "check_circle" : "cloud_upload"}
            className="text-3xl"
          />
        </div>

        {/* Text Content */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-main mb-1">
            {file ? "Berkas Terpilih" : "Unggah Berkas Baru"}
          </h3>

          {file ? (
            <p className="text-primary-light text-xs mb-6 font-medium animate-fade-in">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          ) : (
            <p className="text-muted text-xs mb-6">
              PDF, DOCX, JPG, PNG (Maks. {maxSizeMB}MB)
            </p>
          )}
        </div>

        {/* Action Button */}
        <Button
          type="button"
          variant={file ? "ghost" : "secondary"}
          className={`px-8 py-2.5 rounded-xl text-sm! ${
            !file ? "bg-primary/20 text-primary-light hover:bg-primary/40" : ""
          }`}
        >
          {file ? "Ganti File" : "Pilih File"}
        </Button>

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