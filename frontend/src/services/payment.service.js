import api from "@/lib/axios";

/**
 * Service untuk integrasi pembayaran Midtrans.
 * Berkomunikasi dengan backend endpoint /api/v1/payments/*
 */
export const paymentService = {
  /**
   * Membuat transaksi pembayaran baru via Midtrans Snap.
   * Backend akan mengembalikan snap_token untuk membuka popup pembayaran.
   * @param {number} id_pengajuan - ID pengajuan konsultasi
   * @returns {{ snap_token: string, redirect_url: string, order_id: string }}
   */
  createTransaction: async (id_pengajuan) => {
    const response = await api.post("/payments/create-transaction", {
      id_pengajuan,
    });
    return response.data;
  },

  /**
   * Cek status pembayaran untuk suatu pengajuan.
   * @param {number} id_pengajuan - ID pengajuan konsultasi
   * @returns {{ data: object | null }}
   */
  getPaymentStatus: async (id_pengajuan) => {
    const response = await api.get(`/payments/status/${id_pengajuan}`);
    return response.data;
  },

  /**
   * Sinkronisasi status pembayaran dari Midtrans ke database.
   * Dipanggil setelah Snap onSuccess/onPending sebagai fallback
   * jika webhook Midtrans belum sampai ke backend.
   * @param {number} id_pengajuan - ID pengajuan konsultasi
   * @returns {{ synced: boolean, status_pembayaran: string, status_pengajuan?: string }}
   */
  syncPaymentStatus: async (id_pengajuan) => {
    const response = await api.post(`/payments/sync/${id_pengajuan}`);
    return response.data;
  },
};
