"use client";

import { useState, useMemo, useEffect } from "react";
import BottomNav from "@/components/layout/BottomNav";
import WeeklyCalendar from "@/components/schedule/WeeklyCalendar";
import AvailabilityToggle from "@/components/schedule/AvailabilityToggle";
import TimeSlotList from "@/components/schedule/TimeSlotList";
import { scheduleService } from "@/services/schedule.service"; // Sesuaikan path import ini

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. FETCH DATA DARI BACKEND ---
  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Harus login dulu");
        return;
      }

      setIsLoading(true);
      const data = await scheduleService.getSchedules();
      
      // Ubah data flat array dari Backend menjadi object berdasarkan tanggal
      // Contoh: { "2026-04-07": [{id_jadwal: 1, ...}], "2026-04-08": [...] }
      const groupedSlots = {};
      data.forEach((slot) => {
        if (!groupedSlots[slot.tanggal]) {
          groupedSlots[slot.tanggal] = [];
        }
        groupedSlots[slot.tanggal].push(slot);
      });
      
      setAllSlots(groupedSlots);
    } catch (error) {
      console.error("Gagal mengambil jadwal:", error);
      alert("Gagal memuat jadwal. Pastikan Anda sudah login.");
    } finally {
      setIsLoading(false);
    }
  };

  // Panggil fetchSchedules saat halaman pertama kali dirender
  useEffect(() => {
    fetchSchedules();
  }, []);

  // --- 2. LOGIC KALENDER (UI) ---
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

  // --- 3. PERSIAPAN DATA UNTUK KOMPONEN ANAK ---
  const rawSlots = allSlots[activeDateString] || [];
  
  const currentSlots = rawSlots.map(slot => {
    let status = slot.status_tersedia ? "available" : "off";
    if (slot.nama_klien) status = "booked"; // Ubah status jika ada klien yang booking

    return {
      id: String(slot.id_jadwal),
      time: `${slot.jam_mulai.substring(0, 5)} - ${slot.jam_selesai.substring(0, 5)}`,
      status: status,
      client: slot.nama_klien
    };
  });

  // --- 4. HANDLERS CRUD KE BACKEND ---

  // Handle toggle Aktif Menerima Konsultasi
  const handleGlobalAvailability = async (newStatus) => {
    try {
      setIsAvailable(newStatus); // Optimistic update UI
      await scheduleService.toggleGlobalActive(newStatus);
    } catch (error) {
      setIsAvailable(!newStatus); // Rollback jika gagal
      alert("Gagal mengubah status ketersediaan global.");
    }
  };

  // Handle nambah jadwal baru
  const handleAddSlot = async (newSlotData) => {
    try {
      const [jam_mulai, jam_selesai] = newSlotData.time.split(" - ");
      
      await scheduleService.addSchedule({
        tanggal: activeDateString,
        jam_mulai: `${jam_mulai}:00`,
        jam_selesai: `${jam_selesai}:00`
      });

      // Refresh data dari backend setelah berhasil nambah
      fetchSchedules();
    } catch (error) {
      alert("Gagal menambahkan jadwal baru.");
    }
  };

  // Handle ubah status jadwal (tersedia / tutup) via menu kecil
  const handleSlotChange = async (id, newStatusString) => {
    try {
      const isTersedia = newStatusString === "available";
      await scheduleService.toggleScheduleSlot(id, isTersedia); 
      fetchSchedules();
    } catch (error) {
      alert("Gagal memperbarui status slot.");
    }
  };

  // Handle update jam dan status via Modal Edit
  const handleUpdateSlotDetail = async (id, newTimeRange, newStatusString) => {
    try {
      const [jam_mulai, jam_selesai] = newTimeRange.split(" - ");
      const isTersedia = newStatusString === "available";

      await scheduleService.updateSchedule(id, {
        jam_mulai: `${jam_mulai}:00`,
        jam_selesai: `${jam_selesai}:00`,
        status_tersedia: isTersedia
      });

      fetchSchedules();
    } catch (error) {
      alert("Gagal menyimpan perubahan jadwal.");
    }
  };

  // Handle hapus jadwal
  const handleDeleteSlot = async (id) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;
    
    try {
      await scheduleService.deleteSchedule(id);
      fetchSchedules();
    } catch (error) {
      alert("Gagal menghapus jadwal.");
    }
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
        <AvailabilityToggle isAvailable={isAvailable} onChange={handleGlobalAvailability} />
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-[#6D57FC] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <TimeSlotList 
            slots={currentSlots} 
            onSlotChange={handleSlotChange} 
            onUpdateSlot={handleUpdateSlotDetail} // Pastikan TimeSlotList kamu menerima prop ini untuk EditModal
            onAddSlot={handleAddSlot}
            onDeleteSlot={handleDeleteSlot}
          />
        )}
      </main>

      <BottomNav role={'konsultan'} />
    </div>
  );
}