"use client";

import { useState, useMemo } from "react";
import BottomNav from "@/components/layout/BottomNav";
import WeeklyCalendar from "@/components/schedule/WeeklyCalendar";
import AvailabilityToggle from "@/components/schedule/AvailabilityToggle";
import TimeSlotList from "@/components/schedule/TimeSlotList";

// Kita bikin tanggal hari ini dan besok otomatis menyesuaikan kalender
const today = new Date().getDate();
const tomorrow = new Date(Date.now() + 86400000).getDate();

// DATABASE MINI: Pisahkan jadwal berdasarkan tanggal
const DUMMY_DB = {
  [today]: [
    { id: "1", time: "08:00 - 09:00", status: "off" },
    { id: "2", time: "09:00 - 10:00", status: "available" },
    { id: "3", time: "10:00 - 11:00", status: "booked", client: "Bapak Ahmad" },
    { id: "4", time: "11:00 - 12:00", status: "booked", client: "Ibu Siti (Gugat Cerai)" },
    { id: "5", time: "13:00 - 14:00", status: "available" },
  ],
  [tomorrow]: [
    { id: "6", time: "09:00 - 10:30", status: "booked", client: "Bapak Budi (Konsultasi Bisnis)" },
    { id: "7", time: "10:30 - 12:00", status: "available" },
    { id: "8", time: "13:00 - 15:00", status: "off" },
  ]
};

export default function SchedulePage() {
  const [isAvailable, setIsAvailable] = useState(true);
  
  // State Utama: Simpan seluruh database mini
  const [allSlots, setAllSlots] = useState(DUMMY_DB);

  // --- LOGIKA KALENDER ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(today);

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
  // -----------------------


  // AMBIL JADWAL HANYA UNTUK HARI YANG DIPILIH
  // Kalau di tanggal itu belum ada jadwal, tampilkan array kosong []
  const currentSlots = allSlots[selectedDay] || [];


  // FUNGSI UBAH STATUS
  const handleSlotChange = (id, newStatus) => {
    setAllSlots((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).map((s) => 
        s.id === id ? { ...s, status: newStatus } : s
      )
    }));
  };

  // FUNGSI TAMBAH JADWAL BARU (DENGAN AUTO-SORT WAKTU)
  const handleAddSlot = (newSlotData) => {
    const newId = Date.now().toString();
    setAllSlots((prev) => {
      const daySlots = prev[selectedDay] || [];
      // Tambah slot baru, lalu urutkan (sort) berdasarkan jam dari pagi ke sore
      const updatedDaySlots = [...daySlots, { id: newId, ...newSlotData }].sort(
        (a, b) => a.time.localeCompare(b.time)
      );
      
      return {
        ...prev,
        [selectedDay]: updatedDaySlots
      };
    });
  };

  // FUNGSI HAPUS JADWAL
  const handleDeleteSlot = (id) => {
    setAllSlots((prev) => ({
      ...prev,
      [selectedDay]: (prev[selectedDay] || []).filter(s => s.id !== id)
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
          onSelectDay={setSelectedDay} // Saat kalender diklik, selectedDay berubah
          monthLabel={monthLabel}
          onPrev={handlePrevWeek}
          onNext={handleNextWeek}
        />
        <AvailabilityToggle isAvailable={isAvailable} onChange={setIsAvailable} />
        
        {/* Lempar currentSlots (bukan slots global) ke komponen List */}
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