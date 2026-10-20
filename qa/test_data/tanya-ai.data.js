import { identity } from "../support/state.js";
import { ACCOUNTS } from "./accounts.js";

export const QUESTIONS = {
  real: "Apakah menghina orang di media sosial bisa dipidana?",
  first: "Pertanyaan pertama",
  followUp: "Pertanyaan kedua",
  multiline: { first: "Baris 1", second: "Baris 2", joined: "Baris 1\nBaris 2" },
  blank: "   ",
};

export const WELCOME_TEXT = "Halo! Saya Kia";
export const TYPING_TEXT = "Kia sedang membaca kronologi Anda...";

const reply = (overrides = {}) => ({
  session_id: "sit-sesi-1",
  jawaban: "Berdasarkan **UU ITE**, penyebaran konten bermuatan penghinaan dapat dipidana.",
  type: "text",
  pasal_referensi: [],
  disclaimer: "Jawaban ini bukan nasihat hukum resmi.",
  ...overrides,
});

const konsultan = ACCOUNTS.konsultan.konsultan;

const konsultanUji = () => ({
  id_konsultan: identity("konsultan").idKonsultan,
  nama_lengkap: konsultan.nama_lengkap,
  spesialisasi: konsultan.spesialisasi,
  tarif_per_sesi: konsultan.tarif_per_sesi,
  pengalaman_tahun: konsultan.pengalaman_tahun,
  foto_profil: null,
  avg_rating: 4.8,
  total_reviews: 12,
});

/** Draft pengajuan yang dirangkum AI saat pengguna meminta nasihat hukum. */
export const CONSULTATION_DRAFT = {
  kategori: "Ketenagakerjaan",
  ringkasan_kasus: "Saya karyawan kontrak dan upah saya tidak dibayar selama tiga bulan.",
  bukti_dimiliki: ["Slip gaji"],
  bukti_perlu_disiapkan: ["Kontrak kerja"],
  deskripsi_kasus:
    "Saya karyawan kontrak dan upah saya tidak dibayar selama tiga bulan.\n\nBukti yang sudah saya miliki: Slip gaji.",
};

/** Dokumen peraturan yang dipakai AI sebagai dasar jawaban, lengkap dengan naskah resminya. */
export const SOURCE_DOCUMENT = {
  frbr_uri: "/akn/id/act/t1-008",
  nama_uu: "UU ITE",
  nomor_uu: "UU No. 19 Tahun 2016",
  tahun_uu: 2016,
  kategori: "pidana",
  status_hukum: "berlaku",
  has_file: true,
  file_url: "https://res.cloudinary.com/sit/raw/upload/langkahlegal/peraturan/uu-no-19-tahun-2016.pdf",
  sumber_url: "https://peraturan.bpk.go.id/Details/37582/uu-no-19-tahun-2016",
  judul_resmi: "UU No. 19 Tahun 2016 tentang Perubahan Atas UU No. 11 Tahun 2008 tentang ITE",
  pasal: [{ id_dokumen: 9001, pasal_bagian: "Pasal 27", similarity: 0.82 }],
};

/** Isi pasal yang dikembalikan endpoint knowledge saat sumber dibuka. */
export const SOURCE_PASAL = {
  id_dokumen: 9001,
  pasal_bagian: "Pasal 27",
  judul_bab: null,
  isi_teks: "Setiap Orang dengan sengaja dan tanpa hak menyiarkan muatan yang melanggar kesusilaan.",
  document: { ...SOURCE_DOCUMENT, pasal: undefined, jumlah_pasal: 1 },
};

/** Jawaban AI yang isinya harus pasti, sehingga disimulasikan (@stub). */
export const AI_REPLIES = {
  "jawaban biasa": () => reply(),
  "rekomendasi konsultan": () =>
    reply({
      type: "consultant_list",
      jawaban: "Berikut konsultan yang cocok:",
      consultants: [konsultanUji()],
    }),
  "draft pengajuan konsultasi": () =>
    reply({
      type: "consultation_draft",
      jawaban: "Ringkasan kasus Anda sudah saya siapkan, jadi Anda tidak perlu menulis ulang.",
      consultants: [konsultanUji()],
      draft_konsultasi: CONSULTATION_DRAFT,
    }),
  "jawaban bersumber": () => reply({ sumber_dokumen: [SOURCE_DOCUMENT] }),
  "pertanyaan tentang bukti": () => reply({ jawaban: "Apakah Anda memiliki bukti tangkapan layar?" }),
  "konten berbahaya": () =>
    reply({ jawaban: "<img src=x onerror=alert(1)> [klik](javascript:alert(2)) <script>alert(3)</script>" }),
};

export const STUB_SESSION_ID = "sit-sesi-1";

export const QUICK_REPLIES = { yes: "Ya, saya punya buktinya", no: "Saya tidak punya bukti" };

export const RECOMMENDATION = { title: "Rekomendasi Konsultan:", rating: "4.8", priceLabel: /Rp\s?150\.000/ };

/** Gangguan layanan AI dan pesan ramah yang harus ditampilkan untuk masing-masing. */
export const AI_FAILURES = {
  "kebanjiran permintaan": { status: 429, message: /terlalu banyak permintaan/ },
  "mengalami galat internal": { status: 500, message: /kendala pada sistem internal/ },
  "tidak dapat dihubungi": { disconnect: true, message: /Koneksi terputus/ },
};

/** Sesi lama klien uji di database beserta isi percakapannya. */
export const SAVED_SESSIONS = {
  opened: {
    title: "Sengketa Tanah (SIT)",
    messages: [
      { role: "user", content: "Tanah saya diserobot tetangga" },
      { role: "ai", content: "Anda dapat menggugat berdasarkan Pasal 1365 KUHPerdata.", metadata: { type: "text" } },
    ],
  },
  deleted: { title: "Kasus PHK (SIT)", messages: [] },
};
