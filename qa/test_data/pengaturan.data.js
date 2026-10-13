import path from "node:path";
import { FILES_DIR } from "../support/env.js";

export const SETTINGS_MENU = ["Profil Saya", "Bahasa", "Tema Aplikasi", "Keamanan & Sandi", "Tentang LangkahLegal", "Keluar"];

/** Menu pengaturan dan halaman yang dibukanya. */
export const SETTINGS_DESTINATIONS = [
  { menu: "Profil Saya", page: "pengaturan profil" },
  { menu: "Bahasa", page: "pengaturan bahasa" },
  { menu: "Keamanan & Sandi", page: "pengaturan keamanan" },
  { menu: "Tentang LangkahLegal", page: "tentang aplikasi" },
];

export const THEMES = { light: /theme-white-modern/, dark: /dark-tech/, darkStored: "dark-tech", darkLabel: "Mode Gelap (Aktif)" };

export const LOGOUT_CONFIRM = "Apakah Anda yakin ingin keluar?";

export const SESSION_KEYS = ["ll_token", "token", "ll_refresh", "refresh_token", "ll_role", "role"];

export const PROFILE_EDIT = { newName: "SIT Klien Diperbarui" };

/** Kredensial profesional yang diisi konsultan di halaman profil. */
export const CREDENTIALS = {
  fee: "200000",
  experience: "9",
  specialization: "Pidana",
  city: "Surabaya",
  portfolio: path.join(FILES_DIR, "bukti.pdf"),
  portfolioName: "bukti.pdf",
  stored: { tarif_per_sesi: 200000, pengalaman_tahun: 9, spesialisasi: "Pidana", kota_praktik: "Surabaya" },
  negative: { fee: "-50000", experience: "-3" },
};

export const PHOTO = {
  uploadedUrl: "https://i.ibb.co/sit/avatar.png",
  valid: path.join(FILES_DIR, "chat.png"),
  oversized: { name: "besar.png", mimeType: "image/png", buffer: Buffer.alloc(2.5 * 1024 * 1024) },
};

export const PROFILE_MESSAGES = {
  saveFailed: "Gagal menyimpan perubahan.",
  photoTooLarge: "File terlalu besar (max 2MB)",
  photoFailed: "Gagal sinkronisasi foto.",
  rejectedTitle: "Pengajuan Verifikasi Ditolak",
};

export const PASSWORD_CHANGE = {
  newPassword: "SandiBaru123!",
  mismatch: "SandiBaru124!",
  sixCharacters: "abc123",
};

export const PASSWORD_MESSAGES = {
  changed: "Kata sandi berhasil diperbarui!",
  mismatch: "Konfirmasi password baru tidak cocok.",
  samePassword: "New password should be different from the old password.",
};
