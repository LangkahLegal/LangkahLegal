"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/layout/BottomNav";
import Sidebar from "@/components/layout/Sidebar";
import MonthlyCalendar from "@/components/schedule/MonthlyCalendar";
import AvailabilityToggle from "@/components/schedule/AvailabilityToggle";
import AddSlotModal from "@/components/schedule/AddSlotModal";
import PageHeader from "@/components/layout/PageHeader";

import { scheduleService } from "@/services/schedule.service";
import { consultantService } from "@/services/consultant.service";

// Helper format tanggal YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 1. DATA FETCHING ---
  const { data: scheduleData = [] } = useQuery({
    queryKey: ["mySchedules"],
    queryFn: scheduleService.getMySchedules,
  });

  const { data: stats } = useQuery({
    queryKey: ["consultantStats"],
    queryFn: consultantService.getDashboardStats,
  });

  // --- 2. MUTATIONS ---
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["mySchedules"] });

  // Mutasi untuk Create (POST)
  const createMutation = useMutation({
    mutationFn: (data) => scheduleService.addSchedule(data),
    onSuccess: () => {
      invalidate();
      setIsModalOpen(false);
      alert("Jadwal baru berhasil ditambahkan!");
    },
    onError: () =>
      alert("Gagal menambah jadwal. Pastikan jam tidak bertabrakan."),
  });

  // Mutasi untuk Update (PUT)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => scheduleService.updateSchedule(id, data),
    onSuccess: () => {
      invalidate();
      setIsModalOpen(false);
      alert("Jadwal berhasil diperbarui!");
    },
    onError: () =>
      alert("Gagal memperbarui jadwal. Slot mungkin sudah dipesan klien."),
  });

  // --- 3. DERIVED STATE ---
  const activeDateString = useMemo(
    () => formatDate(selectedDate),
    [selectedDate],
  );

  const allSlotsGrouped = useMemo(() => {
    const grouped = {};
    scheduleData.forEach((slot) => {
      if (!grouped[slot.tanggal]) grouped[slot.tanggal] = [];
      grouped[slot.tanggal].push(slot);
    });
    return grouped;
  }, [scheduleData]);

  // Cari data eksisting untuk tanggal yang dipilih
  const currentActiveSlot = useMemo(() => {
    const slots = allSlotsGrouped[activeDateString];
    return slots && slots.length > 0 ? slots[0] : null;
  }, [allSlotsGrouped, activeDateString]);

  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ date: null });
    for (let d = 1; d <= totalDays; d++) {
      const fullDate = formatDate(new Date(year, month, d));
      days.push({ date: d, fullDate, hasEvent: !!allSlotsGrouped[fullDate] });
    }
    return days;
  }, [selectedDate, allSlotsGrouped]);

  // --- 4. HANDLERS ---
  const handleSave = (formData) => {
    const [start, end] = formData.time.split(" - ");

    // Siapkan Payload sesuai kebutuhan API
    const payload = {
      tanggal: activeDateString,
      jam_mulai: `${start}:00`,
      jam_selesai: `${end}:00`,
      status_tersedia: formData.status === "available",
    };

    // CEK: Apakah ini UPDATE atau CREATE?
    if (currentActiveSlot) {
      // Jalankan PUT jika ID jadwal sudah ada
      updateMutation.mutate({
        id: currentActiveSlot.id_jadwal,
        data: payload,
      });
    } else {
      // Jalankan POST jika belum ada jadwal di tanggal ini
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="bg-[#0e0c1e] text-[#e8e2fc] min-h-screen flex overflow-hidden font-['Inter',sans-serif]">
      <Sidebar role="konsultan" />

      <div className="flex-1 flex flex-col relative min-w-0 w-full ml-0 lg:ml-64 transition-all duration-300">
        <PageHeader title="Kelola Jadwal" backHref="/dashboard/consultant" />

        <main className="flex-1 overflow-y-auto px-6 pt-6 w-full">
          <div className="max-w-2xl mx-auto w-full space-y-10 pb-32">
            <AvailabilityToggle
              isAvailable={stats?.is_active ?? true}
              onChange={(s) =>
                queryClient.setQueryData(["consultantStats"], (old) => ({
                  ...old,
                  is_active: s,
                }))
              }
            />

            <MonthlyCalendar
              days={calendarDays}
              selectedDay={activeDateString}
              onSelectDay={(date) => {
                setSelectedDate(new Date(date));
                setIsModalOpen(true);
              }}
              monthLabel={selectedDate.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
              onPrev={() =>
                setSelectedDate(
                  new Date(
                    new Date(selectedDate).setMonth(
                      selectedDate.getMonth() - 1,
                    ),
                  ),
                )
              }
              onNext={() =>
                setSelectedDate(
                  new Date(
                    new Date(selectedDate).setMonth(
                      selectedDate.getMonth() + 1,
                    ),
                  ),
                )
              }
            />
          </div>
        </main>

        {/* MODAL HANDLE CREATE & UPDATE */}
        <AddSlotModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialStart={currentActiveSlot?.jam_mulai.substring(0, 5) || "00:00"}
          initialEnd={currentActiveSlot?.jam_selesai.substring(0, 5) || "00:00"}
          isNewData={!currentActiveSlot}
          isBooked={!!currentActiveSlot?.nama_klien}
        />

        <div className="lg:hidden">
          <BottomNav role="konsultan" />
        </div>
      </div>
    </div>
  );
}
