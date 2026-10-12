CREATE_TRANSACTION = {
    "summary": "Buat transaksi pembayaran Midtrans",
    "description": """
Membuat transaksi Snap Midtrans untuk pengajuan konsultasi yang sudah disetujui konsultan.

Syarat:
- Hanya role `client` yang boleh memanggil.
- Status pengajuan harus `menunggu_pembayaran`.
- Tarif diambil otomatis dari `konsultan.tarif_per_sesi`.

Response berisi `snap_token` yang digunakan frontend untuk membuka popup pembayaran Midtrans.
""",
}

MIDTRANS_NOTIFICATION = {
    "summary": "Webhook notifikasi pembayaran dari Midtrans",
    "description": """
Endpoint ini dipanggil oleh server Midtrans secara otomatis saat status pembayaran berubah.

**PENTING**: Endpoint ini TIDAK memerlukan autentikasi user (Bearer token).
Verifikasi dilakukan oleh Midtrans SDK menggunakan server key + signature key.

URL ini harus didaftarkan di Midtrans Dashboard:
- Settings → Payment Notification URL
- Format: `https://your-domain.com/api/v1/payments/notification`
""",
}

GET_PAYMENT_STATUS = {
    "summary": "Cek status pembayaran",
    "description": """
Mengambil status pembayaran terakhir untuk suatu pengajuan konsultasi.
Bisa dipanggil oleh client (pemilik pengajuan) atau konsultan terkait.
""",
}

SYNC_PAYMENT_STATUS = {
    "summary": "Sinkronisasi status pembayaran dari Midtrans",
    "description": """
Endpoint ini dipanggil oleh frontend setelah Snap popup `onSuccess` / `onPending`.

Karena webhook Midtrans bisa terlambat (atau tidak sampai jika ngrok mati),
endpoint ini langsung query status ke Midtrans Core API berdasarkan order_id,
lalu update tabel `transaksi` dan `pengajuan_konsultasi` sesuai hasilnya.

Ini adalah mekanisme **fallback** — webhook tetap jadi primary.
""",
}
