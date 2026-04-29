"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/Icons";

export default function FullCalendar({
  days,
  selectedDay,
  onSelectDay,
  monthLabel,
  onPrev,
  onNext,
}) {
  const weekLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <section className="w-full max-w-md mx-auto">
      {/* Container Utama: Menggunakan bg-card dan shadow-soft */}
      <div className="bg-card/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-surface shadow-soft">
        {/* Header: Ikon + Bulan + Navigasi */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="text-primary bg-primary/10 p-2 rounded-xl">
              <MaterialIcon name="calendar_month" className="text-2xl" />
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-main tracking-tight font-headline">
              {monthLabel}
            </h2>
          </div>

          <div className="flex gap-2">
            <Button
              variant="icon"
              onClick={onPrev}
              className="!w-10 !h-10 !bg-input border border-surface text-muted hover:text-primary"
            >
              <MaterialIcon name="chevron_left" />
            </Button>
            <Button
              variant="icon"
              onClick={onNext}
              className="!w-10 !h-10 !bg-input border border-surface text-muted hover:text-primary"
            >
              <MaterialIcon name="chevron_right" />
            </Button>
          </div>
        </div>

        {/* Barisan Nama Hari */}
        <div className="grid grid-cols-7 mb-4">
          {weekLabels.map((label) => (
            <span
              key={label}
              className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted/50"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Grid Tanggal */}
        <div className="grid grid-cols-7 gap-y-2">
          {days.map((day, index) => {
            if (!day.date) return <div key={`empty-${index}`} />;

            const isSelected = selectedDay === day.fullDate;

            return (
              <div
                key={day.fullDate}
                className="flex flex-col items-center justify-center py-1"
              >
                {/* Menggunakan Komponen Button untuk setiap Tanggal */}
                <Button
                  variant={isSelected ? "primary" : "ghost"}
                  onClick={() => onSelectDay(day.fullDate)}
                  className={`
                    relative !w-10 !h-10 sm:!w-12 sm:!h-12 !rounded-2xl !p-0 transition-all duration-300
                    ${isSelected ? "scale-110 z-10 shadow-soft" : "text-muted hover:text-main"}
                  `}
                >
                  <span className="text-sm font-bold">{day.date}</span>

                  {/* Indikator Titik (Event) */}
                  {day.hasEvent && !isSelected && (
                    <div className="absolute bottom-2 w-1 h-1 bg-primary rounded-full" />
                  )}

                  {/* Indikator Aktif (Dot Putih di dalam Button Primary) */}
                  {isSelected && (
                    <div className="absolute bottom-2 w-1 h-1 bg-white/50 rounded-full animate-pulse" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
