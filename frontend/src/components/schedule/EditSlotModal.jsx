"use client";

import { useState, useEffect } from "react";
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

export default function EditSlotModal({ isOpen, onClose, onSave, onDelete, slot }) {
  const [formData, setFormData] = useState({
    start: "09:00",
    end: "10:00",
    status: "available",
  });

  useEffect(() => {
    if (isOpen && slot) {
      const [start, end] = slot.time?.split(" - ") || ["09:00", "10:00"];
      
      setFormData({
        start: start,
        end: end,
        status: slot.status || "available",
      });
    }
  }, [isOpen, slot?.time, slot?.status]); // Gunakan properti spesifik sebagai dependensi

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen || !slot) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0e0c1e]/80 backdrop-blur-sm px-6">
      <div className="bg-[#1f1d35] rounded-3xl p-6 w-full max-w-sm border border-[#48455a]/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#e8e2fc]">Ubah Jadwal</h3>
          <button onClick={onClose} className="text-[#aca8c1] hover:text-[#ff6e84] transition-colors cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-5">
          {/* Group Input Waktu */}
          <div className="flex items-center gap-3">
            <Dropdown
              label="Mulai"
              value={formData.start}
              options={TIME_OPTIONS}
              onChange={(val) => handleChange("start", val)}
            />

            <span className="text-[#aca8c1] mt-5 font-bold">-</span>

            <Dropdown
              label="Selesai"
              value={formData.end}
              options={TIME_OPTIONS}
              onChange={(val) => handleChange("end", val)}
            />
          </div>

          {/* Input Status dengan Icon */}
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

        <div className="flex flex-col gap-3 mt-8">
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1"
            >
              Batal
            </Button>
            
            <Button 
              variant="primary" 
              onClick={() => onSave(`${formData.start} - ${formData.end}`, formData.status)}
              className="flex-1"
            >
              Simpan
            </Button>
          </div>

          <Button 
            variant="danger" 
            onClick={onDelete}
            className="w-full mt-2"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">delete</span>
            Hapus Jadwal Ini
          </Button>
        </div>
      </div>
    </div>
  );
}