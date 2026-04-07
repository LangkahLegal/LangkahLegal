"use client";

import { useState, useMemo, useEffect } from "react";
import BottomNav from "@/components/layout/BottomNav";
import WeeklyCalendar from "@/components/schedule/WeeklyCalendar";
import AvailabilityToggle from "@/components/schedule/AvailabilityToggle";
import TimeSlotList from "@/components/schedule/TimeSlotList";

import { scheduleService } from "@/services/schedule.service";
import { consultantService } from "@/services/consultant.service";

// Helper untuk format YYYY-MM-DD tanpa masalah timezone
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function SchedulePage() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [allSlots, setAllSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date()); // Simpan full Date object, bukan cuma angka
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. FETCH DATA DARI BACKEND ---
  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Ambil jadwal dan stats (untuk is_active global) secara paralel
      const [scheduleData, stats] = await Promise.all([
        scheduleService.getMySchedules(),
        consultantService.getDashboardStats(),
      ]);

      // Set status ketersediaan global dari backend
      setIsAvailable(stats.is_active ?? true);

      // Grouping data jadwal berdasarkan tanggal
      const groupedSlots = {};
      scheduleData.forEach((slot) => {
        if (!groupedSlots[slot.tanggal]) {
          groupedSlots[slot.tanggal] = [];
        }
        groupedSlots[slot.tanggal].push(slot);
      });

      setAllSlots(groupedSlots);
    } catch (error) {
      console.error("Gagal memuat data jadwal:", error);
      alert("Terjadi kesalahan saat memuat jadwal.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // --- 2. LOGIC KALENDER ---

  // Format tanggal aktif untuk filter slots
  const activeDateString = useMemo(
    () => formatDate(selectedDate),
    [selectedDate],
  );

  // Generate 7 hari dalam seminggu berdasarkan selectedDate
  const weekDays = useMemo(() => {
    const days = [];
    const labels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    // Cari hari Minggu terdekat sebagai awal minggu
    const startOfWeek = new Date(selectedDate);
    const dayIndex = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayIndex);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        label: labels[date.getDay()],
        date: date.getDate(),
        fullDate: new Date(date), // Simpan objek tanggal penuh
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    return days;
  }, [selectedDate]);

  const monthLabel = selectedDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  // --- 3. MAPPING DATA UNTUK UI ---
  const currentSlots = useMemo(() => {
    const rawSlots = allSlots[activeDateString] || [];
    return rawSlots.map((slot) => {
      let status = slot.status_tersedia ? "available" : "off";
      if (slot.nama_klien) status = "booked";

      return {
        id: String(slot.id_jadwal),
        time: `${slot.jam_mulai.substring(0, 5)} - ${slot.jam_selesai.substring(0, 5)}`,
        status: status,
        client: slot.nama_klien,
      };
    });
  }, [allSlots, activeDateString]);

  // --- 4. HANDLERS CRUD ---

  const handleGlobalAvailability = async (newStatus) => {
    try {
      setIsAvailable(newStatus);
      await scheduleService.toggleGlobalActive(newStatus);
    } catch (error) {
      setIsAvailable(!newStatus);
      alert("Gagal mengubah ketersediaan global.");
    }
  };

  const handleAddSlot = async (newSlotData) => {
    try {
      const [jam_mulai, jam_selesai] = newSlotData.time.split(" - ");
      await scheduleService.addSchedule({
        tanggal: activeDateString,
        jam_mulai: `${jam_mulai}:00`,
        jam_selesai: `${jam_selesai}:00`,
      });
      loadInitialData(); // Refresh
    } catch (error) {
      alert("Gagal menambah slot. Pastikan format jam benar.");
    }
  };

  const handleSlotChange = async (id, newStatusString) => {
    try {
      const isTersedia = newStatusString === "available";
      await scheduleService.toggleScheduleSlot(id, isTersedia);
      loadInitialData();
    } catch (error) {
      alert("Gagal update status slot.");
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm("Hapus slot ini?")) return;
    try {
      await scheduleService.deleteSchedule(id);
      loadInitialData();
    } catch (error) {
      alert("Slot tidak bisa dihapus (mungkin sudah dipesan).");
    }
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex flex-col overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-[-20%] left-[-10%] w-[80%] h-[60%] bg-[#6D57FC]/10 blur-[120px] -z-10 rounded-full" />

      <header className="bg-[#0e0c1e]/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <div className="px-6 py-5 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#ada3ff]">
            calendar_month
          </span>
          <h1 className="text-xl font-bold font-['Urbanist',sans-serif]">
            Manajemen Jadwal
          </h1>
        </div>
      </header>

      <main className="flex-grow px-6 pb-32 pt-6 space-y-8 max-w-4xl mx-auto w-full">
        <WeeklyCalendar
          days={weekDays}
          selectedDay={selectedDate.getDate()}
          onSelectDay={(dayNum) => {
            // Logic agar pilih hari tetap di minggu yang sama
            const targetDate = weekDays.find((d) => d.date === dayNum).fullDate;
            setSelectedDate(targetDate);
          }}
          monthLabel={monthLabel}
          onPrev={handlePrevWeek}
          onNext={handleNextWeek}
        />

        <AvailabilityToggle
          isAvailable={isAvailable}
          onChange={handleGlobalAvailability}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#6D57FC] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#ada3ff] animate-pulse">
              Sinkronisasi Kalender...
            </p>
          </div>
        ) : (
          <TimeSlotList
            slots={currentSlots}
            onSlotChange={handleSlotChange}
            onAddSlot={handleAddSlot}
            onDeleteSlot={handleDeleteSlot}
          />
        )}
      </main>

      <BottomNav role="konsultan" />
    </div>
  );
}
