"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MaterialIcon } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { SelectDropdown } from "@/components/ui/Dropdown";

// Helper: YYYY-MM-DD lokal (bukan UTC)
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
  const h = Math.floor(totalMin / 60).toString().padStart(2, "0");
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

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const ALL_MONTH_OPTIONS = MONTH_NAMES_ID.map((name, idx) => ({
  value: idx,
  label: name,
}));

// Hasilkan daftar tahun: tahun ini s.d. 2 tahun ke depan
const YEAR_OPTIONS = (() => {
  const thisYear = new Date().getFullYear();
  return [thisYear, thisYear + 1, thisYear + 2].map((y) => ({ value: y, label: String(y) }));
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
  isPublic = false,
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const firstAvailableRef = useRef(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();

  // State bulan & tahun yang sedang ditampilkan
  const [viewMonth, setViewMonth] = useState(thisMonth); // 0-based
  const [viewYear, setViewYear] = useState(thisYear);

  // Kalau bukan mode publik: geser tampilan ke tanggal pertama konsultan available
  useEffect(() => {
    if (isPublic || !rawSchedules.length) return;
    const sorted = [...rawSchedules].sort((a, b) =>
      a.tanggal > b.tanggal ? 1 : -1
    );
    const first = sorted.find((s) => s.tanggal >= getLocalDateString(today));
    if (!first) return;
    const [y, m] = first.tanggal.split("-").map(Number);
    setViewYear(y);
    setViewMonth(m - 1); // 0-based
  }, [rawSchedules, isPublic, today]);

  // Scroll spesifik HANYA secara horizontal ke tanggal pertama yang available
  // Tanpa memaksa halaman lompat ke bawah
  useEffect(() => {
    if (!firstAvailableRef.current || !scrollContainerRef.current) return;
    const timer = setTimeout(() => {
      if (firstAvailableRef.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const item = firstAvailableRef.current;
        container.scrollTo({
          left: item.offsetLeft - container.offsetLeft - 20,
          behavior: "smooth",
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [viewMonth, viewYear]);

  // Filter bulan: kalau tahun sekarang, jangan tampilkan bulan yang sudah lewat
  const availableMonthOptions = useMemo(() => {
    if (viewYear === thisYear) {
      return ALL_MONTH_OPTIONS.filter((m) => m.value >= thisMonth);
    }
    return ALL_MONTH_OPTIONS;
  }, [viewYear, thisYear, thisMonth]);

  // Hitung semua tanggal yang valid (>= hari ini) di bulan & tahun yang dipilih
  const displayDates = useMemo(() => {
    const days = [];
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      d.setHours(0, 0, 0, 0);
      if (d < today) continue; // lewati tanggal yang sudah terlewat
      days.push({
        fullDate: getLocalDateString(d),
        dayName: d.toLocaleDateString("id-ID", { weekday: "short" }).toUpperCase(),
        dayNumber: String(day),
      });
    }
    return days;
  }, [viewMonth, viewYear, today]);

  const getSlotStatus = (time, type) => {
    if (!selectedDate) return "disabled";

    const timeMin = timeToMinutes(time);
    const selectedStartMin = timeToMinutes(startTime);

    const now = new Date();
    const todayStr = getLocalDateString(now);
    const isToday = selectedDate === todayStr;
    const currentMin = now.getHours() * 60 + now.getMinutes();

    if (isPublic) {
      if (type === "end") {
        if (timeMin <= selectedStartMin) return "disabled";
        const hasOverlap = bookedSlots.some((b) => {
          const bDateRaw = b.jadwal_ketersediaan?.tanggal || b.tanggal_pengajuan;
          const bDate = bDateRaw ? bDateRaw.split("T")[0] : "";
          if (bDate !== selectedDate) return false;
          const bJamMulai = b.jam_mulai || b.jadwal_ketersediaan?.jam_mulai;
          const bStart = timeToMinutes(bJamMulai?.substring(0, 5));
          return bStart > selectedStartMin && bStart < timeMin;
        });
        if (hasOverlap) return "disabled";
      } else {
        if (isToday && timeMin <= currentMin) return "disabled";

        const isStartBooked = bookedSlots.some((b) => {
          const bDateRaw = b.jadwal_ketersediaan?.tanggal || b.tanggal_pengajuan;
          const bDate = bDateRaw ? bDateRaw.split("T")[0] : "";
          if (bDate !== selectedDate) return false;
          const bJamMulai = b.jam_mulai || b.jadwal_ketersediaan?.jam_mulai;
          const bJamSelesai = b.jam_selesai || b.jadwal_ketersediaan?.jam_selesai;
          const bStart = timeToMinutes(bJamMulai?.substring(0, 5));
          const bEnd = timeToMinutes(bJamSelesai?.substring(0, 5));
          return timeMin >= bStart && timeMin < bEnd;
        });
        if (isStartBooked) return "booked";
      }

      const isBooked = bookedSlots.some((b) => {
        const bDateRaw = b.jadwal_ketersediaan?.tanggal || b.tanggal_pengajuan;
        const bDate = bDateRaw ? bDateRaw.split("T")[0] : "";
        if (bDate !== selectedDate) return false;
        const bJamMulai = b.jam_mulai || b.jadwal_ketersediaan?.jam_mulai;
        const bJamSelesai = b.jam_selesai || b.jadwal_ketersediaan?.jam_selesai;
        const bStart = bJamMulai?.substring(0, 5);
        const bEnd = bJamSelesai?.substring(0, 5);
        return time >= bStart && time < bEnd;
      });

      return isBooked ? "booked" : "available";
    }

    const daySchedule = rawSchedules.find((s) => s.tanggal === selectedDate);
    if (!daySchedule) return "disabled";

    const openMin = timeToMinutes(daySchedule.jam_mulai?.substring(0, 5));
    const closeMin = timeToMinutes(daySchedule.jam_selesai?.substring(0, 5));

    if (type === "start") {
      if (timeMin < openMin || timeMin > closeMin - 30) return "disabled";
      if (isToday && timeMin <= currentMin) return "disabled";
    } else {
      if (timeMin <= selectedStartMin || timeMin > closeMin) return "disabled";
      const hasOverlap = bookedSlots.some((b) => {
        const bDateRaw = b.jadwal_ketersediaan?.tanggal || b.tanggal_pengajuan;
        const bDate = bDateRaw ? bDateRaw.split("T")[0] : "";
        if (bDate !== selectedDate) return false;
        const bJamMulai = b.jam_mulai || b.jadwal_ketersediaan?.jam_mulai;
        const bStart = timeToMinutes(bJamMulai?.substring(0, 5));
        return bStart > selectedStartMin && bStart < timeMin;
      });
      if (hasOverlap) return "disabled";
    }

    const isBooked = bookedSlots.some((b) => {
      const bDateRaw = b.jadwal_ketersediaan?.tanggal || b.tanggal_pengajuan;
      const bDate = bDateRaw ? bDateRaw.split("T")[0] : "";
      if (bDate !== selectedDate) return false;
      const bJamMulai = b.jam_mulai || b.jadwal_ketersediaan?.jam_mulai;
      const bJamSelesai = b.jam_selesai || b.jadwal_ketersediaan?.jam_selesai;
      const bStart = bJamMulai?.substring(0, 5);
      const bEnd = bJamSelesai?.substring(0, 5);
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
      {/* Judul */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" />
        <h2 className="text-base sm:text-lg font-black text-main uppercase tracking-tight font-headline">
          Pilih Jadwal Sesi
        </h2>
      </div>

      {/* Dropdown Bulan & Tahun*/}
      <div className="grid grid-cols-2 gap-3">
        <SelectDropdown
          label="Bulan"
          value={viewMonth}
          options={availableMonthOptions}
          isOpen={activeDropdown === "month"}
          onToggle={() => setActiveDropdown(activeDropdown === "month" ? null : "month")}
          onSelect={(val) => {
            setViewMonth(val);
            onDateSelect?.("");
            setActiveDropdown(null);
          }}
        />
        <SelectDropdown
          label="Tahun"
          value={viewYear}
          options={YEAR_OPTIONS}
          isOpen={activeDropdown === "year"}
          onToggle={() => setActiveDropdown(activeDropdown === "year" ? null : "year")}
          onSelect={(val) => {
            setViewYear(val);
            if (val === thisYear && viewMonth < thisMonth) {
              setViewMonth(thisMonth);
            }
            onDateSelect?.("");
            setActiveDropdown(null);
          }}
        />
      </div>

      {/* Daftar Tanggal */}
      {displayDates.length === 0 ? (
        <p className="text-muted text-sm italic px-1">
          Tidak ada tanggal tersedia di bulan ini.
        </p>
      ) : (
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pt-2 pb-4 no-scrollbar px-1 snap-x"
        >
          {displayDates.map((d, idx) => {
            const isAvailableDay =
              isPublic ||
              rawSchedules.some((s) => s.tanggal === d.fullDate);
            const isSelected = selectedDate === d.fullDate;
            // Ref ke tombol PERTAMA yang available (untuk scroll otomatis)
            const isFirstAvailable = !isPublic && isAvailableDay && idx === displayDates.findIndex(
              (x) => rawSchedules.some((s) => s.tanggal === x.fullDate)
            );

            return (
              <div key={d.fullDate} ref={isFirstAvailable ? firstAvailableRef : null} className="snap-center flex-shrink-0">
                <Button
                  variant={isSelected ? "primary" : "secondary"}
                  disabled={!isAvailableDay}
                  onClick={() => onDateSelect?.(d.fullDate)}
                  className={`
                    !w-16 !h-auto !py-4 !rounded-2xl !flex-col !gap-1 border transition-all duration-300
                    ${
                      isSelected
                        ? "shadow-lg shadow-primary/20 scale-105 z-10"
                        : "!bg-input !border-surface text-muted hover:!border-primary/40"
                    }
                    ${!isAvailableDay && "opacity-20 !bg-transparent !border-dashed"}
                  `}
                >
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest ${
                      isSelected ? "text-white/70" : "text-muted"
                    }`}
                  >
                    {d.dayName}
                  </span>
                  <span
                    className={`text-xl font-black ${
                      isSelected ? "text-white" : "text-main"
                    }`}
                  >
                    {d.dayNumber}
                  </span>
                </Button>
              </div>
            );

          })}
        </div>
      )}

      {/* Jam Mulai & Jam Selesai */}
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
            icon="schedule"
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
          className={`text-xl transition-transform duration-300 ${
            isOpen ? "rotate-180 text-primary" : "text-muted"
          }`}
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
}