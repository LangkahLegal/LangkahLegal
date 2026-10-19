POSTING_KASUS_ANONIM = {
    "summary": "Client posting kasus anonim ke bursa (dengan file upload)",
    "description": """
Membuat kasus baru pada bursa kasus.

Khusus role client. Kasus yang berhasil diposting akan berstatus `open`
dan dapat diklaim langsung oleh konsultan.

Mendukung upload file dokumen pendukung (opsional).
Gunakan field `dokumen_pendukung_files` untuk upload file (bisa lebih dari satu).
Format yang diizinkan: PDF / JPG / JPEG / PNG / WEBP.
""",
}

LIHAT_BURSA_KASUS = {
    "summary": "Konsultan melihat daftar bursa kasus open",
    "description": """
Khusus role konsultan. Mengambil kasus bursa dengan status `open`.

Filter opsional (semuanya dikerjakan di server dan bisa digabung):
- `kategori`: `pidana`, `perdata`, `umum`.
- `search`: kata kunci pada deskripsi kasus.
- `jadwal`: `akan_datang` (hari ini dan seterusnya), `hari_ini`, `besok`, `7_hari`, `30_hari` (tanggal konsultasi, WIB).
- `waktu`: `pagi`, `siang`, `sore`, `malam` (jam mulai konsultasi).
- `dokumen`: `ada` atau `tidak` (dokumen bukti).
- `urutkan`: `terbaru` (bawaan), `terlama`, `jadwal_terdekat`.

`total` berisi jumlah kasus yang cocok dengan filter.
""",
}

KLAIM_KASUS = {
    "summary": "Konsultan klaim langsung sebuah kasus dari bursa",
    "description": """
Khusus role konsultan. Konsultan langsung mengambil/mengklaim kasus dari bursa.

Saat klaim berhasil:
- Status bursa berubah menjadi `closed`.
- Otomatis dibuatkan draf pengajuan konsultasi (tabel `pengajuan_konsultasi`).
""",
}
