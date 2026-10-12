GET_ALL_CONSULTANTS = {
    "summary": "Ambil katalog konsultan aktif",
    "description": """
Mengambil daftar konsultan aktif untuk halaman katalog/landing.

Query opsional:
- `spesialisasi`: filter berdasarkan kata kunci spesialisasi.

Response sudah diformat untuk frontend card list:
- `id`, `name`, `spec`, `rating`, `reviews`, `status`, `foto_profil`.
""",
}

GET_MY_SCHEDULES = {
    "summary": "Konsultan melihat semua slot jadwal miliknya",
    "description": "Menampilkan daftar jadwal milik konsultan login, termasuk nama klien jika slot sudah dibooking.",
}

GET_CONSULTANT_DASHBOARD_STATS = {
    "summary": "Statistik dashboard konsultan",
}

GET_PENDING_REQUESTS = {
    "summary": "Daftar pengajuan pending untuk konsultan",
    "description": "Menampilkan daftar pengajuan konsultasi dengan status `pending` untuk konsultan login.",
}

GET_ACTIVE_REQUESTS = {
    "summary": "Daftar pengajuan aktif untuk konsultan",
    "description": "Menampilkan daftar pengajuan konsultasi dengan status `terjadwal` untuk konsultan login.",
}

GET_CONSULTANT_DETAIL = {
    "summary": "Detail profil konsultan publik",
    "description": """
Mengambil profil detail konsultan berdasarkan `id_konsultan`.

Response mencakup:
- data profil konsultan
- data users terkait (nama, email, foto_profil)
- rating agregat
- jadwal_ketersediaan aktif
""",
}

GET_CONSULTANT_SCHEDULES = {
    "summary": "Lihat jadwal tersedia per konsultan",
    "description": "Mengembalikan hanya slot jadwal yang masih tersedia (`status_tersedia=true`) untuk pengajuan client.",
}

UPLOAD_JADWAL_KONSULTAN = {
    "summary": "Konsultan menambah slot jadwal",
    "description": "Khusus role konsultan untuk menambahkan slot jadwal ketersediaan baru.",
}

HAPUS_JADWAL_KONSULTAN = {
    "summary": "Konsultan menghapus slot jadwal",
    "description": "Slot hanya bisa dihapus jika belum dibooking client (`status_tersedia=true`).",
}

EDIT_JADWAL_KONSULTAN = {
    "summary": "Konsultan mengubah slot jadwal",
    "description": "Slot hanya bisa diubah jika belum dibooking client.",
}

TOGGLE_SCHEDULE_SLOT = {
    "summary": "Toggle status ketersediaan per slot",
    "description": "Mengubah `status_tersedia` untuk satu slot jadwal tertentu.",
}

TOGGLE_GLOBAL_ACTIVE = {
    "summary": "Toggle status aktif konsultan",
    "description": "Mengubah status global konsultan (`is_active`) untuk kontrol tampil di katalog publik.",
}

GET_DAFTAR_KLIEN = {
    "summary": "Daftar Klien Terjadwal (Belum Lewat)",
    "description": """
Page Daftar Klien: Menampilkan pengajuan berstatus 'terjadwal' yang jadwalnya belum lewat waktu sekarang.
""",
}

GET_RIWAYAT_KONSULTAN = {
    "summary": "Riwayat Konsultan",
    "description": """
Page Riwayat Konsultan: Semua pengajuan KECUALI yang berstatus 'pending'.
Menampilkan status: menunggu_pembayaran, terjadwal, selesai, dibatalkan, ditolak, kedaluwarsa.
Disorting berdasarkan terbaru ke terlama.
""",
}
