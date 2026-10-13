/** Sesi terjadwal di dashboard konsultan: yang terdekat harus terpilih, yang lewat diabaikan. */
export const UPCOMING_SESSIONS = {
  far: { dayOffset: 3, start: "11:00:00", end: "11:30:00", shown: "11:00 - 11:30" },
  nearest: { dayOffset: 2, start: "09:00:00", end: "09:30:00", shown: "09:00 - 09:30" },
  passed: { dayOffset: -1, start: "14:00:00", end: "14:30:00", shown: "14:00 - 14:30" },
};

/** Permintaan baru: yang jadwalnya sudah lewat tidak perlu ditampilkan lagi. */
export const NEW_REQUESTS = {
  valid: { dayOffset: 2, start: "09:00:00", end: "09:30:00", shown: "09:00 - 09:30" },
  expired: { dayOffset: -2, start: "15:00:00", end: "15:30:00", shown: "15:00 - 15:30" },
};

export const REJECTION_REASON = "Nomor izin tidak valid (data uji SIT)";

export const DASHBOARD_TEXT = {
  emptyIncome: "Rp 0",
  noSchedule: "Jadwal Kosong",
  noRequest: "Kotak Masuk Bersih",
  rejectedTitle: "Pengajuan Verifikasi Ditolak",
};

/** Klien aktif, ditulis dari pengajuan terlama; jam mulai dipakai untuk mengenali kartunya. */
export const ACTIVE_CLIENTS = [
  { key: "pertama", createdAt: "2026-01-01T00:00:00Z", dayOffset: 9, start: "09:00:00", end: "09:30:00", status: "terjadwal" },
  { key: "kedua", createdAt: "2026-03-01T00:00:00Z", dayOffset: 2, start: "10:00:00", end: "10:30:00", status: "terjadwal" },
  { key: "ketiga", createdAt: "2026-02-01T00:00:00Z", dayOffset: 5, start: "11:00:00", end: "11:30:00", status: "menunggu_pembayaran" },
];

/** Urutan kartu yang diharapkan untuk tiap pilihan urutan, dikenali dari jam mulainya. */
export const CLIENT_ORDERS = {
  Terbaru: ["10:00", "11:00", "09:00"],
  Terlama: ["09:00", "11:00", "10:00"],
  "Paling Dekat": ["10:00", "11:00", "09:00"],
};

/** Slot jadwal bulan depan yang dipakai skenario halaman jadwal. */
export const SLOTS = {
  added: { day: 15, start: "09:00", end: "12:00", startStored: "09:00:00", endStored: "12:00:00" },
  existing: { day: 10, start: "08:00:00", end: "10:00:00", shown: "08:00" },
  booked: { day: 12, start: "08:00:00", end: "10:00:00" },
  reversed: { day: 16, start: "12:00", end: "09:00" },
  conflicting: { day: 20, start: "09:00", end: "10:00" },
  untouched: { day: 18 },
};

/** Jadwal yang ditawarkan saat konsultan menjadwalkan kasus dari bursa. */
export const CLAIM_SCHEDULE = {
  dayOffset: 5,
  slot: { start: "09:00:00", end: "12:00:00", shown: "09:00 - 12:00" },
  chosen: { start: "10:00:00", end: "11:00:00", shown: "10:00 - 11:00" },
};

export const SCHEDULE_MESSAGES = {
  added: "Jadwal baru berhasil ditambahkan!",
  updated: "Jadwal berhasil diperbarui!",
  conflict: "Gagal menambah jadwal. Pastikan jam tidak bertabrakan.",
  bookedReadOnly: "Jadwal yang sudah dipesan tidak dapat diubah kembali.",
};

export const REQUEST_MESSAGES = {
  accepted: "Permintaan Berhasil Diterima!",
  rejected: "Permintaan Berhasil Ditolak!",
  scheduled: "Permintaan Berhasil Diterima & Dijadwalkan!",
  failed: "Gagal memproses permintaan.",
  notFound: "Data tidak ditemukan.",
};

/** Riwayat konsultan: pengajuan yang masih pending belum termasuk riwayat. */
export const CONSULTANT_HISTORY = {
  statuses: ["selesai", "pending", "dibatalkan"],
  shownLabels: ["Selesai", "Batal"],
  hiddenLabel: "Pending",
  finishedBadge: "1 Selesai",
};

/** Tanggal 31 Januari, untuk memeriksa perpindahan bulan di kalender. */
export const MONTH_END_CHECK = { now: "2027-01-31T10:00:00+07:00", current: "Januari 2027", next: "Februari 2027" };
