"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

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

// Generate time slots from 07:00 to 21:00
const TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (let min of ["00", "30"]) {
      slots.push(`${hour.toString().padStart(2, "0")}:${min}`);
    }
  }
  return slots;
})();

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_HEADERS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function BursaSchedulePicker({
  selectedDate = "",
  onDateSelect,
  startTime = "",
  onStartTimeChange,
  endTime = "",
  onEndTimeChange,
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const containerRef = useRef(null);

  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return getLocalDateString(d);
  }, [today]);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Generate calendar grid for current view
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];

    // Empty slots before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dateStr = getLocalDateString(date);
      const isPast = dateStr < tomorrow;
      days.push({ day: d, dateStr, isPast });
    }

    return days;
  }, [viewMonth, viewYear, tomorrow]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Disable prev if we'd go to a fully past month
  const canGoPrev = useMemo(() => {
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const lastDayOfPrev = new Date(prevYear, prevMonth + 1, 0);
    return getLocalDateString(lastDayOfPrev) >= tomorrow;
  }, [viewMonth, viewYear, tomorrow]);

  const getSlotStatus = (time, type) => {
    if (!selectedDate) return "disabled";
    if (type === "start") return "available";
    if (!startTime) return "disabled";
    const startMin = timeToMinutes(startTime);
    const timeMin = timeToMinutes(time);
    if (timeMin <= startMin) return "disabled";
    if (timeMin > startMin + 180) return "disabled";
    return "available";
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
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" />
        <h2 className="text-base sm:text-lg font-black text-main uppercase tracking-tight font-headline">
          Pilih Jadwal Konsultasi
        </h2>
      </div>

      {/* Calendar */}
      <div className="bg-card border border-surface rounded-[2rem] p-5 shadow-soft transition-colors duration-500">
        {/* Month/Year Navigation */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              canGoPrev
                ? "bg-surface hover:bg-primary/20 text-main"
                : "opacity-20 cursor-not-allowed text-muted"
            }`}
          >
            <MaterialIcon name="chevron_left" className="text-xl" />
          </button>

          <div className="text-center">
            <h3 className="text-sm font-black text-main uppercase tracking-wider font-headline">
              {MONTH_NAMES[viewMonth]}
            </h3>
            <p className="text-[10px] font-bold text-muted tracking-widest">
              {viewYear}
            </p>
          </div>

          <button
            onClick={goToNextMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface hover:bg-primary/20 text-main transition-all"
          >
            <MaterialIcon name="chevron_right" className="text-xl" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="text-center text-[9px] font-black text-muted uppercase tracking-widest py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const isSelected = selectedDate === cell.dateStr;
            const isToday = cell.dateStr === getLocalDateString(today);

            return (
              <button
                key={cell.dateStr}
                disabled={cell.isPast}
                onClick={() => {
                  onDateSelect?.(cell.dateStr);
                  onStartTimeChange?.("");
                  onEndTimeChange?.("");
                }}
                className={`
                  aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 relative
                  ${
                    isSelected
                      ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110 z-10"
                      : cell.isPast
                        ? "opacity-20 cursor-not-allowed text-muted"
                        : isToday
                          ? "bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary/20"
                          : "text-main hover:bg-surface"
                  }
                `}
              >
                {cell.day}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Pickers */}
      <div className="bg-card border border-surface rounded-[2rem] p-6 shadow-soft relative transition-colors duration-500">
        {!selectedDate ? (
          <div className="flex flex-col items-center gap-3 py-6 text-muted">
            <MaterialIcon name="event" className="text-3xl opacity-30" />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Pilih tanggal terlebih dahulu
            </p>
          </div>
        ) : (
          <>
            {/* Selected date display */}
            <div className="flex items-center gap-2 mb-5 px-3 py-2.5 bg-primary/5 border border-primary/10 rounded-xl">
              <MaterialIcon name="event" className="text-primary-light text-base" />
              <span className="text-xs text-main font-bold">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

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
          </>
        )}
      </div>

      {/* Preview */}
      {selectedDate && startTime && endTime && (
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <MaterialIcon
            name="event_available"
            className="text-primary-light text-xl shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          />
          <p className="text-sm text-main font-semibold">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" • "}
            <span className="text-primary-light">{startTime} - {endTime}</span>
          </p>
        </div>
      )}
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
              const isDisabled = status === "disabled";
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
                  <span className="font-headline">{slot}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
