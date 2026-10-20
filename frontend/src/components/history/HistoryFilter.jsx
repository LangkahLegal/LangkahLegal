"use client";

import React from "react";
import SearchBar from "@/components/layout/SearchBar";

/**
 * Opsi filter status untuk Klien & Konsultan
 */
export const CLIENT_HISTORY_FILTERS = [
  { id: "semua", label: "Semua" },
  { id: "terjadwal", label: "Terjadwal" },
  { id: "menunggu_pembayaran", label: "Menunggu Pembayaran" },
  { id: "selesai", label: "Selesai" },
  { id: "batal", label: "Batal / Ditolak" },
];

export const CONSULTANT_HISTORY_FILTERS = [
  { id: "semua", label: "Semua" },
  { id: "terjadwal", label: "Terjadwal" },
  { id: "selesai", label: "Selesai" },
  { id: "batal", label: "Batal / Ditolak" },
];

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
export function processHistorySessions(
  sessions = [],
  activeFilter = "semua",
  searchQuery = "",
  role = "client",
  now = new Date()
) {
  const query = (searchQuery || "").trim().toLowerCase();

  const filtered = sessions.filter((item) => {
    if (query) {
      const targetName = (
        role === "client"
          ? item?.jadwal_ketersediaan?.konsultan?.nama_lengkap ||
            item?.konsultan?.nama_lengkap ||
            item?.users?.nama
          : item?.jadwal_ketersediaan?.konsultan?.nama_lengkap ||
            item?.nama_klien ||
            item?.users?.nama
      ) || "";

      if (!targetName.toLowerCase().includes(query)) {
        return false;
      }
    }

    if (activeFilter === "semua") return true;

    const status = item?.status_pengajuan || item?.status;
    if (activeFilter === "terjadwal") return status === "terjadwal";
    if (activeFilter === "menunggu_pembayaran") {
      return status === "menunggu_pembayaran";
    }
    if (activeFilter === "selesai") return status === "selesai";
    if (activeFilter === "batal") {
      return ["dibatalkan", "ditolak", "kedaluwarsa"].includes(status);
    }
    return true;
  });

  const upcoming = [];
  const past = [];

  filtered.forEach((item) => {
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

  return {
    upcoming,
    past,
    allSorted: [...upcoming, ...past],
  };
}

/**
 * Komponen Reusable Search & Filter Bar untuk Riwayat Konsultasi (DRY).
 * Search bar di atas, diikuti tombol-tombol kategorisasi pill di bawahnya (seperti di Manajemen Dokumen/Knowledge).
 */
export default function HistoryFilter({
  search = "",
  onSearchChange,
  searchPlaceholder = "Cari nama konsultan...",
  activeFilter = "semua",
  onFilterChange,
  filterOptions = CLIENT_HISTORY_FILTERS,
  className = "",
}) {
  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* 1. Search Bar di atas */}
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
      />

      {/* 2. Tombol-tombol Kategorisasi di bawahnya (horizontal scrollable pills, mirip knowledge base) */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 -mb-2 no-scrollbar scroll-smooth px-1">
        {filterOptions.map((filter) => {
          const isActive = filter.id === activeFilter;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange?.(filter.id)}
              className={`
                px-5 py-2.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all duration-300 cursor-pointer select-none
                ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary/40 shadow-soft"
                    : "bg-input/50 text-muted border-surface hover:border-primary/30"
                }
              `}
            >
              <span className="tracking-wide uppercase text-[10px]">
                {filter.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
