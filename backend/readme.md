# Dokumentasi Perubahan Backend - Fitur Konsultasi

Daftar perubahan dan perbaikan pada sistem backend LangkahLegal untuk memenuhi alur bisnis "Katalog ke Booking".

## Perubahan Terbaru (Maret 2026)

### 1. Perbaikan Database & Row Level Security (RLS)
- **Status RLS**: Mengaktifkan kembali RLS pada tabel `users`, `konsultan`, dan `jadwal_ketersediaan`.
- **Policy Keamanan**: 
  - Menambahkan policy `SELECT` publik untuk katalog konsultan dan jadwal agar dapat diakses tanpa login (sesuai kebutuhan landing page).
  - Menambahkan policy `INSERT` khusus untuk `client` pada tabel pengajuan.
  - Menambahkan policy `UPDATE` status ketersediaan jadwal oleh sistem.

### 2. Router & Endpoint Baru (`consultants.py`)
- **GET `/{id_konsultan}/schedules`**: Menampilkan jadwal aktif (`status_tersedia: true`) untuk konsultan tertentu.
- **POST `/schedules`**: Endpoint khusus bagi Konsultan untuk mengunggah slot ketersediaan waktu.

### 3. Logika Transaksi & Flow Kasus (`consultations.py`)
- **Auto-Lock Scheduling**: Penambahan logika otomatis di mana `status_tersedia` pada tabel jadwal akan berubah menjadi `false` seketika setelah `client` melakukan `POST` pengajuan.
- **Join Query Optimization**: Implementasi *Nested Join* pada penarikan list konsultasi (Pengajuan -> Jadwal -> Konsultan -> User) sehingga data yang muncul di frontend lengkap dengan nama dan spesialisasi.
- **Status Management**: 
  - Implementasi alur status: `pending` -> `disetujui/ditolak` -> `menunggu_pembayaran` -> `completed`.
  - Penambahan fitur **Rollback Jadwal**: Jika konsultan menolak (`rejected`) pengajuan, slot jadwal otomatis terbuka kembali (`true`).

### 4. Fitur Feedback (Rating)
- Penambahan endpoint `POST /{id_pengajuan}/rating` dengan validasi: Rating hanya bisa diberikan jika status konsultasi sudah `completed`.