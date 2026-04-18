"use client";

import { Button } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";

export default function FullCalendar({
  days, // Array berisi { date: 1, label: 'Min', fullDate: '2023-10-01', hasEvent: true }
  selectedDay,
  onSelectDay,
  monthLabel,
  onPrev,
  onNext,
}) {
  const weekLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <section className="w-full max-w-md mx-auto">
      <div className="bg-[#131125]/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
        {/* Header: Ikon + Bulan + Navigasi */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="text-[#6f59fe] bg-[#6f59fe]/10 p-2 rounded-xl">
              <MaterialIcon name="calendar_month" className="text-2xl" />
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              {monthLabel}
            </h2>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onPrev}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1f1d35] text-[#aca8c1] hover:bg-[#6f59fe] hover:text-white transition-all border border-white/5"
            >
              <MaterialIcon name="chevron_left" />
            </button>
            <button
              onClick={onNext}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1f1d35] text-[#aca8c1] hover:bg-[#6f59fe] hover:text-white transition-all border border-white/5"
            >
              <MaterialIcon name="chevron_right" />
            </button>
          </div>
        </div>

        {/* Barisan Nama Hari */}
        <div className="grid grid-cols-7 mb-4">
          {weekLabels.map((label) => (
            <span
              key={label}
              className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#48455a]"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Grid Tanggal */}
        <div className="grid grid-cols-7 gap-y-2">
          {days.map((day, index) => {
            // Asumsi: Jika day.date adalah null, itu adalah padding awal bulan
            if (!day.date) return <div key={`empty-${index}`} />;

            const isSelected = selectedDay === day.fullDate;

            return (
              <div
                key={day.fullDate}
                className="flex flex-col items-center justify-center py-2"
              >
                <button
                  onClick={() => onSelectDay(day.fullDate)}
                  className={`
                    relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 font-bold text-sm
                    ${
                      isSelected
                        ? "bg-[#6f59fe] text-white shadow-[0_10px_25px_rgba(111,89,254,0.4)] scale-110 z-10"
                        : "text-[#aca8c1] hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  {day.date}

                  {/* Indikator Titik (Event) */}
                  {day.hasEvent && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 bg-[#6f59fe] rounded-full" />
                  )}

                  {isSelected && (
                    <div className="absolute bottom-1.5 w-1 h-1 bg-white/50 rounded-full animate-pulse" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
