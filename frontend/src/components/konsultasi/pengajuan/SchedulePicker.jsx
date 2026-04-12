"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MaterialIcon } from "@/components/ui/Icons";

// Helper untuk manipulasi waktu
const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (totalMin) => {
  const h = Math.floor(totalMin / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMin % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min of ["00", "30"]) {
      slots.push(`${hour.toString().padStart(2, "0")}:${min}`);
    }
  }
  return slots;
})();

export default function SchedulePicker({
  rawSchedules = [],
  bookedSlots = [],
  selectedDate,
  onDateSelect,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const containerRef = useRef(null);

  // 1. GENERATE 7 HARI KE DEPAN
  const displayDates = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const localISODate = `${year}-${month}-${day}`;

      days.push({
        fullDate: localISODate,
        dayName: d
          .toLocaleDateString("id-ID", { weekday: "short" })
          .toUpperCase(),
        dayNumber: d.getDate().toString(),
      });
    }
    return days;
  }, []);

  // 2. LOGIKA DOUBLE FILTER & DYNAMIC BOUNDARIES
  const getSlotStatus = (time, type) => {
    if (!selectedDate) return "disabled";

    const daySchedule = rawSchedules.find((s) => s.tanggal === selectedDate);
    if (!daySchedule) return "disabled";

    const openTime = daySchedule.jam_mulai.substring(0, 5);
    const closeTime = daySchedule.jam_selesai.substring(0, 5);

    const timeMin = timeToMinutes(time);
    const openMin = timeToMinutes(openTime);
    const closeMin = timeToMinutes(closeTime);

    // LOGIKA FILTER 1: OPERASIONAL (JAM BUKA/TUTUP)
    if (type === "start") {
      // Jam Mulai maksimal adalah Jam Selesai Operasional - 30 menit
      if (timeMin < openMin || timeMin > closeMin - 30) return "disabled";
    } else {
      // Jam Selesai minimal adalah Jam Mulai terpilih + 30 menit
      const selectedStartMin = timeToMinutes(startTime);
      if (timeMin <= selectedStartMin || timeMin > closeMin) return "disabled";

      // Bonus Logic: Jika di antara jam_mulai dan jam_selesai yang baru dipilih ada booking, disable.
      const hasOverlap = bookedSlots.some((b) => {
        if (b.tanggal_pengajuan !== selectedDate) return false;
        const bStart = timeToMinutes(b.jam_mulai.substring(0, 5));
        return bStart > selectedStartMin && bStart < timeMin;
      });
      if (hasOverlap) return "disabled";
    }

    // LOGIKA FILTER 2: BOOKED SLOTS
    const isBooked = bookedSlots.some((b) => {
      if (b.tanggal_pengajuan !== selectedDate) return false;
      const bStart = b.jam_mulai.substring(0, 5);
      const bEnd = b.jam_selesai.substring(0, 5);
      return time >= bStart && time < bEnd;
    });

    return isBooked ? "booked" : "available";
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="space-y-6 w-full" ref={containerRef}>
      <div className="flex items-center gap-2 px-1">
        <div className="w-1.5 h-6 bg-[#6f59fe] rounded-full shadow-[0_0_10px_rgba(111,89,254,0.5)]" />
        <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">
          Jadwal Tersedia
        </h2>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pt-2 pb-4 no-scrollbar -mx-5 px-5 snap-x">
        {displayDates.map((d) => {
          const isAvailableDay = rawSchedules.some(
            (s) => s.tanggal === d.fullDate,
          );
          return (
            <button
              key={d.fullDate}
              onClick={() => isAvailableDay && onDateSelect(d.fullDate)}
              disabled={!isAvailableDay}
              className={`flex-shrink-0 w-14 sm:w-16 py-3.5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-0.5 snap-center ${
                selectedDate === d.fullDate
                  ? "bg-[#6f59fe] border-[#6f59fe] text-white scale-105 z-10 shadow-lg shadow-[#6f59fe]/40"
                  : isAvailableDay
                    ? "bg-[#1f1d35]/40 border-white/5 text-[#aca8c1] hover:border-[#6f59fe]/30 cursor-pointer"
                    : "bg-[#1f1d35]/10 border-transparent text-[#aca8c1]/20 opacity-30 cursor-not-allowed pointer-events-none"
              }`}
            >
              <span className="text-[9px] font-bold uppercase opacity-60">
                {d.dayName}
              </span>
              <span className="text-lg font-bold">{d.dayNumber}</span>
            </button>
          );
        })}
      </div>

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
              onStartTimeChange(val);
              // Auto-adjust Jam Selesai jika Jam Mulai berubah
              const nextMin = timeToMinutes(val) + 30;
              onEndTimeChange(minutesToTime(nextMin));
              setActiveDropdown(null);
            }}
            getSlotStatus={(time) => getSlotStatus(time, "start")}
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
              onEndTimeChange(val);
              setActiveDropdown(null);
            }}
            getSlotStatus={(time) => getSlotStatus(time, "end")}
          />
        </div>
      </div>
    </section>
  );
}

function TimeDropdown({
  label,
  value,
  icon,
  isOpen,
  onToggle,
  onSelect,
  getSlotStatus,
}) {
  return (
    <div className="space-y-3 relative">
      <div className="flex items-center gap-2 ml-1">
        <MaterialIcon name={icon} className="text-sm text-[#aca8c1]" />
        <label className="text-[10px] font-bold text-[#aca8c1] uppercase tracking-[0.15em]">
          {label}
        </label>
      </div>
      <div
        onClick={onToggle}
        className={`w-full border rounded-[1.2rem] p-4 flex justify-between items-center transition-all cursor-pointer ${
          isOpen
            ? "bg-[#1f1d35] border-[#6f59fe]"
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
          className="text-xl"
        />
      </div>
      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-[#161427] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl">
          <div className="max-h-60 overflow-y-auto py-2">
            {TIME_SLOTS.map((slot) => {
              const status = getSlotStatus(slot);
              const isDisabled = status === "disabled" || status === "booked";
              return (
                <div
                  key={slot}
                  onClick={() => !isDisabled && onSelect(slot)}
                  className={`px-6 py-3 text-sm flex items-center justify-between transition-all ${
                    isDisabled
                      ? "opacity-20 grayscale cursor-not-allowed"
                      : value === slot
                        ? "bg-[#6f59fe] text-white"
                        : "text-[#aca8c1] hover:bg-white/5 cursor-pointer"
                  }`}
                >
                  <span className="flex flex-col">
                    {slot}
                    {status === "booked" && (
                      <span className="text-[8px] text-rose-400 font-bold uppercase">
                        Full
                      </span>
                    )}
                  </span>
                  {status === "booked" && (
                    <MaterialIcon
                      name="lock"
                      className="text-xs text-rose-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
