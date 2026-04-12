"use client";

import { useState } from "react";
import { Button, Dropdown } from "@/components/ui";

const TIME_OPTIONS = Array.from({ length: 33 }).map((_, i) => {
  const hr = Math.floor(i / 2) + 6;
  const min = i % 2 === 0 ? "00" : "30";
  return `${hr.toString().padStart(2, "0")}:${min}`;
});

const STATUS_OPTIONS = [
  { value: "available", label: "Tersedia", icon: "schedule" },
  { value: "off", label: "Libur / Tutup", icon: "block" },
];

export default function AddSlotModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    start: "08:00",
    end: "09:00",
    status: "available",
  });

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      time: `${formData.start} - ${formData.end}`,
      status: formData.status,
    });
    
    // Reset form
    setFormData({
      start: "08:00",
      end: "09:00",
      status: "available",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0e0c1e]/80 backdrop-blur-sm px-6">
      <div className="bg-[#1f1d35] rounded-3xl p-6 w-full max-w-sm border border-[#48455a]/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#e8e2fc]">
            Tambah Jadwal Baru
          </h3>
          <button onClick={onClose} className="text-[#aca8c1] hover:text-[#ff6e84] transition-colors cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-5">
          {/* Baris Input Waktu */}
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex-1">
              <Dropdown
                label="Mulai"
                value={formData.start}
                options={TIME_OPTIONS}
                onChange={(val) => handleChange("start", val)}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-center pt-5">
              <span className="text-[#aca8c1] font-bold">−</span>
            </div>

            <div className="flex-1">
              <Dropdown
                label="Selesai"
                value={formData.end}
                options={TIME_OPTIONS}
                onChange={(val) => handleChange("end", val)}
                className="w-full"
              />
            </div>
          </div>

          {/* Input Status */}
          <Dropdown
            label="Status Slot"
            value={formData.status === "available" ? "Tersedia" : "Libur / Tutup"}
            options={STATUS_OPTIONS}
            onChange={(val) => handleChange("status", val)}
            renderItem={(opt) => (
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[18px] ${opt.value === 'available' ? 'text-[#ada3ff]' : 'text-[#ff6e84]'}`}>
                  {opt.icon}
                </span>
                {opt.label}
              </div>
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1"
          >
            Batal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            className="flex-1"
          >
            Tambah
          </Button>
        </div>
      </div>
    </div>
  );
}