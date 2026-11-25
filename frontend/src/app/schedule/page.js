"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import MonthlyCalendar from "@/components/schedule/MonthlyCalendar";
import AvailabilityToggle from "@/components/schedule/AvailabilityToggle";
import SlotCard from "@/components/schedule/SlotCard";
import PageHeader from "@/components/layout/PageHeader";
import { MaterialIcon } from "@/components/ui/Icons";

import { scheduleService } from "@/services/schedule.service";
import { consultantService } from "@/services/consultant.service";
import { useToast } from "@/providers/FeedbackProvider";

// Helper format tanggal YYYY-MM-DD
/** Tanggal 1 pada bulan sebelum/sesudahnya, agar tanggal 29-31 tidak melompati bulan. */
const firstDayOfMonth = (date, offset) =>
  new Date(date.getFullYear(), date.getMonth() + offset, 1);

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hasPicked, setHasPicked] = useState(false);

  // --- 1. DATA FETCHING ---
  const { data: scheduleData = [], isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["mySchedules"],
    queryFn: scheduleService.getMySchedules,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["consultantStats"],
    queryFn: consultantService.getDashboardStats,
  });

  // --- 2. MUTATIONS ---
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["mySchedules"] });

  const createMutation = useMutation({
    mutationFn: (data) => scheduleService.addSchedule(data),
    onSuccess: () => {
      invalidate();
      toast.success("Jadwal baru berhasil ditambahkan!");
    },
    onError: () =>
      toast.error("Gagal menambah jadwal. Pastikan jam tidak bertabrakan."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => scheduleService.updateSchedule(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Jadwal berhasil diperbarui!");
    },
    onError: () =>
      toast.error("Gagal memperbarui jadwal. Slot mungkin sudah dipesan klien."),
  });

  // Status aktif langsung berubah di layar, lalu dikembalikan bila server menolak.
  const activeMutation = useMutation({
    mutationFn: (isActive) => scheduleService.toggleGlobalActive(isActive),
    onMutate: (isActive) => {
      const previous = queryClient.getQueryData(["consultantStats"]);
      queryClient.setQueryData(["consultantStats"], (old) => ({
        ...old,
        is_active: isActive,
      }));
      return { previous };
    },
    onError: (_error, _isActive, context) => {
      queryClient.setQueryData(["consultantStats"], context?.previous);
      toast.error("Gagal menyimpan status konsultasi.");
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["consultantStats"] }),
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

  const currentActiveSlot = useMemo(() => {
    const slots = allSlotsGrouped[activeDateString];
    return slots && slots.length > 0 ? slots[0] : null;
  }, [allSlotsGrouped, activeDateString]);

  const dateLabel = selectedDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isPastDate = activeDateString < formatDate(new Date());

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
    if (end <= start) {
      toast.error("Jam selesai harus setelah jam mulai.");
      return;
    }
    const payload = {
      tanggal: activeDateString,
      jam_mulai: `${start}:00`,
      jam_selesai: `${end}:00`,
      status_tersedia: formData.status === "available",
    };

    if (currentActiveSlot) {
      updateMutation.mutate({
        id: currentActiveSlot.id_jadwal,
        data: payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <AppShell
      role="konsultan"
      contentClassName="w-full"
    >
        <PageHeader title="Kelola Jadwal" backHref="/dashboard/consultant" />

        <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 lg:px-8 lg:py-6 pb-28 lg:pb-10 min-h-[80vh] scroll-smooth">
          <div className="w-full space-y-6 animate-fade-in">
            {isLoadingSchedules || isLoadingStats ? (
              <div className="flex flex-col items-center justify-center py-20 gap-5">
                <div className="w-13 h-13 border-[4px] border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-muted text-[10px] font-bold tracking-widest uppercase animate-pulse">
                  Memuat Jadwal...
                </p>
              </div>
            ) : (
              <>
                <AvailabilityToggle
                  isAvailable={stats?.is_active ?? true}
                  onChange={(isActive) => activeMutation.mutate(isActive)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  <MonthlyCalendar
                    days={calendarDays}
                    selectedDay={hasPicked ? activeDateString : ""}
                    onSelectDay={(date) => {
                      setSelectedDate(new Date(date));
                      setHasPicked(true);
                    }}
                    monthLabel={selectedDate.toLocaleDateString("id-ID", {
                      month: "long",
                      year: "numeric",
                    })}
                    onPrev={() => setSelectedDate(firstDayOfMonth(selectedDate, -1))}
                    onNext={() => setSelectedDate(firstDayOfMonth(selectedDate, 1))}
                  />

                  {hasPicked ? (
                    <SlotCard
                      dateLabel={dateLabel}
                      slot={currentActiveSlot}
                      isBooked={!!currentActiveSlot?.nama_klien}
                      isPastEmpty={isPastDate && !currentActiveSlot}
                      onSave={handleSave}
                      isSaving={createMutation.isPending || updateMutation.isPending}
                    />
                  ) : (
                    <div className="bg-card border border-dashed border-surface rounded-2xl p-4 text-center text-muted text-xs flex flex-col items-center justify-center gap-2 shadow-soft">
                      <MaterialIcon name="touch_app" className="text-2xl text-primary/60" />
                      <p className="font-medium">
                        Pilih salah satu tanggal untuk menambah atau mengubah jadwal.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
    </AppShell>
  );
}
