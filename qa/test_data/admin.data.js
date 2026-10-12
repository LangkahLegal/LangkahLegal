import path from "node:path";
import { FILES_DIR } from "../support/env.js";
import { ACCOUNTS } from "./accounts.js";

/** Konsultan yang menunggu verifikasi, seperti terlihat oleh admin. */
export const APPLICANT = {
  name: ACCOUNTS["konsultan baru"].konsultan.nama_lengkap,
  email: ACCOUNTS["konsultan baru"].email,
  specialization: "Perdata",
  priceLabel: "Rp 150.000",
};

export const VERIFIED_CONSULTANT = { name: ACCOUNTS.konsultan.konsultan.nama_lengkap };

export const VERIFICATION = {
  noMatchSearch: "zzzz-tidak-ada",
  rejectionReason: "Nomor izin tidak terdaftar (data uji SIT)",
  blankReason: "   ",
  approveConfirmTitle: "Verifikasi Konsultan?",
  notFoundMessage: "Data Konsultan Tidak Ditemukan",
  unknownId: 999999999,
};

/** Daftar pengajuan yang tidak bisa dibuat lewat aplikasi, untuk skenario @stub. */
export const STUBBED_APPLICANTS = {
  empty: { data: [], total: 0, counts: { all: 0, pending: 0, terverifikasi: 0, ditolak: 0 } },
  withoutName: {
    data: [
      { id_konsultan: 990001, nama_lengkap: "Fajar Nugroho", spesialisasi: "Pidana", kota_praktik: "Bandung", pengalaman_tahun: 4, tarif_per_sesi: 200000, status_verifikasi: "pending" },
      { id_konsultan: 990002, nama_lengkap: null, spesialisasi: "Perdata", kota_praktik: "Jakarta", pengalaman_tahun: 2, tarif_per_sesi: 100000, status_verifikasi: "pending" },
    ],
    total: 2,
    counts: { all: 2, pending: 2, terverifikasi: 0, ditolak: 0 },
    visibleName: "Fajar Nugroho",
  },
};

/** Dokumen hukum kecil milik pengujian, supaya dokumen sungguhan tidak ikut diubah. */
export const LEGAL_DOCUMENT = {
  frbr_uri: "/akn/id/act/uu/2099/999",
  nama_uu: "Undang-Undang Uji SIT LangkahLegal",
  nomor_uu: "999",
  tahun_uu: 2099,
  kategori: "umum",
  status_hukum: "berlaku",
  sumber_undang_undang: "UU Uji SIT",
  statusLabel: /berlaku/i,
  numberLabel: "999 / 2099",
  detailLabel: "Nomor 999 Tahun 2099",
  chunks: [
    { node_id: "SIT_PASAL_1", pasal_bagian: "Pasal 1", isi_teks: "Dalam Undang-Undang ini yang dimaksud dengan data uji adalah data SIT.", node_type: "pasal" },
    { node_id: "SIT_PASAL_2", pasal_bagian: "Pasal 2", isi_teks: "Undang-Undang ini berlaku hanya untuk pengujian otomatis.", node_type: "pasal" },
  ],
  editedText: "Dalam Undang-Undang ini yang dimaksud dengan data uji adalah data SIT yang sudah disunting.",
};

export const KNOWLEDGE_SEARCH = { keyword: "pidana", category: { label: "Pidana", query: "pidana" } };

/** Isian formulir unggah dokumen hukum. */
export const DOCUMENT_UPLOAD = {
  name: "UU Perlindungan Data Pribadi (uji SIT)",
  number: "27",
  year: "2022",
  invalidYear: "3000",
  category: "Teknologi Informasi",
  legalStatus: "Berlaku",
  file: path.join(FILES_DIR, "bukti.pdf"),
};

/** Proses latar belakang dokumen yang disimulasikan, karena ekstraksi butuh layanan embedding. */
export const JOBS = {
  queued: { job_id: "sit-job-1", status: "queued" },
  completed: { status: "completed", message: "Proses dokumen selesai!" },
  failed: { id: "sit-job-gagal", reply: { status: "failed", error: "PDF hasil scan" }, toast: "Gagal memproses dokumen: PDF hasil scan" },
};

export const KNOWLEDGE_MESSAGES = {
  processing: /Sistem sedang memproses ekstraksi/,
  completed: "Proses dokumen selesai!",
  deleted: "Dokumen berhasil dihapus!",
  chunkSaved: "Berhasil menyimpan perubahan pasal!",
  noData: "Tidak Ada Data",
};
