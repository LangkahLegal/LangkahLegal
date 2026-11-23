"use client";

import React, { useState } from "react";
import SearchBar from "@/components/layout/SearchBar";
import FilterPanel from "@/components/layout/FilterPanel";
import { JADWAL_OPTIONS, WAKTU_OPTIONS, defaultFilterValues } from "@/lib/filterOptions";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

/**
 * Helper: Parse string tanggal & jam menjadi objek Date lokal yang aman
 */
export function parseSessionDateTime(dateStr, timeStr = "00:00") {
  if (!dateStr) return null;
  try {
    if (dateStr instanceof Date) {
      return dateStr;
    }
    const cleanDate = String(dateStr).split("T")[0];
    const [year, month, day] = cleanDate.split("-").map(Number);
    if (!year || !month || !day) return null;
    const cleanTime = String(timeStr || "00:00").slice(0, 5);
    const [hours, minutes] = cleanTime.split(":").map(Number);
    return new Date(year, month - 1, day, hours || 0, minutes || 0, 0);
  } catch {
    return null;
  }
}

export function getSessionStartTime(item) {
  const dateStr =
    item?.jadwal_ketersediaan?.tanggal ||
    item?.tanggal_konsultasi ||
    item?.tanggal_pengajuan;
  const timeStr =
    item?.jadwal_ketersediaan?.jam_mulai || item?.jam_mulai || "00:00";
  return parseSessionDateTime(dateStr, timeStr);
}

export function getSessionEndTime(item) {
  const dateStr =
    item?.jadwal_ketersediaan?.tanggal ||
    item?.tanggal_konsultasi ||
    item?.tanggal_pengajuan;

  const endStr = item?.jadwal_ketersediaan?.jam_selesai || item?.jam_selesai;
  if (endStr) {
    return parseSessionDateTime(dateStr, endStr);
  }

  const startStr = item?.jadwal_ketersediaan?.jam_mulai || item?.jam_mulai;
  if (startStr) {
    const startTime = parseSessionDateTime(dateStr, startStr);
    if (startTime) {
      // Default asumsi durasi konsultasi 60 menit jika jam_selesai tidak ada
      return new Date(startTime.getTime() + 60 * 60 * 1000);
    }
  }

  // Jika tidak ada info jam, gunakan akhir hari sebagai batas waktu
  return parseSessionDateTime(dateStr, "23:59");
}

/**
 * Helper: Cek apakah jadwal sesi sudah lewat terhadap waktu saat ini (now).
 * HANYA return true jika jam & tanggal sesi memang sudah lewat dari now().
 * Jika jadwal belum lewat (waktu >= now()), return false sehingga kartu TIDAK diredupkan.
 */
export function isSessionPast(item, now = new Date()) {
  const endTime = getSessionEndTime(item);
  if (!endTime) return false;

  return endTime.getTime() < now.getTime();
}

/**
 * Helper: Memfilter, mengurutkan terdekat now(), dan memisahkan upcoming vs past
 */
/**
 * Membagi sesi riwayat menjadi yang akan datang/berjalan (terdekat di atas) dan yang sudah lampau (terbaru di atas).
 * Penyaringan dan pencarian dikerjakan backend, jadi fungsi ini tidak menyaring.
 */
export function processHistorySessions(sessions = [], now = new Date()) {
  const upcoming = [];
  const past = [];

  sessions.forEach((item) => {
    const status = item?.status_pengajuan || item?.status;
    const isPastByTime = isSessionPast(item, now);
    const isActiveStatus = ["terjadwal", "menunggu_pembayaran", "pending"].includes(status);

    if (isActiveStatus && !isPastByTime) {
      upcoming.push(item);
    } else {
      past.push(item);
    }
  });

  // Upcoming: paling dekat dengan now() di paling atas (asc)
  upcoming.sort((a, b) => {
    const timeA = getSessionStartTime(a)?.getTime() || Infinity;
    const timeB = getSessionStartTime(b)?.getTime() || Infinity;
    return timeA - timeB;
  });

  // Past: sesi yang paling baru selesai / paling baru di atas (desc)
  past.sort((a, b) => {
    const timeA =
      getSessionEndTime(a)?.getTime() ||
      new Date(a.created_at || a.tanggal_pengajuan || 0).getTime();
    const timeB =
      getSessionEndTime(b)?.getTime() ||
      new Date(b.created_at || b.tanggal_pengajuan || 0).getTime();
    return timeB - timeA;
  });

  return { upcoming, past };
}

// id tiap opsi dikirim apa adanya ke backend (GET /consultations/history dan /consultants/me/history).
// Riwayat memuat sesi lampau dan yang akan datang, jadi Jadwal mencakup kedua arah.
// Label status mengikuti ConsultationCard.
const STATUS_OPTIONS = [
  { id: "semua", label: "Semua", triggerLabel: "Status" },
  { id: "terjadwal", label: "Terjadwal" },
  { id: "menunggu_pembayaran", label: "Menunggu Bayar" },
  { id: "pending", label: "Pending" },
  { id: "selesai", label: "Selesai" },
  { id: "dibatalkan", label: "Batal" },
  { id: "ditolak", label: "Ditolak" },
  { id: "kedaluwarsa", label: "Kedaluwarsa" },
  { id: "pembayaran_gagal", label: "Pembayaran Gagal", triggerLabel: "Gagal Bayar" },
];

// Dari pilihan daftar klien diambil yang paling berguna untuk riwayat, ditambah dua rentang ke belakang.
// Backend tetap menerima rentang lain (besok, 7_hari, 30_hari, 30_hari_terakhir) bila nanti diperlukan.
const RENTANG_RIWAYAT_OPTIONS = [
  ...JADWAL_OPTIONS.filter((opt) => ["semua", "akan_datang", "hari_ini", "sudah_lewat"].includes(opt.id)),
  { id: "7_hari_terakhir", label: "7 Hari Terakhir", triggerLabel: "7 Terakhir" },
  { id: "bulan_ini", label: "Bulan Ini" },
];

const SUMBER_OPTIONS = [
  { id: "semua", label: "Semua", triggerLabel: "Sumber" },
  { id: "konsultan", label: "Langsung ke Konsultan", triggerLabel: "Langsung" },
  { id: "bursa", label: "Dari Bursa Kasus", triggerLabel: "Bursa" },
];

// Sama dengan daftar klien; "terbaru" menjadi nilai awal.
const URUTAN_OPTIONS = [
  { id: "terbaru", label: "Terbaru" },
  { id: "terlama", label: "Terlama" },
  { id: "jadwal_terdekat", label: "Jadwal Terdekat", triggerLabel: "Terdekat" },
  { id: "jadwal_terjauh", label: "Jadwal Terjauh", triggerLabel: "Terjauh" },
];

const dropdownsFor = (statusOptions) => [
  { key: "status", icon: "pending_actions", options: statusOptions },
  { key: "jadwal", icon: "event", options: RENTANG_RIWAYAT_OPTIONS },
  { key: "waktu", icon: "schedule", options: WAKTU_OPTIONS },
  { key: "sumber", icon: "alt_route", options: SUMBER_OPTIONS },
  { key: "urutkan", icon: "sort", options: URUTAN_OPTIONS },
];

// Pengajuan "pending" masih menunggu konfirmasi konsultan dan tampil di permintaan, bukan di riwayat konsultan.
const DROPDOWNS = {
  client: dropdownsFor(STATUS_OPTIONS),
  consultant: dropdownsFor(STATUS_OPTIONS.filter((opt) => opt.id !== "pending")),
};
const DEFAULTS = {
  client: defaultFilterValues(DROPDOWNS.client),
  consultant: defaultFilterValues(DROPDOWNS.consultant),
};

/**
 * State filter riwayat. `filters` siap dikirim ke service (pencarian sudah di-debounce);
 * `hasActiveFilter` bernilai true bila ada pencarian atau dropdown yang bukan nilai awal.
 * @param {"client"|"consultant"} role
 */
export function useHistoryFilters(role) {
  const dropdowns = DROPDOWNS[role];
  const defaults = DEFAULTS[role];
  const [options, setOptions] = useState(defaults);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());

  const hasActiveFilter =
    search.trim() !== "" || dropdowns.some(({ key }) => options[key] !== defaults[key]);

  return {
    role,
    dropdowns,
    options,
    search,
    setSearch,
    setOption: (key, value) => setOptions((prev) => ({ ...prev, [key]: value })),
    filters: { search: debouncedSearch, ...options },
    hasActiveFilter,
    reset: () => {
      setSearch("");
      setOptions(defaults);
    },
  };
}

/** Kolom pencarian dan dropdown filter untuk halaman riwayat. */
export function HistoryFilterBar({ state, searchPlaceholder }) {
  return (
    <>
      <SearchBar
        value={state.search}
        onChange={state.setSearch}
        placeholder={searchPlaceholder}
        testId="history-search-input"
      />
      <FilterPanel
        dropdowns={state.dropdowns}
        values={state.options}
        onChange={state.setOption}
        onReset={state.reset}
        canReset={state.hasActiveFilter}
        gridClassName="lg:grid-cols-5"
        testIdPrefix="history"
      />
    </>
  );
}
