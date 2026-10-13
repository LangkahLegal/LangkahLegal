import path from "node:path";
import { FILES_DIR } from "../support/env.js";

export const CATEGORIES = ["Umum", "Pidana", "Perdata"];

/** Isian klien saat memposting kasus ke bursa. Jadwal yang diminta: besok. */
export const CASE_POST = {
  dayOffset: 1,
  category: { label: "Pidana", value: "pidana" },
  typedDescription: "   Saya ditipu penjual online (data uji SIT)   ",
  storedDescription: "Saya ditipu penjual online (data uji SIT)",
  start: "10:00",
  startStored: "10:00:00",
  endStored: "10:30:00",
  document: path.join(FILES_DIR, "chat.png"),
};

/** Konsultasi milik klien yang membuat sebagian jam besok tidak bisa dipilih. */
export const OWN_SESSION = {
  dayOffset: 1,
  start: "10:00:00",
  end: "11:00:00",
  takenTimes: ["10:00", "10:30"],
  freeTime: "11:00",
};

/** Jam sekarang yang dipalsukan di browser untuk memeriksa jam yang sudah lewat. */
export const PAST_TIME_CHECK = { now: "14:10:00", passed: "14:00", upcoming: "14:30" };

export const MAX_DOCUMENTS = 10;

/** Kasus terbuka yang diposting klien uji sebelum skenario konsultan dimulai. */
export const OPEN_CASES = {
  pidana: {
    kategori_hukum: "pidana",
    deskripsi_kasus_awam: "Penipuan jual beli daring (data uji SIT).",
    jam_mulai: "10:00:00",
    jam_selesai: "10:30:00",
  },
  perdata: {
    kategori_hukum: "perdata",
    deskripsi_kasus_awam: "Sengketa sewa rumah (data uji SIT). ".repeat(12).trim(),
    dokumen_bukti: "https://example.com/sit/kontrak.pdf",
    jam_mulai: "11:00:00",
    jam_selesai: "11:30:00",
  },
  umum: {
    kategori_hukum: "umum",
    deskripsi_kasus_awam: '<img src=x onerror="alert(1)">Kasus umum berisi skrip (data uji SIT)',
    jam_mulai: "13:00:00",
    jam_selesai: "13:30:00",
  },
};

export const BURSA_MESSAGES = {
  incompletePost: "Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).",
  posted: "Kasus Berhasil Diposting ke Ruang Publik!",
  tooManyFiles: "Maksimal 10 file",
  claimed: "Kasus Berhasil Diklaim!",
  alreadyClaimed: "Kasus ini sudah diklaim oleh konsultan lain",
};
