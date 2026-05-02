"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

// Helper untuk mendapatkan YYYY-MM-DD waktu lokal (Bukan UTC)
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const timeToMinutes = (time = "00:00") => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minutesToTime = (totalMin = 0) => {
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
  selectedDate = "",
  onDateSelect,
  startTime = "00:00",
  onStartTimeChange,
  endTime = "00:00",
  onEndTimeChange,
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const containerRef = useRef(null);

  const displayDates = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);

      // FIX: Jangan gunakan toISOString().split('T')[0]
      const localDate = getLocalDateString(d);

      days.push({
        fullDate: localDate,
        dayName: d
          .toLocaleDateString("id-ID", { weekday: "short" })
          .toUpperCase(),
        dayNumber: d.getDate().toString(),
      });
    }
    return days;
  }, []);

  const getSlotStatus = (time, type) => {
    if (!selectedDate) return "disabled";

    // Safety check matching tanggal
    const daySchedule = rawSchedules.find((s) => s.tanggal === selectedDate);
    if (!daySchedule) return "disabled";

    const openMin = timeToMinutes(daySchedule.jam_mulai?.substring(0, 5));
    const closeMin = timeToMinutes(daySchedule.jam_selesai?.substring(0, 5));
    const timeMin = timeToMinutes(time);

    if (type === "start") {
      if (timeMin < openMin || timeMin > closeMin - 30) return "disabled";
    } else {
      const selectedStartMin = timeToMinutes(startTime);
      if (timeMin <= selectedStartMin || timeMin > closeMin) return "disabled";

      const hasOverlap = bookedSlots.some((b) => {
        if (b.tanggal_pengajuan !== selectedDate) return false;
        const bStart = timeToMinutes(b.jam_mulai?.substring(0, 5));
        return bStart > selectedStartMin && bStart < timeMin;
      });
      if (hasOverlap) return "disabled";
    }

    const isBooked = bookedSlots.some((b) => {
      if (b.tanggal_pengajuan !== selectedDate) return false;
      const bStart = b.jam_mulai?.substring(0, 5);
      const bEnd = b.jam_selesai?.substring(0, 5);
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
      <div className="flex items-center gap-3 px-1">
        <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" />
        <h2 className="text-base sm:text-lg font-black text-main uppercase tracking-tight font-headline">
          Pilih Jadwal Sesi
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pt-2 pb-4 no-scrollbar -mx-5 px-5 snap-x">
        {displayDates.map((d) => {
          // Sekarang perbandingan tanggal sudah akurat (Lokal vs Lokal)
          const isAvailableDay = rawSchedules.some(
            (s) => s.tanggal === d.fullDate,
          );
          const isSelected = selectedDate === d.fullDate;

          return (
            <Button
              key={d.fullDate}
              variant={isSelected ? "primary" : "secondary"}
              disabled={!isAvailableDay}
              onClick={() => onDateSelect?.(d.fullDate)}
              className={`
                flex-shrink-0 !w-16 !h-auto !py-4 !rounded-2xl !flex-col !gap-1 snap-center border transition-all duration-300
                ${
                  isSelected
                    ? "shadow-lg shadow-primary/20 scale-105 z-10"
                    : "!bg-input !border-surface text-muted hover:!border-primary/40"
                }
                ${!isAvailableDay && "opacity-20 !bg-transparent !border-dashed"}
              `}
            >
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? "text-white/70" : "text-muted"}`}
              >
                {d.dayName}
              </span>
              <span
                className={`text-xl font-black ${isSelected ? "text-white" : "text-main"}`}
              >
                {d.dayNumber}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="bg-card border border-surface rounded-[2.5rem] p-6 shadow-soft relative transition-colors duration-500">
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
              onStartTimeChange?.(val);
              const nextMin = timeToMinutes(val) + 30;
              onEndTimeChange?.(minutesToTime(nextMin));
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
              onEndTimeChange?.(val);
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
    <div className={`space-y-3 relative ${isOpen ? "z-[100]" : "z-10"}`}>
      <div className="flex items-center gap-2 ml-1">
        <MaterialIcon name={icon} className="text-sm text-muted" />
        <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
          {label}
        </label>
      </div>

      <div
        onClick={onToggle}
        className={`w-full border rounded-2xl p-4 flex justify-between items-center transition-all duration-300 cursor-pointer ${
          isOpen
            ? "bg-input border-primary ring-2 ring-primary/10"
            : "bg-input/50 border-surface hover:border-primary/30"
        }`}
      >
        <span className="text-sm font-bold text-main">{value || "--:--"}</span>
        <MaterialIcon
          name="expand_more"
          className={`text-xl transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : "text-muted"}`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-dropdown border border-surface rounded-2xl shadow-2xl z-[110] overflow-hidden animate-fade-in backdrop-blur-xl">
          <div className="max-h-60 overflow-y-auto py-2 scrollbar-thin">
            {TIME_SLOTS.map((slot) => {
              const status = getSlotStatus(slot);
              const isDisabled = status === "disabled" || status === "booked";
              const isSelected = value === slot;

              return (
                <div
                  key={slot}
                  onClick={() => !isDisabled && onSelect?.(slot)}
                  className={`px-6 py-3 text-sm flex items-center justify-between transition-all ${
                    isDisabled
                      ? "opacity-20 grayscale cursor-not-allowed bg-transparent"
                      : isSelected
                        ? "bg-primary text-white font-bold"
                        : "text-main hover:bg-surface cursor-pointer"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-headline">{slot}</span>
                    {status === "booked" && (
                      <span className="text-[8px] text-danger font-black uppercase tracking-tighter">
                        Terisi
                      </span>
                    )}
                  </div>
                  {status === "booked" && (
                    <MaterialIcon name="lock" className="text-xs text-danger" />
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
