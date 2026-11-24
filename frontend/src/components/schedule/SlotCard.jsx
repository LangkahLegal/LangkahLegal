"use client";

import { useState } from "react";
import { Button, Dropdown } from "@/components/ui";
import { MaterialIcon } from "@/components/ui/Icons";

const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
  const hr = Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  return `${hr.toString().padStart(2, "0")}:${min}`;
});

const STATUS_OPTIONS = [
  { value: "available", label: "Tersedia", icon: "schedule" },
  { value: "off", label: "Libur / Tutup", icon: "block" },
];

const TITLE =
  "text-xs sm:text-sm font-black uppercase tracking-wider text-main font-headline";
const CARD =
  "bg-card border border-surface rounded-2xl p-4 shadow-soft flex flex-col gap-3 animate-fade-in";

/**
 * Kartu atur jadwal untuk satu tanggal (pengganti modal tambah/edit slot).
 * - slot === null  : belum ada jadwal, tampil form tambah
 * - slot ada       : form edit
 * - isBooked       : sudah dipesan klien, hanya bisa dilihat
 * - isPastEmpty    : tanggal lewat tanpa jadwal, tidak ada yang bisa diatur
 */
export default function SlotCard({
  dateLabel,
  slot = null,
  isBooked = false,
  isPastEmpty = false,
  onSave,
  isSaving = false,
}) {
  if (isPastEmpty) {
    return (
      <div className={CARD} data-testid="schedule-slot-card">
        <Header dateLabel={dateLabel} title="Jadwal" />
        <p className="text-xs text-muted font-medium">
          Tanggal ini sudah lewat dan tidak memiliki jadwal.
        </p>
      </div>
    );
  }

  // key mereset form saat tanggal atau isi slot berganti
  return (
    <SlotForm
      key={`${dateLabel}-${slot?.jam_mulai}-${slot?.jam_selesai}-${slot?.status_tersedia}`}
      dateLabel={dateLabel}
      slot={slot}
      isBooked={isBooked}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}

function Header({ dateLabel, title }) {
  return (
    <div className="flex items-start gap-2 px-1">
      <MaterialIcon name="edit_calendar" className="text-primary text-base mt-0.5" />
      <div>
        <h3 className={TITLE}>{title}</h3>
        <p className="text-[11px] sm:text-xs text-muted font-medium mt-0.5">
          {dateLabel}
        </p>
      </div>
    </div>
  );
}

function SlotForm({ dateLabel, slot, isBooked, onSave, isSaving }) {
  const isNew = !slot;
  const [form, setForm] = useState({
    start: slot?.jam_mulai?.substring(0, 5) || "00:00",
    end: slot?.jam_selesai?.substring(0, 5) || "00:00",
    status: slot && slot.status_tersedia === false ? "off" : "available",
  });
  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const title = isBooked ? "Detail Jadwal" : isNew ? "Tambah Jadwal" : "Edit Jadwal";

  return (
    <div className={CARD} data-testid="schedule-slot-card">
      <Header dateLabel={dateLabel} title={title} />

      <div className={isBooked ? "opacity-60 pointer-events-none space-y-3" : "space-y-3"}>
        <div className="grid grid-cols-2 gap-3">
          <Dropdown
            compact
            label="Mulai"
            value={form.start}
            options={TIME_OPTIONS}
            onChange={set("start")}
          />
          <Dropdown
            compact
            label="Selesai"
            value={form.end}
            options={TIME_OPTIONS}
            onChange={set("end")}
          />
        </div>

        <Dropdown
          compact
          label="Status Slot"
          value={form.status}
          options={STATUS_OPTIONS}
          onChange={set("status")}
          renderItem={(opt) => (
            <div className="flex items-center gap-3">
              <MaterialIcon
                name={opt.icon}
                className={`text-[20px] ${opt.value === "available" ? "text-success" : "text-danger"}`}
              />
              <span className="font-bold text-sm tracking-wide">{opt.label}</span>
            </div>
          )}
        />
      </div>

      <div className="mt-auto pt-1">
        {isBooked ? (
          <p className="text-center text-[12px] text-muted font-medium italic leading-relaxed p-3 bg-surface rounded-xl">
            Jadwal yang sudah dipesan tidak dapat diubah kembali.
          </p>
        ) : (
          <Button
            variant="primary"
            fullWidth
            disabled={isSaving}
            onClick={() =>
              onSave({ time: `${form.start} - ${form.end}`, status: form.status })
            }
            className="py-3 shadow-soft"
            data-testid="schedule-save-btn"
          >
            {isNew ? "Tambah Slot" : "Simpan Perubahan"}
          </Button>
        )}
      </div>
    </div>
  );
}
