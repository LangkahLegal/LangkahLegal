"use client";

import { Button } from "@/components/ui";

export default function WeeklyCalendar({ days, selectedDay, onSelectDay, monthLabel, onPrev, onNext }) {
  return (
    <section>
      <div className="bg-[#131125] rounded-3xl p-6 shadow-2xl border border-white/5">
        
        {/* Navigasi Bulan */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {monthLabel}
          </h2>
          <div className="flex gap-2">
            <Button 
              variant="icon"
              onClick={onPrev}
              className="!w-8 !h-8 !rounded-full bg-white/5 text-[#e8e2fc] hover:bg-[#6f59fe]"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </Button>
            <Button 
              variant="icon"
              onClick={onNext}
              className="!w-8 !h-8 !rounded-full bg-white/5 text-[#e8e2fc] hover:bg-[#6f59fe]"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Button>
          </div>
        </div>

        {/* Barisan Hari */}
        <div className="flex justify-between items-end">
          {days.map((day) => {
            const isSelected = selectedDay === day.date;
            
            return (
              <div key={day.date} className="flex flex-col items-center gap-2">
                {/* Nama Hari */}
                <span className={`text-xs font-bold uppercase tracking-widest ${isSelected ? 'text-[#ada3ff]' : 'text-[#48455a]'}`}>
                  {day.label}
                </span>
                
                {/* Tombol Tanggal */}
                <Button
                  onClick={() => onSelectDay(day.date)}
                  // Kita pakai variant primary hanya saat isSelected aktif
                  variant={isSelected ? "primary" : "ghost"}
                  className={`!w-10 !h-14 !rounded-2xl flex-col !p-0 transition-all duration-300 ${
                    isSelected
                      ? "shadow-[0_8px_20px_rgba(111,89,254,0.3)] scale-105"
                      : day.isWeekend
                      ? "text-[#ff6e84]/60 hover:text-[#ff6e84] !bg-transparent"
                      : "text-[#aca8c1] hover:text-[#e8e2fc] !bg-transparent"
                  }`}
                >
                  <span className={`text-lg ${isSelected ? 'font-black' : 'font-bold'}`}>
                    {day.date}
                  </span>
                  
                  {/* Indikator Titik */}
                  {isSelected && (
                    <div className="w-1 h-1 bg-white rounded-full mt-1 animate-pulse" />
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