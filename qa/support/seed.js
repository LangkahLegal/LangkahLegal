import { EXISTING_SESSION, SCHEDULE } from "../test_data/konsultasi.data.js";
import { db, eq, inList } from "./database.js";
import { identity } from "./state.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Tanggal (YYYY-MM-DD) menurut WIB, sekian hari dari hari ini. */
export function wibDate(dayOffset = 0) {
  const shifted = new Date(Date.now() + WIB_OFFSET_MS + dayOffset * 24 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

const idsOf = (rows, column) => [...new Set(rows.map((row) => row[column]))];

const konsultanIds = () => [identity("konsultan").idKonsultan, identity("konsultan baru").idKonsultan];

async function removeConsultations(filters) {
  const ids = idsOf(await db.select("pengajuan_konsultasi", filters, "id_pengajuan"), "id_pengajuan");
  if (!ids.length) return;
  for (const table of ["transaksi", "dokumen_pendukung", "rating_ulasan"]) {
    await db.remove(table, { id_pengajuan: inList(ids) });
  }
  await db.remove("pengajuan_konsultasi", { id_pengajuan: inList(ids) });
}

/** Mengosongkan konsultasi, kasus bursa, dan jadwal milik akun uji. */
export async function resetConsultationData() {
  await removeConsultations({ id_user: eq(identity("klien").idUser) });
  await removeConsultations({ id_konsultan: inList(konsultanIds()) });
  await db.remove("bursa_kasus", { id_user: eq(identity("klien").idUser) });
  await db.remove("jadwal_ketersediaan", { id_konsultan: inList(konsultanIds()) });
}

/** Konsultan uji membuka jadwal praktik sesuai test_data. */
export function seedSchedule(overrides = {}) {
  return db.insert("jadwal_ketersediaan", {
    id_konsultan: identity("konsultan").idKonsultan,
    tanggal: wibDate(SCHEDULE.dayOffset),
    jam_mulai: SCHEDULE.start,
    jam_selesai: SCHEDULE.end,
    status_tersedia: true,
    ...overrides,
  });
}

/** Konsultasi klien uji dengan konsultan uji pada jadwal yang diberikan. */
export function seedConsultation(schedule, status, overrides = {}) {
  return db.insert("pengajuan_konsultasi", {
    id_user: identity("klien").idUser,
    id_konsultan: schedule.id_konsultan,
    id_jadwal: schedule.id_jadwal,
    tanggal_pengajuan: schedule.tanggal,
    jam_mulai: EXISTING_SESSION.start,
    jam_selesai: EXISTING_SESSION.end,
    deskripsi_kasus: EXISTING_SESSION.description,
    status_pengajuan: status,
    ...overrides,
  });
}

export const findConsultation = (idPengajuan) =>
  db.first("pengajuan_konsultasi", { id_pengajuan: eq(idPengajuan) });

export const latestConsultationOfKlien = () =>
  db.first("pengajuan_konsultasi", { id_user: eq(identity("klien").idUser), order: "id_pengajuan.desc" });

export const documentsOf = (idPengajuan) => db.select("dokumen_pendukung", { id_pengajuan: eq(idPengajuan) });

// ── Pembayaran

export const transactionsOf = (idPengajuan) => db.select("transaksi", { id_pengajuan: eq(idPengajuan) });

export function seedTransaction(consultation, status) {
  return db.insert("transaksi", {
    id_pengajuan: consultation.id_pengajuan,
    order_id: `SIT-${consultation.id_pengajuan}-${Date.now()}`,
    gross_amount: 300000,
    komisi_platform: 30000,
    nominal_konsultan: 270000,
    status_pembayaran: status,
    snap_token: "sit-snap-token",
  });
}

export const setTransactionStatus = (idPengajuan, status) =>
  db.update("transaksi", { id_pengajuan: eq(idPengajuan) }, { status_pembayaran: status });

// ── Detail konsultasi

export const updateConsultation = (idPengajuan, values) =>
  db.update("pengajuan_konsultasi", { id_pengajuan: eq(idPengajuan) }, values);

export const seedDocument = (consultation, document) =>
  db.insert("dokumen_pendukung", { ...document, id_pengajuan: consultation.id_pengajuan });

export const ratingsOf = (idPengajuan) => db.select("rating_ulasan", { id_pengajuan: eq(idPengajuan) });

export const seedRating = (consultation, { stars, text }) =>
  db.insert("rating_ulasan", {
    id_pengajuan: consultation.id_pengajuan,
    id_konsultan: consultation.id_konsultan,
    skor_rating: stars,
    ulasan_teks: text,
  });

// ── Bursa kasus

export const seedCase = (values) =>
  db.insert("bursa_kasus", { id_user: identity("klien").idUser, status_bursa: "open", ...values });

export const findCase = (idBursa) => db.first("bursa_kasus", { id_bursa: eq(idBursa) });

export const closeCase = (idBursa) => db.update("bursa_kasus", { id_bursa: eq(idBursa) }, { status_bursa: "closed" });

export const latestCaseOfKlien = () =>
  db.first("bursa_kasus", { id_user: eq(identity("klien").idUser), order: "id_bursa.desc" });

export const consultationOfCase = (idBursa) => db.first("pengajuan_konsultasi", { id_bursa: eq(idBursa) });

// ── Konsultan

/** Tanggal (YYYY-MM-DD) pada bulan depan menurut WIB, untuk mengisi kalender jadwal. */
export function nextMonthDate(day) {
  const [year, month] = wibDate().split("-").map(Number);
  const next = new Date(Date.UTC(year, month, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Sesi klien uji dengan konsultan uji pada hari dan jam tertentu, lengkap dengan jadwal praktiknya. */
export async function seedSession({ dayOffset, start, end, status, createdAt, ...overrides }) {
  const schedule = await seedSchedule({ tanggal: wibDate(dayOffset) });
  return seedConsultation(schedule, status, {
    jam_mulai: start,
    jam_selesai: end,
    ...(createdAt ? { created_at: createdAt } : {}),
    ...overrides,
  });
}

export const schedulesOfKonsultan = (filters = {}) =>
  db.select("jadwal_ketersediaan", { id_konsultan: eq(identity("konsultan").idKonsultan), ...filters });

export const findSchedule = (idJadwal) => db.first("jadwal_ketersediaan", { id_jadwal: eq(idJadwal) });

export const setKonsultan = (key, values) =>
  db.update("konsultan", { id_konsultan: eq(identity(key).idKonsultan) }, values);

export const findKonsultan = (key) => db.first("konsultan", { id_konsultan: eq(identity(key).idKonsultan) });

// ── Tanya AI

export const chatSessionsOfKlien = () => db.select("chat_sessions", { user_id: eq(identity("klien").idUser) });

export async function resetChatData() {
  const ids = idsOf(await chatSessionsOfKlien(), "id");
  if (!ids.length) return;
  await db.remove("chat_messages", { session_id: inList(ids) });
  await db.remove("chat_sessions", { id: inList(ids) });
}

export async function seedChatSession({ title, messages }) {
  const session = await db.insert("chat_sessions", { user_id: identity("klien").idUser, title });
  for (const message of messages) await db.insert("chat_messages", { ...message, session_id: session.id });
  return session;
}

// ── Profil pengguna

export const findUser = (key) => db.first("users", { id_user: eq(identity(key).idUser) });

export const setUser = (key, values) => db.update("users", { id_user: eq(identity(key).idUser) }, values);

// ── Admin

export const countRows = async (table, filters = {}) => (await db.select(table, filters, "*")).length;

export const usersWithRole = (role) => countRows("users", role ? { role: eq(role) } : {});

export const konsultanWithStatus = (status) =>
  countRows("konsultan", status ? { status_verifikasi: eq(status) } : {});

// ── Basis pengetahuan

export const removeLegalDocument = (frbrUri) => db.remove("dokumen_hukum", { frbr_uri: eq(frbrUri) });

/** Kolom embedding wajib diisi; vektor nol cukup karena dokumen uji tidak dipakai untuk pencarian AI. */
const EMPTY_EMBEDDING = JSON.stringify(new Array(1024).fill(0));

export async function seedLegalDocument({ chunks, ...document }) {
  await removeLegalDocument(document.frbr_uri);
  const rows = [];
  for (const chunk of chunks) {
    rows.push(await db.insert("dokumen_hukum", { ...document, ...chunk, embedding: EMPTY_EMBEDDING }));
  }
  return rows;
}

export const chunksOfDocument = (frbrUri) =>
  db.select("dokumen_hukum", { frbr_uri: eq(frbrUri), order: "id_dokumen.asc" });
