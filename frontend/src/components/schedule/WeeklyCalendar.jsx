"use client";

export default function WeeklyCalendar({ days, selectedDay, onSelectDay, monthLabel, onPrev, onNext }) {
  return (
    <section>
      <div className="bg-[#261E58] rounded-[2rem] p-6 shadow-2xl">
        {/* Month navigation */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-[#e8e2fc] font-['Urbanist',sans-serif]">
            {monthLabel}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={onPrev}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2c2945]/50 text-[#e8e2fc] hover:bg-[#6D57FC] hover:shadow-lg transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button 
              onClick={onNext}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2c2945]/50 text-[#e8e2fc] hover:bg-[#6D57FC] hover:shadow-lg transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Days row */}
        <div className="flex justify-between">
          {days.map((day) => {
            const isSelected = selectedDay === day.date;
            return (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-medium text-[#aca8c1] uppercase tracking-wider">
                  {day.label}
                </span>
                <button
                  onClick={() => onSelectDay(day.date)}
                  className={`w-10 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[#6D57FC] text-white shadow-[0_0_20px_rgba(109,87,252,0.4)]"
                      : day.isWeekend
                      ? "text-[#ff6e84] hover:bg-[#a70138]/20"
                      : "text-[#e8e2fc] hover:bg-[#2c2945]"
                  }`}
                >
                  <span className="text-lg font-bold">{day.date}</span>
                  {isSelected && (
                    <div className="w-1 h-1 bg-white rounded-full mt-1" />
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