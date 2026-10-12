/** Hasil yang bisa dikembalikan jendela pembayaran Midtrans (Snap) kepada aplikasi. */
export const SNAP_OUTCOMES = {
  "menyelesaikan pembayaran": { callback: "onSuccess", synced: { synced: true, status_pembayaran: "settlement" } },
  "menunda pembayaran": { callback: "onPending" },
  "menolak pembayaran": { callback: "onError" },
};

export const PAYMENT_STATUS = { pending: "pending", settled: "settlement" };

export const PAYMENT_MESSAGES = {
  success: "Pembayaran Berhasil!",
  pending: "Pembayaran tertunda",
  failed: "Pembayaran gagal. Silakan coba lagi.",
  notPayable: "Pengajuan tidak dalam status yang memerlukan pembayaran",
  loadFailed: "Gagal Memuat Pembayaran",
};

export const UNKNOWN_CONSULTATION_ID = 999999999;
