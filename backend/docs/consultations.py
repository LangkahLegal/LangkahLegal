BUAT_PENGAJUAN_KONSULTASI = {
    "summary": "Buat pengajuan konsultasi + upload dokumen pendukung",
    "description": """
Membuat pengajuan konsultasi baru (khusus role client).

Mendukung 2 format request:
1. `application/json` untuk pengajuan tanpa file.
2. `multipart/form-data` untuk pengajuan dengan file dokumen pendukung.

Field wajib:
- `id_jadwal`: ID slot jadwal yang dipilih client.
- `deskripsi_kasus`: Ringkasan masalah hukum.
- `jam_mulai`: ISO 8601 timestamp, contoh `2026-04-13T09:00:00+07:00`.
- `jam_selesai`: ISO 8601 timestamp, harus lebih besar dari jam_mulai.

Upload dokumen:
- Gunakan field file `dokumen_pendukung_files` (bisa lebih dari satu file).
- Format yang diizinkan: PDF / JPG / JPEG / PNG / WEBP / GIF.
- File disimpan ke Supabase bucket `berkas-pendukung`, metadata tersimpan di tabel `dokumen_pendukung`.
""",
    "response_description": "ID pengajuan, status pengajuan, dan list metadata dokumen pendukung yang berhasil disimpan.",
}

GET_MY_CONSULTATIONS = {
    "summary": "Ambil daftar konsultasi milik user login",
    "description": """
Mengembalikan daftar pengajuan konsultasi berdasarkan role user:
- Client: hanya pengajuan milik dirinya.
- Konsultan: hanya pengajuan yang ditujukan ke dirinya.

Response sudah termasuk relasi:
- jadwal_ketersediaan
- profil singkat konsultan
- dokumen_pendukung (one-to-many)
""",
}

GET_DETAIL_PENGAJUAN = {
    "summary": "Ambil detail satu pengajuan konsultasi",
    "description": """
Mengambil detail lengkap pengajuan konsultasi berdasarkan `id_pengajuan`.

Akses dibatasi:
- Client hanya boleh melihat pengajuan miliknya.
- Konsultan hanya boleh melihat pengajuan yang terkait dengan profil konsultannya.

Response mencakup data relasi jadwal, user, dan daftar dokumen_pendukung.
""",
}

ASSIGN_SCHEDULE_TO_CLAIM = {
    "summary": "Konsultan atur jadwal untuk klaim bursa",
    "description": """
Khusus konsultan. Digunakan setelah konsultan mengklaim kasus dari bursa.
Konsultan memilih slot jadwal miliknya, lalu sistem:
- Mengisi tanggal_pengajuan, jam_mulai, jam_selesai, id_jadwal pada pengajuan.
- Mengubah status menjadi `menunggu_pembayaran`.
""",
}

UPDATE_ZOOM_LINK = {
    "summary": "Konsultan mengatur link Zoom untuk konsultasi",
    "description": """
Khusus konsultan. Digunakan untuk mengisi atau mengubah link Zoom meeting
untuk sesi konsultasi yang sudah terjadwal.
""",
}

TANDAI_KONSULTASI_SELESAI = {
    "summary": "Klien menandai konsultasi telah selesai",
    "description": """
Khusus role client.
Digunakan setelah sesi konsultasi (Zoom) selesai untuk mengubah status dari `terjadwal` menjadi `selesai`.
""",
}

GET_BOOKED_SLOTS = {
    "description": """Mengambil daftar jam yang sudah terisi (booked) untuk konsultan tertentu.
Digunakan oleh frontend untuk menonaktifkan pilihan jam di Schedule Picker.""",
}

GET_DOCUMENTS = {
    "summary": "Lihat daftar dokumen pendukung",
    "description": """
Mengambil semua dokumen pendukung yang terkait dengan pengajuan konsultasi tertentu.
Akses dibatasi: hanya pemilik pengajuan (client) atau konsultan terkait yang bisa melihat.
""",
}

UPLOAD_DOCUMENT = {
    "summary": "Upload dokumen pendukung tambahan",
    "description": """
Upload file dokumen pendukung tambahan untuk pengajuan yang sudah ada.
Hanya pemilik pengajuan (client) yang boleh menambahkan dokumen.
Format: PDF / JPG / JPEG / PNG / WEBP / GIF. Maks 10MB per file.
""",
}

DELETE_DOCUMENT = {
    "summary": "Hapus dokumen pendukung",
    "description": """
Menghapus satu dokumen pendukung berdasarkan `id_dokumen`.
Hanya pemilik pengajuan (client) yang boleh menghapus dokumen miliknya.
File juga akan dihapus dari Supabase Storage.
""",
}

SUBMIT_RATING = {
    "summary": "Berikan rating dan ulasan untuk konsultasi yang sudah selesai",
    "description": "Khusus klien. Digunakan untuk memberi rating dan menandai konsultasi telah selesai.",
}

GET_CLIENT_HISTORY = {
    "summary": "Riwayat konsultasi klien",
    "description": """
Khusus role client. Mengembalikan seluruh pengajuan milik klien dalam urutan tampil:
sesi `terjadwal`, lalu `pending`, lalu `menunggu_pembayaran`, lalu sisanya dari yang terbaru.
Disertai `total_sesi_selesai`.
""",
}
