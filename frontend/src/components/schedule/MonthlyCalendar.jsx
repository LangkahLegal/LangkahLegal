"use client";

import React from "react";
import { Calendar } from "@/components/ui/Calendar";

/**
 * Adapter MonthlyCalendar untuk halaman kelola jadwal konsultan.
 * Menggunakan komponen bersama Calendar dengan konfigurasi mode="consultant".
 */
export default function MonthlyCalendar({
  days,
  selectedDay,
  onSelectDay,
  monthLabel,
  onPrev,
  onNext,
  isPrevDisabled = false,
  isNextDisabled = false,
}) {
  return (
    <div className="w-full max-w-md mx-auto">
      <Calendar
        days={days}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        monthLabel={monthLabel}
        onPrev={onPrev}
        onNext={onNext}
        isPrevDisabled={isPrevDisabled}
        isNextDisabled={isNextDisabled}
        mode="consultant"
        testId="monthly-calendar"
      />
    </div>
  );
}
