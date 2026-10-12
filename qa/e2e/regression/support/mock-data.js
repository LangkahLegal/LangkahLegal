/**
 * Data mock yang meniru bentuk response asli backend FastAPI LangkahLegal.
 * Semua tanggal dihitung relatif terhadap "hari ini" (zona Asia/Jakarta)
 * agar skenario jadwal selalu berada di masa depan.
 */

const TZ = "Asia/Jakarta";

/** YYYY-MM-DD untuk hari ini + n hari (zona Asia/Jakarta). */
export function dateFromToday(n = 0) {
  const now = new Date();
  const base = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + n);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const isoNow = () => new Date().toISOString();

export const USERS = {
  client: {
    id_user: 1,
    nama: "Budi Santoso",
    email: "budi.client@example.com",
    foto_profil: null,
    role: "client",
  },
  konsultan: {
    id_user: 2,
    nama: "Siti Rahma",
    email: "siti.konsultan@example.com",
    foto_profil: null,
    role: "konsultan",
    id_konsultan: 10,
    nama_lengkap: "Siti Rahma, S.H., M.H.",
    spesialisasi: "Perdata",
    kota_praktik: "Jakarta",
    pengalaman_tahun: 7,
    tarif_per_sesi: 150000,
    status_verifikasi: "terverifikasi",
    alasan_penolakan: null,
    bio_singkat: "Advokat perdata",
    deskripsi_lengkap: "Berpengalaman menangani sengketa tanah dan waris.",
    nomor_izin_praktik: "PERADI-123",
    gelar_akademik: "S.H., M.H.",
    pendidikan_terakhir: "Magister",
    linkedin: "https://linkedin.com/in/siti",
    portofolio: null,
    is_active: true,
  },
  admin: {
    id_user: 3,
    nama: "Admin LangkahLegal",
    email: "admin@example.com",
    foto_profil: null,
    role: "admin",
  },
};

export function session(role = "client") {
  return {
    access_token: `access-${role}-token`,
    refresh_token: `refresh-${role}-token`,
    user: { id: `auth-${role}`, email: USERS[role].email, role },
  };
}

/** Katalog konsultan (GET /consultants/) — format card list backend. */
export const CATALOG = [
  {
    id: 10,
    name: "Siti Rahma, S.H., M.H.",
    spec: "Perdata",
    rating: 4.8,
    reviews: 12,
    status: "online",
    foto_profil: null,
    status_verifikasi: "terverifikasi",
    tarif_per_sesi: 150000,
  },
  {
    id: 11,
    name: "Andi Wijaya",
    spec: "Pidana",
    rating: 4.5,
    reviews: 8,
    status: "online",
    foto_profil: "https://example.com/andi.jpg",
    status_verifikasi: "terverifikasi",
    tarif_per_sesi: 300000,
  },
  {
    id: 12,
    name: "Clara Hutapea",
    spec: "Umum",
    rating: 0,
    reviews: 0,
    status: "online",
    foto_profil: "javascript:alert(1)",
    status_verifikasi: "pending",
    tarif_per_sesi: 0,
  },
  {
    id: 13,
    name: "Dewi Lestari",
    spec: "Perdata, Pidana",
    rating: 4.1,
    reviews: 3,
    status: "online",
    foto_profil: null,
    status_verifikasi: "ditolak",
    tarif_per_sesi: 100000,
  },
];

/** Detail konsultan publik (GET /consultants/{id}). */
export function consultantDetail(overrides = {}) {
  return {
    id_konsultan: 10,
    id_user: 2,
    nama_lengkap: "Siti Rahma, S.H., M.H.",
    spesialisasi: "Perdata,Waris",
    tarif_per_sesi: 150000,
    deskripsi_lengkap: "Berpengalaman menangani sengketa tanah dan waris.",
    status_verifikasi: "terverifikasi",
    foto_profil: null,
    users: { nama: "Siti Rahma", email: "siti@example.com", foto_profil: null },
    rating: 4.8,
    reviews: 12,
    jadwal_ketersediaan: [
      {
        id_jadwal: 101,
        tanggal: dateFromToday(2),
        jam_mulai: "08:00:00",
        jam_selesai: "17:00:00",
        status_tersedia: true,
      },
      {
        id_jadwal: 102,
        tanggal: dateFromToday(3),
        jam_mulai: "13:00:00",
        jam_selesai: "15:00:00",
        status_tersedia: true,
      },
    ],
    ...overrides,
  };
}

/** Item GET /consultations/ (list milik client). */
export function clientConsultation(overrides = {}) {
  return {
    id_pengajuan: 501,
    status_pengajuan: "pending",
    created_at: isoNow(),
    tanggal_pengajuan: dateFromToday(2),
    jam_mulai: "09:00:00",
    jam_selesai: "09:30:00",
    jadwal_ketersediaan: {
      tanggal: dateFromToday(2),
      konsultan: { nama_lengkap: "Siti Rahma, S.H., M.H.", foto_profil: null },
    },
    ...overrides,
  };
}

/** Detail pengajuan (GET /consultations/{id}). */
export function consultationDetail(overrides = {}) {
  return {
    id_pengajuan: 501,
    id_konsultan: 10,
    id_user: 1,
    id_jadwal: 101,
    id_bursa: null,
    nama_klien: "Budi Santoso",
    foto_profil: null,
    created_at: isoNow(),
    tanggal_konsultasi: dateFromToday(2),
    rentang_waktu: "09:00 - 09:30",
    deskripsi_kasus: "Sengketa tanah warisan keluarga di Bekasi.",
    link_zoom: null,
    status_pengajuan: "terjadwal",
    total_harga: 150000,
    jumlah_sesi: 1,
    jadwal_ketersediaan: {
      tanggal: dateFromToday(2),
      konsultan: {
        nama_lengkap: "Siti Rahma, S.H., M.H.",
        foto_profil: null,
        tarif_per_sesi: 150000,
      },
    },
    berkas_pendukung: [
      {
        id_dokumen: 1,
        nama_dokumen: "sertifikat-tanah.pdf",
        ukuran_kb: 2048,
        tipe_file: "application/pdf",
        file_url: "https://example.com/sertifikat.pdf",
      },
    ],
    ...overrides,
  };
}

/** Item request konsultan (GET /consultants/me/requests/pending|active). */
export function consultantRequest(overrides = {}) {
  return {
    id_pengajuan: 601,
    status_pengajuan: "pending",
    created_at: isoNow(),
    tanggal_pengajuan: dateFromToday(2),
    jam_mulai: "10:00:00",
    jam_selesai: "10:30:00",
    nominal_konsultan: 135000,
    users: { nama: "Rina Klien", foto_profil: null },
    ...overrides,
  };
}

/** Kasus bursa (GET /cases/). */
export function bursaCase(overrides = {}) {
  return {
    id_bursa: 701,
    kategori_hukum: "pidana",
    deskripsi_kasus_awam: "Saya dituduh melakukan penipuan online padahal tidak bersalah.",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString().replace("Z", ""),
    tanggal_konsultasi: dateFromToday(4),
    jam_mulai: "10:00:00",
    jam_selesai: "11:00:00",
    dokumen_bukti: null,
    status: "open",
    ...overrides,
  };
}

/** Konsultan untuk admin (GET /admin/consultants). */
export function adminConsultant(overrides = {}) {
  return {
    id_konsultan: 20,
    nama_lengkap: "Fajar Nugroho",
    spesialisasi: "Pidana",
    kota_praktik: "Bandung",
    pengalaman_tahun: 4,
    tarif_per_sesi: 200000,
    status_verifikasi: "pending",
    created_at: isoNow(),
    updated_at: isoNow(),
    foto_profil: null,
    users: { email: "fajar@example.com", foto_profil: null },
    pendidikan_terakhir: "Sarjana",
    gelar_akademik: "S.H.",
    nomor_izin_praktik: "PERADI-999",
    bio_singkat: "Advokat muda",
    deskripsi_lengkap: "Fokus pada perkara pidana umum.",
    linkedin: null,
    portofolio: null,
    rating: 0,
    total_reviews: 0,
    is_active: true,
    ...overrides,
  };
}

export const ADMIN_STATS = {
  total_users: 120,
  total_clients: 90,
  total_consultants: 29,
  pending_verification: 2,
  total_transactions: 35,
  total_revenue: 5000000,
  total_commission: 500000,
};

export function adminDocument(overrides = {}) {
  return {
    frbr_uri: "/akn/id/act/uu/2022/27",
    nama_uu: "Undang-Undang Perlindungan Data Pribadi",
    nomor_uu: "27",
    tahun_uu: "2022",
    total_chunks: 76,
    kategori: "teknologi_informasi",
    status_hukum: "Berlaku",
    ...overrides,
  };
}

export function documentChunk(overrides = {}) {
  return {
    id_dokumen: 9001,
    frbr_uri: "/akn/id/act/uu/2022/27",
    nama_uu: "Undang-Undang Perlindungan Data Pribadi",
    nomor_uu: "27",
    tahun_uu: "2022",
    kategori: "teknologi_informasi",
    status_hukum: "Berlaku",
    pasal_bagian: "Pasal 1",
    node_type: "pasal",
    judul_bab: "BAB I KETENTUAN UMUM",
    isi_teks: "(1) Data Pribadi adalah data tentang orang perseorangan.\n(2) Informasi Pribadi adalah ...",
    ...overrides,
  };
}

/** 1x1 PNG transparan untuk mengganti gambar eksternal. */
export const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);
