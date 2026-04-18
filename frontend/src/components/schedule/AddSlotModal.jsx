"use client";

import { useState, useEffect } from "react";
import { Button, Dropdown } from "@/components/ui";

const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
  const hr = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  return `${hr.toString().padStart(2, "0")}:${min}`;
});

const STATUS_OPTIONS = [
  { value: "available", label: "Tersedia", icon: "schedule" },
  { value: "off", label: "Libur / Tutup", icon: "block" },
];

export default function AddSlotModal({
  isOpen,
  onClose,
  onSave,
  initialStart = "00:00",
  initialEnd = "00:00",
  isNewData = true,
  isBooked = false, // Tambahkan prop ini
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

  const getTextColor = (timeValue) => {
    return isNewData && timeValue === "00:00" ? "text-[#48455a]" : "text-white";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0e0c1e]/80 backdrop-blur-sm px-6">
      <div className="bg-[#1f1d35] rounded-[2.5rem] p-8 w-full max-w-sm border border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-[#e8e2fc]">
              {isBooked
                ? "Detail Jadwal"
                : isNewData
                  ? "Tambah Jadwal"
                  : "Edit Jadwal"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#aca8c1] hover:text-rose-400 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Area: Di-disable jika sudah dibooking */}
        <div
          className={`space-y-6 ${isBooked ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex-1">
              <Dropdown
                label="Mulai"
                value={formData.start}
                options={TIME_OPTIONS}
                onChange={(val) => handleChange("start", val)}
                className={`w-full transition-colors duration-300 ${getTextColor(formData.start)}`}
              />
            </div>

            <div className="flex items-center justify-center pt-5">
              <span className="text-[#48455a] font-bold">−</span>
            </div>

            <div className="flex-1">
              <Dropdown
                label="Selesai"
                value={formData.end}
                options={TIME_OPTIONS}
                onChange={(val) => handleChange("end", val)}
                className={`w-full transition-colors duration-300 ${getTextColor(formData.end)}`}
              />
            </div>
          </div>

          <Dropdown
            label="Status Slot"
            value={
              formData.status === "available" ? "Tersedia" : "Libur / Tutup"
            }
            options={STATUS_OPTIONS}
            onChange={(val) => handleChange("status", val)}
            renderItem={(opt) => (
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-[18px] ${opt.value === "available" ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {opt.icon}
                </span>
                <span className="font-medium">{opt.label}</span>
              </div>
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-10">
          {!isBooked ? (
            <Button
              variant="primary"
              onClick={handleSave}
              className="w-full !py-4 rounded-2xl shadow-[0_10px_20px_rgba(111,89,254,0.2)]"
            >
              {isNewData ? "Tambah" : "Simpan Perubahan"}
            </Button>
          ) : (
            <div className="text-center p-3 bg-white/5 rounded-2xl">
              <p className="text-[11px] text-[#aca8c1] italic">
                Jadwal yang sudah dipesan tidak dapat diubah.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
