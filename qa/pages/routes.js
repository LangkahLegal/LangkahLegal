import { identity } from "../support/state.js";
import { VERIFICATION } from "../test_data/admin.data.js";
import { UNKNOWN_CONSULTANT_ID } from "../test_data/konsultasi.data.js";
import { UNKNOWN_CONSULTATION_ID } from "../test_data/pembayaran.data.js";

/**
 * Nama halaman yang dipakai di file .feature beserta alamatnya.
 * Alamat yang bergantung pada data ditulis sebagai fungsi dari catatan skenario (world).
 */
export const ROUTES = {
  beranda: "/",
  "tentang kami": "/about",
  "kebijakan privasi": "/privacy",
  "syarat dan ketentuan": "/terms",
  "kepatuhan hukum": "/compliance",

  login: "/auth/login",
  "pemilihan peran": "/auth/role",
  pendaftaran: "/auth/signup",
  "verifikasi OTP": "/auth/verify",
  "lupa kata sandi": "/auth/forgot-password",
  "reset kata sandi": "/auth/reset-password",
  "buat kata sandi": "/auth/create-password",
  "callback OAuth": "/auth/callback",

  "dashboard klien": "/dashboard/client",
  "dashboard konsultan": "/dashboard/consultant",
  "dashboard admin": "/dashboard/admin",

  "katalog konsultan": "/explore",
  "profil konsultan uji": () => `/explore/${identity("konsultan").idKonsultan}`,
  "profil konsultan yang tidak ada": `/explore/${UNKNOWN_CONSULTANT_ID}`,
  "pembayaran konsultasi itu": (world) => `/payment/${world.consultation.id_pengajuan}`,
  "pembayaran yang tidak ada": `/payment/${UNKNOWN_CONSULTATION_ID}`,
  "detail konsultasi itu": (world) => `/consultation/${world.consultation.id_pengajuan}`,
  "permintaan konsultasi itu": (world) => `/request/${world.consultation.id_pengajuan}`,
  "permintaan yang tidak ada": `/request/${UNKNOWN_CONSULTATION_ID}`,
  "detail konsultasi yang tidak ada": `/consultation/${UNKNOWN_CONSULTATION_ID}`,
  "tanya AI": "/ai",
  "riwayat klien": "/history/client",
  "riwayat konsultan": "/history/consultant",
  "daftar klien": "/consultation",
  jadwal: "/schedule",
  "bursa kasus": "/bursa",
  "posting kasus": "/bursa/post",

  pengaturan: "/setting",
  "pengaturan profil": "/setting/profile",
  "pengaturan keamanan": "/setting/security",
  "tentang aplikasi": "/setting/about",

  "verifikasi konsultan": "/verification",
  "verifikasi konsultan baru": () => `/verification/${identity("konsultan baru").idKonsultan}`,
  "verifikasi konsultan uji": () => `/verification/${identity("konsultan").idKonsultan}`,
  "verifikasi konsultan yang tidak ada": `/verification/${VERIFICATION.unknownId}`,
  "basis pengetahuan": "/knowledge",
  "detail dokumen": "/knowledge/detail",

  // Alamat berparameter dengan id contoh, untuk skenario yang tidak butuh data sungguhan.
  "contoh pembayaran": "/payment/501",
};

export function routeOf(name, world = {}) {
  const path = ROUTES[name];
  if (!path) throw new Error(`Halaman "${name}" belum terdaftar di pages/routes.js`);
  return typeof path === "function" ? path(world) : path;
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Pola URL untuk memastikan browser berada tepat di sebuah alamat (query diabaikan). */
export const urlOf = (path) => new RegExp(`${escapeRegExp(path)}(\\?.*)?$`);
