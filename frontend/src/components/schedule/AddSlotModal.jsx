"use client";

import { useState, useEffect } from "react";
import { Button, Dropdown } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";

const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
  const hr = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  return `${hr.toString().padStart(2, "0")}:${min}`;
});

const STATUS_OPTIONS = [
  { value: "available", label: "Tersedia", icon: "schedule" },
  { value: "off", label: "Libur / Tutup", icon: "block" },
];
const scrollbarStyles = `
  [&::-webkit-scrollbar]:w-1.5
  [&::-webkit-scrollbar-track]:bg-transparent
  [&::-webkit-scrollbar-thumb]:bg-muted/20
  [&::-webkit-scrollbar-thumb]:rounded-full
  hover:[&::-webkit-scrollbar-thumb]:bg-primary/50
`;

export default function AddSlotModal({
  isOpen,
  onClose,
  onSave,
  initialStart = "00:00",
  initialEnd = "00:00",
  isNewData = true,
  isBooked = false,
}) {
  const [formData, setFormData] = useState({
    start: initialStart,
    end: initialEnd,
    status: "available",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        start: initialStart,
        end: initialEnd,
        status: "available",
      });
    }
  }, [isOpen, initialStart, initialEnd]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      time: `${formData.start} - ${formData.end}`,
      status: formData.status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 backdrop-blur-md px-6 animate-in fade-in duration-300">
      <div className="bg-card rounded-[2.5rem] p-8 w-full max-w-sm border border-surface shadow-soft animate-in zoom-in-95 duration-300 flex flex-col max-h-[90dvh]">
        {/* Header - Tetap di atas (shrink-0 agar tidak mengecil) */}
        <div className="flex justify-between items-center mb-8 shrink-0">
          <h3 className="text-xl font-headline font-extrabold text-main tracking-tight">
            {isBooked
              ? "Detail Jadwal"
              : isNewData
                ? "Tambah Jadwal"
                : "Edit Jadwal"}
          </h3>
          <Button
            variant="icon"
            onClick={onClose}
            className="text-muted hover:text-danger hover:bg-danger/10"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </Button>
        </div>

        {/* Content Area */}
        <div
          className={`
            flex-1 space-y-6 overflow-y-auto pr-2 
            ${scrollbarStyles} 
            ${isBooked ? "opacity-60 pointer-events-none" : ""}
            /* 1. Tambahkan Padding Bottom yang besar (pb-10) agar list dropdown punya ruang di dalam scroll */
            /* 2. Beri z-index pada container ini agar di atas footer */
            pb-48 relative z-[20]
          `}
        >
          {/* Row 1: Time Picker */}
          <div className="flex items-center justify-between w-full gap-3 relative z-[40]">
            <div className="flex-1">
              <Dropdown
                label="Mulai"
                value={formData.start}
                options={TIME_OPTIONS}
                onChange={(val) => handleChange("start", val)}
              />
            </div>

            <div className="pt-6">
              <span className="text-muted/20 font-black">−</span>
            </div>

            <div className="flex-1">
              <Dropdown
                label="Selesai"
                value={formData.end}
                options={TIME_OPTIONS}
                onChange={(val) => handleChange("end", val)}
              />
            </div>
          </div>

          {/* Row 2: Status Picker */}
          <div className="relative z-[30]">
            <Dropdown
              label="Status Slot"
              value={
                formData.status === "available" ? "Tersedia" : "Libur / Tutup"
              }
              options={STATUS_OPTIONS}
              onChange={(val) => handleChange("status", val)}
              renderItem={(opt) => (
                <div className="flex items-center gap-3">
                  <MaterialIcon
                    name={opt.icon}
                    className={`text-[20px] ${opt.value === "available" ? "text-emerald-500" : "text-danger"}`}
                  />
                  <span className="font-bold text-sm tracking-wide text-main">
                    {opt.label}
                  </span>
                </div>
              )}
            />
          </div>
        </div>

        {/* Footer - Paksa z-index lebih rendah agar tidak menimpa dropdown yang melayang */}
        <div className="mt-6 shrink-0 relative z-[10]">
          {!isBooked ? (
            <Button
              variant="primary"
              fullWidth
              onClick={handleSave}
              className="py-4 shadow-soft"
            >
              {isNewData ? "Tambah Slot" : "Simpan Perubahan"}
            </Button>
          ) : (
            <div className="text-center p-4 bg-surface rounded-2xl border border-surface">
              <p className="text-[12px] text-muted font-medium italic leading-relaxed">
                Jadwal yang sudah dipesan tidak dapat diubah kembali.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}