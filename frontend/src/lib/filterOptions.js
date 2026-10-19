// Pilihan filter yang dipakai bersama beberapa halaman daftar.
// id-nya sama dengan nilai yang diterima backend (lihat backend/schemas/filters.py).

export const JADWAL_OPTIONS = [
  { id: "semua", label: "Semua", triggerLabel: "Jadwal" },
  { id: "akan_datang", label: "Akan Datang" },
  { id: "hari_ini", label: "Hari Ini" },
  { id: "besok", label: "Besok" },
  { id: "7_hari", label: "7 Hari ke Depan", triggerLabel: "7 Hari" },
  { id: "30_hari", label: "30 Hari ke Depan", triggerLabel: "30 Hari" },
  { id: "sudah_lewat", label: "Sudah Lewat" },
];

export const WAKTU_OPTIONS = [
  { id: "semua", label: "Semua", triggerLabel: "Waktu" },
  { id: "pagi", label: "Pagi · < 12", triggerLabel: "Pagi" },
  { id: "siang", label: "Siang · 12-15", triggerLabel: "Siang" },
  { id: "sore", label: "Sore · 15-18", triggerLabel: "Sore" },
  { id: "malam", label: "Malam · ≥ 18", triggerLabel: "Malam" },
];

/** Nilai awal tiap filter: option pertama dari masing-masing dropdown. */
export const defaultFilterValues = (dropdowns) =>
  Object.fromEntries(dropdowns.map(({ key, options }) => [key, options[0].id]));
