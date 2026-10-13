"use client";

import React from "react";
import { MaterialIcon } from "@/components/ui/Icons";

const WEEK_LABELS = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

/**
 * Komponen Kalender Bersama (Unified Reusable Calendar)
 * Digunakan secara seragam di:
 * 1. Jadwal Konsultan (/schedule)
 * 2. Date Picker Klien (/explore/[id] & /bursa/post)
 */
export function Calendar({
  days = [],
  selectedDay = "",
  onSelectDay,
  monthLabel = "",
  onPrev,
  onNext,
  isPrevDisabled = false,
  isNextDisabled = false,
  testId = "monthly-calendar",
}) {
  return (
    <section
      className="w-full bg-card/70 border border-surface rounded-[2.5rem] p-6 sm:p-8 backdrop-blur-xl shadow-soft transition-colors duration-500"
      data-testid={testId}
    >
      {/* 1. Header Kalender: Navigasi Bulan & Tahun */}
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <button
          type="button"
          disabled={isPrevDisabled}
          onClick={onPrev}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-input/70 border border-surface flex items-center justify-center text-muted hover:text-main hover:border-primary/50 hover:bg-surface active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Bulan Sebelumnya"
          aria-label="Bulan Sebelumnya"
        >
          <MaterialIcon
            name="chevron_left"
            className="text-xl sm:text-2xl text-main pointer-events-none"
          />
        </button>

        <div className="flex items-center gap-3">
          <div className="text-primary bg-primary/10 p-2 sm:p-2.5 rounded-xl flex items-center justify-center">
            <MaterialIcon
              name="calendar_month"
              className="text-xl sm:text-2xl"
            />
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-main tracking-tight font-headline uppercase">
            {monthLabel}
          </h2>
        </div>

        <button
          type="button"
          disabled={isNextDisabled}
          onClick={onNext}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-input/70 border border-surface flex items-center justify-center text-muted hover:text-main hover:border-primary/50 hover:bg-surface active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
          title="Bulan Berikutnya"
          aria-label="Bulan Berikutnya"
        >
          <MaterialIcon
            name="chevron_right"
            className="text-xl sm:text-2xl text-main pointer-events-none"
          />
        </button>
      </div>

      {/* 2. Barisan Nama Hari (Dimulai dari Minggu sesuai standar kalender bulanan) */}
      <div className="grid grid-cols-7 mb-4 text-center">
        {WEEK_LABELS.map((label) => (
          <span
            key={label}
            className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-muted/60 py-1"
          >
            {label}
          </span>
        ))}
      </div>

      {/* 3. Grid Tanggal Bulat (Identik di seluruh halaman) */}
      <div className="grid grid-cols-7 gap-y-2 sm:gap-y-3">
        {days.map((day, index) => {
          if (!day || day.isPadding || (!day.date && day.date !== 0)) {
            return (
              <div
                key={day?.key || `empty-${index}`}
                className="w-10 h-10 sm:w-12 sm:h-12 mx-auto"
              />
            );
          }

          const dayNumber = day.date || day.dayNumber;
          const fullDate = day.fullDate;
          const isSelected = selectedDay === fullDate;

          const isAvailable =
            day.isAvailableDay !== undefined
              ? day.isAvailableDay
              : !day.isDisabled;

          const isDisabled = day.isDisabled || !isAvailable;
          const hasDot = day.hasEvent || day.isAvailableDay;

          return (
            <div
              key={day.key || fullDate || `day-${dayNumber}`}
              className="flex flex-col items-center justify-center py-1"
            >
              <button
                type="button"
                data-testid="date-slot"
                disabled={isDisabled}
                onClick={() => onSelectDay?.(fullDate)}
                className={`
                  relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex flex-col items-center justify-center transition-all duration-300 mx-auto
                  ${
                    isSelected
                      ? "bg-primary text-white border-2 border-primary shadow-lg shadow-primary/30 scale-110 z-10 font-bold"
                      : isAvailable && !isDisabled
                        ? "bg-input/60 border border-surface/70 text-main hover:border-primary/50 hover:bg-surface cursor-pointer font-semibold"
                        : "opacity-20 bg-transparent border border-dashed border-surface/40 text-muted cursor-not-allowed"
                  }
                `}
              >
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    isSelected ? "text-white" : "text-main"
                  }`}
                >
                  {dayNumber}
                </span>

                {/* Indikator Titik (Dot) */}
                {hasDot && !isSelected && (
                  <span
                    className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--primary-rgb),0.8)]"
                    title="Ada jadwal"
                  />
                )}

                {hasDot && isSelected && (
                  <span
                    className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"
                    title="Jadwal dipilih"
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Calendar;
