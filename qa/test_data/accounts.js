import { env } from "../support/env.js";

const KONSULTAN_PROFILE = {
  spesialisasi: "Hukum Pidana",
  tarif_per_sesi: 150000,
  pengalaman_tahun: 5,
  kota_praktik: "Bandung",
  gelar_akademik: "S.H.",
  pendidikan_terakhir: "S1 Hukum",
  nomor_izin_praktik: "SIT-0001",
  bio_singkat: "Akun konsultan untuk pengujian SIT.",
  deskripsi_lengkap: "Akun ini dipakai oleh pengujian otomatis SIT LangkahLegal.",
  is_active: true,
  alasan_penolakan: null,
};

/** Akun uji tetap. Kunci objek dipakai di file .feature sebagai nama akun. */
export const ACCOUNTS = {
  klien: { email: "sit.klien@example.com", name: "SIT Klien", role: "client" },
  konsultan: {
    email: "sit.konsultan@example.com",
    name: "SIT Konsultan",
    role: "konsultan",
    konsultan: { ...KONSULTAN_PROFILE, nama_lengkap: "SIT Konsultan", status_verifikasi: "terverifikasi" },
  },
  "konsultan baru": {
    email: "sit.konsultan.baru@example.com",
    name: "SIT Calon Verifikasi",
    role: "konsultan",
    konsultan: {
      ...KONSULTAN_PROFILE,
      nama_lengkap: "SIT Calon Verifikasi",
      spesialisasi: "Hukum Perdata",
      nomor_izin_praktik: "SIT-0002",
      status_verifikasi: "pending",
    },
  },
  admin: { email: "sit.admin@example.com", name: "SIT Admin", role: "admin" },
  "akun tanpa peran": { email: "sit.tanpa.peran@example.com", name: "SIT Tanpa Peran", role: null },
};

export function account(key) {
  const found = ACCOUNTS[key];
  if (!found) throw new Error(`Akun uji "${key}" tidak dikenal. Pilihan: ${Object.keys(ACCOUNTS).join(", ")}`);
  return { ...found, key, password: env.accountPassword };
}
