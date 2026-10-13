"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/ui/Icons";
import { Calendar } from "@/components/ui/Calendar";
import { consultantService } from "@/services/consultant.service";

// Helper: Format tanggal lokal YYYY-MM-DD
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: Konversi string "HH:MM" ke total menit
const timeToMinutes = (time = "00:00") => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper: Konversi total menit ke string "HH:MM"
const minutesToTime = (totalMin = 0) => {
  const h = Math.floor(totalMin / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMin % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

// Daftar opsi durasi konsultasi (durasi 30 menit per sesi)
const DURATION_OPTIONS = [
  { value: 30, label: "30 Menit", sessions: 1 },
  { value: 60, label: "60 Menit", sessions: 2 },
  { value: 90, label: "90 Menit", sessions: 3 },
  { value: 120, label: "120 Menit", sessions: 4 },
];

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function SchedulePicker({
  consultantId,
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
  const [userSelectedDuration, setUserSelectedDuration] = useState(30);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();

  // Cari jadwal pertama konsultan yang aktif untuk tampilan awal kalender
  const firstAvailableMonthYear = useMemo(() => {
    if (isPublic || !rawSchedules.length) return null;
    const sorted = [...rawSchedules].sort((a, b) =>
      a.tanggal > b.tanggal ? 1 : -1
    );
    const first = sorted.find((s) => s.tanggal >= getLocalDateString(today));
    if (!first) return null;
    const [y, m] = first.tanggal.split("-").map(Number);
    return { year: y, month: m - 1 };
  }, [rawSchedules, isPublic, today]);

  // State bulan & tahun kalender saat pengguna berpindah navigasi secara manual
  const [userSelectedMonth, setUserSelectedMonth] = useState(null);
  const [userSelectedYear, setUserSelectedYear] = useState(null);

  const viewMonth =
    userSelectedMonth ?? firstAvailableMonthYear?.month ?? thisMonth;
  const viewYear =
    userSelectedYear ?? firstAvailableMonthYear?.year ?? thisYear;

  // Navigasi bulan kalender
  const isPrevMonthDisabled =
    viewYear === thisYear && viewMonth <= thisMonth;

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (viewMonth === 0) {
      setUserSelectedYear(viewYear - 1);
      setUserSelectedMonth(11);
    } else {
      setUserSelectedYear(viewYear);
      setUserSelectedMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setUserSelectedYear(viewYear + 1);
      setUserSelectedMonth(0);
    } else {
      setUserSelectedYear(viewYear);
      setUserSelectedMonth(viewMonth + 1);
    }
  };

  // Jika startTime dan endTime terisi dan selisihnya cocok dengan opsi durasi, gunakan durasi tersebut secara deklaratif
  const calculatedDiff = useMemo(() => {
    if (!startTime || !endTime) return null;
    const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
    return diff > 0 && DURATION_OPTIONS.some((d) => d.value === diff)
      ? diff
      : null;
  }, [startTime, endTime]);

  const selectedDuration = calculatedDiff ?? userSelectedDuration;

  // Menghasilkan daftar sel kalender (Minggu = 0, sama persis dengan /schedule)
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ isPadding: true, key: `pad-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      d.setHours(0, 0, 0, 0);
      const fullDate = getLocalDateString(d);
      const isPast = d < today;

      const isAvailableDay =
        !isPast &&
        (isPublic ||
          rawSchedules.some(
            (s) =>
              s.tanggal === fullDate &&
              (s.status_tersedia === undefined || s.status_tersedia === true)
          ));

      cells.push({
        isPadding: false,
        key: fullDate,
        dayNumber: day,
        date: day,
        fullDate,
        isPast,
        isAvailableDay,
      });
    }

    return cells;
  }, [viewYear, viewMonth, today, isPublic, rawSchedules]);

  // Helper: Mengecek apakah ada sesi yang sudah di-booking bertabrakan dengan rentang [startMin, endMin)
  const isRangeBooked = useCallback(
    (startMin, endMin) => {
      return bookedSlots.some((b) => {
        const bDateRaw =
          b.jadwal_ketersediaan?.tanggal || b.tanggal_pengajuan;
        const bDate = bDateRaw ? bDateRaw.split("T")[0] : "";
        if (bDate !== selectedDate) return false;
        const bJamMulai = b.jam_mulai || b.jadwal_ketersediaan?.jam_mulai;
        const bJamSelesai =
          b.jam_selesai || b.jadwal_ketersediaan?.jam_selesai;
        const bStart = timeToMinutes(bJamMulai?.substring(0, 5));
        const bEnd = timeToMinutes(bJamSelesai?.substring(0, 5));
        return Math.max(startMin, bStart) < Math.min(endMin, bEnd);
      });
    },
    [bookedSlots, selectedDate]
  );

  // Fallback: generate slot pills di frontend (dipakai jika isPublic atau API tidak tersedia)
  const localSlotPills = useMemo(() => {
    if (!selectedDate) return [];

    let openMin = 8 * 60;
    let closeMin = 21 * 60;

    if (!isPublic) {
      const daySchedule = rawSchedules.find((s) => s.tanggal === selectedDate);
      if (!daySchedule) return [];
      openMin = timeToMinutes(daySchedule.jam_mulai?.substring(0, 5));
      closeMin = timeToMinutes(daySchedule.jam_selesai?.substring(0, 5));
    }

    const now = new Date();
    const todayStr = getLocalDateString(now);
    const isToday = selectedDate === todayStr;
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    for (let m = openMin; m <= closeMin - selectedDuration; m += 30) {
      const startStr = minutesToTime(m);
      const endStr = minutesToTime(m + selectedDuration);
      const isPast = isToday && m <= currentMin;
      const isBooked = isRangeBooked(m, m + selectedDuration);

      let status = "available";
      if (isPast) status = "disabled";
      else if (isBooked) status = "booked";

      slots.push({
        start: startStr,
        end: endStr,
        label: `${startStr} - ${endStr}`,
        status,
      });
    }

    return slots;
  }, [
    selectedDate,
    isPublic,
    rawSchedules,
    selectedDuration,
    isRangeBooked,
  ]);

  // Fetch slot pills dari backend (hanya jika ada consultantId & tanggal dipilih)
  const useBackendSlots = !!consultantId && !!selectedDate && !isPublic;
  const {
    data: slotsApiData,
    isFetching: isSlotsFetching,
  } = useQuery({
    queryKey: ["availableSlots", consultantId, selectedDate, selectedDuration],
    queryFn: () =>
      consultantService.getAvailableSlots(consultantId, selectedDate, selectedDuration),
    enabled: useBackendSlots,
    staleTime: 30_000, // 30 detik
    retry: 1,
  });

  // Prioritaskan data dari backend jika tersedia, fallback ke local generation
  const dynamicSlotPills = useBackendSlots
    ? (slotsApiData?.slots ?? localSlotPills)
    : localSlotPills;


  // Format tanggal terpilih ke bahasa Indonesia
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return "";
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Handler memilih chip durasi — reset waktu agar user pilih slot valid untuk durasi baru
  const handleDurationSelect = (durationMinutes) => {
    setUserSelectedDuration(durationMinutes);
    onStartTimeChange?.("");
    onEndTimeChange?.("");
  };

  return (
    <section className="space-y-6 w-full">
      {/* 1. Header Judul & Legenda Ketersediaan */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" />
          <h2 className="text-base sm:text-lg font-black text-main uppercase tracking-tight font-headline">
            Pilih Jadwal Sesi
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted font-medium">
          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--primary-rgb),0.7)]" />
          <span>Jadwal Tersedia</span>
        </div>
      </div>

      {/* 2. Date Picker Kalender Bersama (Gaya Visual Bulat Identik dengan Jadwal Konsultan) */}
      <Calendar
        days={calendarCells}
        selectedDay={selectedDate}
        onSelectDay={(date) => {
          onDateSelect?.(date);
          onStartTimeChange?.("");
          onEndTimeChange?.("");
        }}
        monthLabel={`${MONTH_NAMES_ID[viewMonth]} ${viewYear}`}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        isPrevDisabled={isPrevMonthDisabled}
        testId="monthly-calendar"
      />

      {/* 3. Pemilihan Durasi & Jam Sesi */}
      {!selectedDate ? (
        <div className="bg-card/40 border border-dashed border-surface rounded-[2rem] p-6 text-center text-muted text-xs flex flex-col items-center justify-center gap-2">
          <MaterialIcon name="touch_app" className="text-2xl text-primary/60" />
          <p className="font-medium">
            Pilih salah satu tanggal di atas untuk melihat pilihan durasi dan jam konsultasi.
          </p>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Fitur Duration Chips: Pilihan Durasi Konsultasi */}
          <div className="bg-card/50 border border-surface rounded-[2rem] p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] sm:text-[11px] font-black text-muted uppercase tracking-[0.15em] flex items-center gap-1.5">
                <MaterialIcon name="timelapse" className="text-sm text-primary" />
                <span>Pilih Durasi Konsultasi</span>
              </label>
              <span className="text-[11px] text-primary font-bold">
                {selectedDuration} Menit ({selectedDuration / 30} Sesi)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {DURATION_OPTIONS.map((opt) => {
                const isDurationActive = selectedDuration === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleDurationSelect(opt.value)}
                    className={`
                      py-3 px-3 rounded-2xl border text-xs flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer
                      ${
                        isDurationActive
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/25 font-bold scale-[1.02]"
                          : "bg-input/60 border-surface text-main hover:border-primary/50 hover:bg-input font-medium"
                      }
                    `}
                  >
                    <span className="font-headline tracking-wide text-xs sm:text-sm">
                      {opt.label}
                    </span>
                    <span
                      className={`text-[9px] uppercase tracking-wider font-bold ${
                        isDurationActive ? "text-white/80" : "text-muted"
                      }`}
                    >
                      {opt.sessions} Sesi
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Header Slot Pills */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <MaterialIcon name="schedule" className="text-primary text-base" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-main font-headline">
                Pilih Jam Sesi ({formattedSelectedDate})
              </h3>
            </div>
            <span className="text-[10px] sm:text-xs text-muted font-medium">
              Durasi {selectedDuration} menit
            </span>
          </div>

          {/* Deretan Slot Pills Dinamis */}
          {isSlotsFetching ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[4.5rem] rounded-2xl bg-input/40 border border-surface animate-pulse"
                />
              ))}
            </div>
          ) : dynamicSlotPills.length === 0 ? (
            <div className="bg-card border border-surface rounded-2xl p-5 text-center text-muted text-xs">
              Tidak ada rentang jam praktik konsultan yang cukup untuk durasi {selectedDuration} menit pada tanggal ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {dynamicSlotPills.map((slot) => {
                const isSlotSelected =
                  startTime === slot.start && endTime === slot.end;
                const isBooked = slot.status === "booked";
                const isDisabled = slot.status === "disabled" || isBooked;

                return (
                  <button
                    key={slot.start}
                    type="button"
                    data-testid={`time-slot-${slot.start}`}
                    disabled={isDisabled}
                    onClick={() => {
                      onStartTimeChange?.(slot.start);
                      onEndTimeChange?.(slot.end);
                    }}
                    className={`
                      relative flex flex-col items-center justify-center py-3 px-3 rounded-2xl border text-xs transition-all duration-300
                      ${
                        isSlotSelected
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/25 font-bold scale-[1.02]"
                          : isBooked
                            ? "bg-danger/5 border-danger/20 text-muted/50 cursor-not-allowed"
                            : isDisabled
                              ? "opacity-30 bg-transparent border-dashed border-surface text-muted cursor-not-allowed"
                              : "bg-input/60 border-surface text-main hover:border-primary/50 hover:bg-input cursor-pointer font-semibold"
                      }
                    `}
                  >
                    <span className="font-headline tracking-wide text-xs sm:text-sm">
                      {slot.label}
                    </span>
                    <span
                      className={`text-[9px] mt-0.5 uppercase tracking-wider font-bold ${
                        isSlotSelected
                          ? "text-white/80"
                          : isBooked
                            ? "text-danger"
                            : "text-emerald-500"
                      }`}
                    >
                      {isBooked
                        ? "Terisi"
                        : isSlotSelected
                          ? "Dipilih"
                          : `${selectedDuration / 30} Sesi · Tersedia`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Rangkuman Jam Konsultasi Terpilih (Bersih & Rapi tanpa dropdown bertingkat) */}
          <div className="bg-card border border-surface rounded-2xl px-5 py-4 flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-2">
              <MaterialIcon name="schedule" className="text-primary text-base" />
              <span className="text-xs text-muted font-bold uppercase tracking-wider">
                Jam Konsultasi Terpilih:
              </span>
            </div>
            <span
              data-testid="selected-time-display"
              className="text-xs sm:text-sm font-extrabold text-main font-headline tracking-wide"
            >
              {startTime && endTime
                ? `${startTime} - ${endTime} (${selectedDuration} Menit)`
                : "--:--"}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}