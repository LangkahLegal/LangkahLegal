"use client";

import { useState, useMemo } from "react";
import BottomNav from "@/components/layout/BottomNav";
import WeeklyCalendar from "@/components/schedule/WeeklyCalendar";
import AvailabilityToggle from "@/components/schedule/AvailabilityToggle";
import TimeSlotList from "@/components/schedule/TimeSlotList";

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayDate = formatDate(new Date());
const tomorrowDate = formatDate(new Date(Date.now() + 86400000));

const DUMMY_DB = {
  [todayDate]: [
    { id_jadwal: 1, id_konsultan: 1, tanggal: todayDate, jam_mulai: "08:00:00", jam_selesai: "09:00:00", status_tersedia: false },
    { id_jadwal: 2, id_konsultan: 1, tanggal: todayDate, jam_mulai: "09:00:00", jam_selesai: "10:00:00", status_tersedia: true },
    { id_jadwal: 3, id_konsultan: 1, tanggal: todayDate, jam_mulai: "13:00:00", jam_selesai: "14:00:00", status_tersedia: true },
  ],
  [tomorrowDate]: [
    { id_jadwal: 4, id_konsultan: 1, tanggal: tomorrowDate, jam_mulai: "10:30:00", jam_selesai: "12:00:00", status_tersedia: true },
    { id_jadwal: 5, id_konsultan: 1, tanggal: tomorrowDate, jam_mulai: "13:00:00", jam_selesai: "15:00:00", status_tersedia: false },
  ]
};

export default function SchedulePage() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [allSlots, setAllSlots] = useState(DUMMY_DB);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const activeDateString = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(selectedDay);
    return formatDate(d);
  }, [currentDate, selectedDay]);

  const weekDays = useMemo(() => {
    const days = [];
    const labels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        label: labels[date.getDay()],
        date: date.getDate(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    return days;
  }, [currentDate]);

  const monthLabel = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  
  const handlePrevWeek = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  const handleNextWeek = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));

  const rawSlots = allSlots[activeDateString] || [];
  
  const currentSlots = rawSlots.map(slot => ({
    id: String(slot.id_jadwal),
    time: `${slot.jam_mulai.substring(0, 5)} - ${slot.jam_selesai.substring(0, 5)}`,
    status: slot.status_tersedia ? "available" : "off"
  }));

  const handleSlotChange = (id, newStatus) => {
    setAllSlots((prev) => ({
      ...prev,
      [activeDateString]: (prev[activeDateString] || []).map((s) => 
        String(s.id_jadwal) === String(id) ? { ...s, status_tersedia: newStatus === "available" } : s
      )
    }));
  };

  const handleAddSlot = (newSlotData) => {
    const newId = Date.now();
    const [jam_mulai, jam_selesai] = newSlotData.time.split(" - ");
    
    setAllSlots((prev) => {
      const daySlots = prev[activeDateString] || [];
      const updatedDaySlots = [...daySlots, { 
        id_jadwal: newId, 
        id_konsultan: 1,
        tanggal: activeDateString,
        jam_mulai: `${jam_mulai}:00`,
        jam_selesai: `${jam_selesai}:00`,
        status_tersedia: true
      }].sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
      
      return {
        ...prev,
        [activeDateString]: updatedDaySlots
      };
    });
  };

  const handleDeleteSlot = (id) => {
    setAllSlots((prev) => ({
      ...prev,
      [activeDateString]: (prev[activeDateString] || []).filter(s => String(s.id_jadwal) !== String(id))
    }));
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col font-['Inter',sans-serif]">
      <div className="fixed top-[-20%] left-[-10%] w-[80%] h-[60%] bg-[#6D57FC]/10 blur-[120px] -z-10 pointer-events-none rounded-full" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-[#ada3ff]/5 blur-[100px] -z-10 pointer-events-none rounded-full" />

      <header className="bg-[#0e0c1e] sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ada3ff]">calendar_today</span>
            <h1 className="text-xl font-bold tracking-tight text-[#e8e2fc] font-['Urbanist',sans-serif]">Kelola Jadwal</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow px-6 pb-32 pt-4 space-y-8">
        <WeeklyCalendar
          days={weekDays}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          monthLabel={monthLabel}
          onPrev={handlePrevWeek}
          onNext={handleNextWeek}
        />
        <AvailabilityToggle isAvailable={isAvailable} onChange={setIsAvailable} />
        
        <TimeSlotList 
          slots={currentSlots} 
          onSlotChange={handleSlotChange} 
          onAddSlot={handleAddSlot}
          onDeleteSlot={handleDeleteSlot}
        />
      </main>

      <BottomNav role={'konsultan'} />
    </div>
  );
}