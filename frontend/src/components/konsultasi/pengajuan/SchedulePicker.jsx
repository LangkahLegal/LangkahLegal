"use client";

import { useState, useRef, useEffect } from "react";
import { MaterialIcon } from "@/components/ui/Icons";

/**
 * Senior Insight:
 * Memisahkan logika generate waktu ke luar komponen agar tidak
 * di-recompute setiap kali render.
 */
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min of ["00", "30"]) {
      const h = hour.toString().padStart(2, "0");
      slots.push(`${h}:${min}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function SchedulePicker({ dates, selectedDate, onDateSelect }) {
  const [startTime, setStartTime] = useState("11:30");
  const [endTime, setEndTime] = useState("12:00");
  const [activeDropdown, setActiveDropdown] = useState(null); // 'start', 'end', atau null

  // Ref untuk mendeteksi klik di luar dropdown (Close on click outside)
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="space-y-6 w-full" ref={containerRef}>
      {/* 1. Header Section */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-[#6f59fe] rounded-full shadow-[0_0_10px_rgba(111,89,254,0.5)]" />
          <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
            Jadwal Tersedia
          </h2>
        </div>
        <button className="text-[10px] font-bold text-[#6f59fe] uppercase tracking-widest hover:text-[#ada3ff] transition-colors">
          Lihat Semua
        </button>
      </div>

      {/* 2. Date Container 
          - pt-2: Mencegah scale-105 terpotong
          - snap-x: Memberikan feel native scroll
      */}
      <div className="flex gap-2.5 sm:justify-between overflow-x-auto pt-2 pb-4 no-scrollbar -mx-5 px-5 snap-x">
        {dates.map((d) => (
          <button
            key={d.date}
            onClick={() => onDateSelect(d.date)}
            className={`flex-shrink-0 w-14 sm:w-16 py-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-0.5 snap-center shadow-lg ${
              selectedDate === d.date
                ? "bg-[#6f59fe] border-[#6f59fe] text-white shadow-[#6f59fe]/40 scale-105 z-10"
                : "bg-[#1f1d35]/40 border-white/5 text-[#aca8c1] hover:border-[#6f59fe]/30"
            }`}
          >
            <span className="text-[9px] font-bold uppercase opacity-60 tracking-tighter">
              {d.day}
            </span>
            <span className="text-lg font-bold">{d.date}</span>
          </button>
        ))}
      </div>

      {/* 3. Time Picker Container (Glassmorphism) */}
      <div className="bg-[#1f1d35]/30 border border-white/5 rounded-[2.2rem] p-6">
        <div className="grid grid-cols-2 gap-4">
          <TimeDropdown
            label="Jam Mulai"
            value={startTime}
            icon="schedule"
            isOpen={activeDropdown === "start"}
            onToggle={() =>
              setActiveDropdown(activeDropdown === "start" ? null : "start")
            }
            onSelect={(val) => {
              setStartTime(val);
              setActiveDropdown(null);
            }}
          />
          <TimeDropdown
            label="Jam Selesai"
            value={endTime}
            icon="calendar_today"
            isOpen={activeDropdown === "end"}
            onToggle={() =>
              setActiveDropdown(activeDropdown === "end" ? null : "end")
            }
            onSelect={(val) => {
              setEndTime(val);
              setActiveDropdown(null);
            }}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Sub-komponen TimeDropdown
 * Menggunakan portal-like logic (absolute positioning) agar tidak merusak layout
 */
function TimeDropdown({ label, value, icon, isOpen, onToggle, onSelect }) {
  return (
    <div className="space-y-3 relative">
      {/* Label dengan Ikon */}
      <div className="flex items-center gap-2 ml-1">
        <MaterialIcon name={icon} className="text-sm text-[#aca8c1]" />
        <label className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-[0.15em]">
          {label}
        </label>
      </div>

      {/* Dropdown Box Trigger */}
      <div
        onClick={onToggle}
        className={`w-full border rounded-[1.2rem] p-4 flex justify-between items-center transition-all duration-300 cursor-pointer active:scale-[0.98] ${
          isOpen
            ? "bg-[#1f1d35] border-[#6f59fe] shadow-[0_0_15px_rgba(111,89,254,0.15)]"
            : "bg-[#1f1d35]/40 border-white/5"
        }`}
      >
        <span
          className={`text-sm font-bold ${isOpen ? "text-white" : "text-[#aca8c1]"}`}
        >
          {value}
        </span>
        <MaterialIcon
          name={isOpen ? "expand_less" : "expand_more"}
          className={`text-xl transition-transform duration-300 ${isOpen ? "text-[#6f59fe]" : "text-[#aca8c1]"}`}
        />
      </div>

      {/* Dropdown Menu (Scrollable List) */}
      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-[#161427] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-2xl animate-in slide-in-from-top-2 duration-300">
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-2">
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot}
                onClick={() => onSelect(slot)}
                className={`px-6 py-3 text-sm font-medium transition-all cursor-pointer flex items-center justify-between ${
                  value === slot
                    ? "bg-[#6f59fe] text-white"
                    : "text-[#aca8c1] hover:bg-white/5 hover:text-[#ada3ff]"
                }`}
              >
                {slot}
                {value === slot && (
                  <MaterialIcon name="check" className="text-sm" />
                )}
              </div>
            ))}
          </div>
          {/* Dekorasi Gradient Scroll Indicator (Optional) */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#1a182e] to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  );
}
