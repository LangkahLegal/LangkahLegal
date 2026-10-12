import path from "node:path";
import { FILES_DIR } from "../support/env.js";

/** Status konsultasi seperti disebut di file .feature, beserta nilai dan labelnya di aplikasi. */
export const CONSULTATION_STATUSES = {
  pending: { value: "pending", label: "Pending" },
  "menunggu pembayaran": { value: "menunggu_pembayaran", label: "Menunggu Pembayaran" },
  terjadwal: { value: "terjadwal", label: "Terjadwal" },
  selesai: { value: "selesai", label: "Selesai" },
  ditolak: { value: "ditolak", label: "Ditolak" },
  dibatalkan: { value: "dibatalkan", label: "Batal" },
};

/** Jadwal praktik yang dibuka konsultan uji: lusa, pukul 08.00 sampai 17.00 WIB. */
export const SCHEDULE = { dayOffset: 2, start: "08:00:00", end: "17:00:00" };

/** Sesi yang sudah ada di database sebelum skenario dimulai. */
export const EXISTING_SESSION = {
  start: "09:00:00",
  end: "10:00:00",
  description: "Sengketa batas tanah dengan tetangga (data uji SIT).",
};

/** Isian klien saat memesan konsultasi lewat halaman profil konsultan. */
export const BOOKING = {
  start: "13:00",
  startStored: "13:00:00",
  endShown: "13:30",
  endStored: "13:30:00",
  description: "Permintaan konsultasi sengketa waris (data uji SIT).",
  blankDescription: "    ",
};

/** Jam yang dipakai untuk memeriksa batas jam praktik pada pemilih jadwal. */
export const TIME_OPTIONS = {
  booked: ["09:00", "09:30"],
  outsideHours: ["07:30", "17:00"],
  insideHours: ["08:00", "16:30"],
};

export const DOCUMENTS = {
  valid: path.join(FILES_DIR, "bukti.pdf"),
  validName: "bukti.pdf",
  oversized: { name: "besar.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(10.5 * 1024 * 1024) },
  executable: { name: "malware.exe", mimeType: "application/x-msdownload", buffer: Buffer.from("MZ") },
};

export const MESSAGES = {
  cancelConfirm: "Apakah Anda yakin ingin membatalkan konsultasi ini?",
  incompleteBooking: "Mohon lengkapi semua data pengajuan.",
  fileTooLarge: "File terlalu besar! Maksimal 10MB",
  bookingSuccess: "Permintaan Booking Berhasil Terkirim!",
};

export const UNKNOWN_CONSULTANT_ID = 999999999;
