import { identity } from "../support/state.js";
import { ACCOUNTS } from "./accounts.js";

export const QUESTIONS = {
  real: "Apakah menghina orang di media sosial bisa dipidana?",
  first: "Pertanyaan pertama",
  followUp: "Pertanyaan kedua",
  multiline: { first: "Baris 1", second: "Baris 2", joined: "Baris 1\nBaris 2" },
  blank: "   ",
};

export const WELCOME_TEXT = "Halo! Saya Visi";
export const TYPING_TEXT = "Visi sedang membaca kronologi Anda...";

const reply = (overrides = {}) => ({
  session_id: "sit-sesi-1",
  jawaban: "Berdasarkan **UU ITE**, penyebaran konten bermuatan penghinaan dapat dipidana.",
  type: "text",
  pasal_referensi: [],
  disclaimer: "Jawaban ini bukan nasihat hukum resmi.",
  ...overrides,
});

const konsultan = ACCOUNTS.konsultan.konsultan;

/** Jawaban AI yang isinya harus pasti, sehingga disimulasikan (@stub). */
export const AI_REPLIES = {
  "jawaban biasa": () => reply(),
  "rekomendasi konsultan": () =>
    reply({
      type: "consultant_list",
      jawaban: "Berikut konsultan yang cocok:",
      consultants: [
        {
          id_konsultan: identity("konsultan").idKonsultan,
          nama_lengkap: konsultan.nama_lengkap,
          spesialisasi: konsultan.spesialisasi,
          tarif_per_sesi: konsultan.tarif_per_sesi,
          pengalaman_tahun: konsultan.pengalaman_tahun,
          foto_profil: null,
          avg_rating: 4.8,
          total_reviews: 12,
        },
      ],
    }),
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
