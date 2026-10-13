export const ZOOM = {
  link: "https://zoom.us/j/111222333",
  newLink: "https://zoom.us/j/999888777",
  invalidLink: "bukan-url",
};

export const SUPPORTING_DOCUMENT = {
  nama_dokumen: "sertifikat-tanah.pdf",
  file_url: "https://example.com/sit/sertifikat-tanah.pdf",
  tipe_file: "pdf",
  ukuran_kb: 12,
};

export const REVIEW = {
  stars: 4,
  text: "Sangat membantu",
  counter: "15/500",
  tooLong: "x".repeat(600),
  maxLength: 500,
  maxCounter: "500/500",
};

export const REVIEW_MESSAGES = {
  alreadyReviewed: "Anda sudah memberikan ulasan untuk sesi konsultasi ini.",
  loadFailed: "Gagal memuat detail konsultasi.",
};

/** Status konsultasi dalam riwayat klien, dari yang paling lama dibuat. */
export const HISTORY_STATUSES = ["selesai", "terjadwal", "pending", "dibatalkan", "selesai"];

/** Urutan yang diharapkan di halaman riwayat: sesi aktif lebih dulu. */
export const HISTORY_EXPECTATION = { total: 5, finishedBadge: "2 Selesai", firstLabels: ["Terjadwal", "Pending"] };
