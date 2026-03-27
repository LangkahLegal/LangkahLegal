-- =========================================================================
-- 1. PEMBUATAN TIPE ENUM (STATE MANAGEMENT KHUSUS)
-- Mengunci nilai yang diizinkan untuk menjaga integritas logika state machine.
-- =========================================================================
CREATE TYPE role_enum AS ENUM ('client', 'admin', 'konsultan');
CREATE TYPE status_pengajuan_enum AS ENUM ('pending', 'menunggu_pembayaran', 'terjadwal', 'selesai', 'dibatalkan', 'ditolak');
CREATE TYPE status_pembayaran_enum AS ENUM ('pending', 'settlement', 'expire', 'cancel', 'refund');
CREATE TYPE status_verifikasi_enum AS ENUM ('pending', 'terverifikasi', 'ditolak');
CREATE TYPE kategori_hukum_enum AS ENUM ('pidana', 'perdata', 'agama', 'umum', 'ketenagakerjaan', 'perusahaan', 'konsumen', 'pajak', 'internasional','tata_usaha_negara', 'lingkungan', 'hak_asasi_manusia', 'kesehatan', 'teknologi_informasi', 'kekayaan_intelektual', 'maritim', 'agraria', 'lainnya');
CREATE TYPE status_bursa_enum AS ENUM ('open', 'closed', 'expired', 'takedown');
CREATE TYPE status_penawaran_enum AS ENUM ('menunggu', 'diterima', 'ditolak');


-- =========================================================================
-- 2. TABEL AKUN & PROFIL (MASTER DATA)
-- =========================================================================

/* TABEL USERS 
   Berfungsi sebagai tabel autentikasi sentral untuk semua aktor (Klien, Konsultan, Admin).
*/
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,                          -- Tujuan: Primary Key. Sumber: Sistem (Auto-increment)
    nama VARCHAR(100) NOT NULL,                          -- Tujuan: Nama tampilan. Sumber: Input User (Form Registrasi)
    email VARCHAR(100) UNIQUE NOT NULL,                  -- Tujuan: ID Login & Kontak. Sumber: Input User (Form Registrasi)
    password VARCHAR(255) NOT NULL,                      -- Tujuan: Keamanan kredensial. Sumber: Input User (Dihash oleh Sistem Backend sebelum disimpan)
    role role_enum NOT NULL,                             -- Tujuan: Otorisasi RBAC. Sumber: Input User (Pilihan saat registrasi)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu pendaftaran. Sumber: Sistem (Otomatis saat INSERT)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP       -- Tujuan: Audit log modifikasi. Sumber: Sistem (Trigger DB)
);

/* TABEL KONSULTAN 
   Tabel ekstensi (relasi 1-to-1 dengan users) yang menyimpan atribut spesifik profil profesional.
*/
CREATE TABLE konsultan (
    id_konsultan SERIAL PRIMARY KEY,                     -- Tujuan: Primary Key. Sumber: Sistem (Auto-increment)
    id_user INT UNIQUE NOT NULL,                         -- Tujuan: Relasi ke tabel users. Sumber: Sistem (Di-inject backend saat konsultan mendaftar)
    
    -- Identitas Profesional
    nama_lengkap VARCHAR(100) NOT NULL,                  -- Tujuan: Nama resmi berserta gelar. Sumber: Input User (Konsultan)
    gelar_akademik VARCHAR(50),                          -- Tujuan: Validasi akademis. Sumber: Input User (Konsultan)
    pendidikan_terakhir VARCHAR(255),                    -- Tujuan: Latar belakang kampus. Sumber: Input User (Konsultan)
    kota_praktik VARCHAR(100) NOT NULL,                  -- Tujuan: Parameter yurisdiksi. Sumber: Input User (Konsultan)
    nomor_izin_praktik VARCHAR(100) UNIQUE,              -- Tujuan: Bukti legalitas (PERADI/SK). Sumber: Input User (Konsultan)
    
    -- Status & Operasional
    status_verifikasi status_verifikasi_enum DEFAULT 'pending', -- Tujuan: Keamanan platform. Sumber: Input Admin (Melalui Dashboard Admin)
    spesialisasi VARCHAR(100) NOT NULL DEFAULT 'Umum',   -- Tujuan: Filter direktori (UI). Sumber: Input User (Konsultan)
    pengalaman_tahun INT NOT NULL,                       -- Tujuan: Metrik senioritas. Sumber: Input User (Konsultan)
    tarif_per_sesi DECIMAL(12,2) NOT NULL,               -- Tujuan: Harga dasar jasa. Sumber: Input User (Konsultan)
    
    -- Komponen Visual UI (Frontend)
    foto_profil VARCHAR(255),                            -- Tujuan: URL gambar profil. Sumber: Input User (Hasil upload ke Cloud Storage)
    bio_singkat VARCHAR(100),                            -- Tujuan: Tagline di UI Card katalog. Sumber: Input User (Konsultan)
    deskripsi_lengkap TEXT,                              -- Tujuan: Detail rekam jejak (Rich Text). Sumber: Input User (Konsultan)
    linkedin VARCHAR(255),                               -- Tujuan: Validasi eksternal. Sumber: Input User (Konsultan)
    portofolio VARCHAR(255),                             -- Tujuan: Link dokumen riwayat kasus. Sumber: Input User (Konsultan)
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu profil dibuat. Sumber: Sistem (Otomatis)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu profil diedit. Sumber: Sistem (Trigger DB)
    
    CONSTRAINT fk_konsultan_user FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);


-- =========================================================================
-- 3. MODUL BURSA KASUS (FITUR AI & LELANG)
-- =========================================================================

/* TABEL BURSA KASUS 
   Tempat penyimpanan kronologi anonim hasil ekstraksi Gemini AI.
*/
CREATE TABLE bursa_kasus (
    id_bursa SERIAL PRIMARY KEY,                         -- Tujuan: Primary Key. Sumber: Sistem (Auto-increment)
    id_user INT NOT NULL,                                -- Tujuan: Pemilik kasus (Klien). Sumber: Sistem (Diekstrak backend dari JWT Token, BUKAN input form)
    
    -- Data Hasil Triase (AI Generated)
    kategori_hukum kategori_hukum_enum NOT NULL,         -- Tujuan: Klasifikasi kasus untuk filter. Sumber: Sistem (Output dari Gemini AI)
    deskripsi_kasus_awam TEXT NOT NULL,                  -- Tujuan: Ringkasan anonim untuk konsultan. Sumber: Sistem (Output dari Gemini AI hasil terjemahan pasal)
    dokumen_bukti VARCHAR(255),                          -- Tujuan: Referensi berkas kasus. Sumber: Input User (Klien upload PDF/Gambar)
    
    status_bursa status_bursa_enum DEFAULT 'open',       -- Tujuan: State lelang. Sumber: Sistem (Otomatis tertutup jika bid diterima)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu posting. Sumber: Sistem (Otomatis)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu update status. Sumber: Sistem (Trigger DB)
    
    CONSTRAINT fk_bursa_user FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
);

/* TABEL PENAWARAN KONSULTAN (BIDDING)
   Tempat konsultan mengirimkan tawaran penyelesaian pada kasus anonim.
*/
CREATE TABLE penawaran_konsultan (
    id_penawaran SERIAL PRIMARY KEY,                     -- Tujuan: Primary Key. Sumber: Sistem (Auto-increment)
    id_bursa INT NOT NULL,                               -- Tujuan: Relasi ke kasus anonim. Sumber: Sistem (Dari URL Parameter /api/cases/{id})
    id_konsultan INT NOT NULL,                           -- Tujuan: Identitas penawar. Sumber: Sistem (Diekstrak backend dari JWT Token Konsultan)
    
    pesan_tawaran TEXT NOT NULL,                         -- Tujuan: Sapaan & strategi awal. Sumber: Input User (Konsultan)
    estimasi_biaya DECIMAL(12,2) NOT NULL,               -- Tujuan: Harga penawaran tanding. Sumber: Input User (Konsultan)
    status_penawaran status_penawaran_enum DEFAULT 'menunggu', -- Tujuan: State persetujuan. Sumber: Sistem (Diubah oleh Klien saat menekan tombol "Terima")
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu bid diajukan. Sumber: Sistem (Otomatis)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu bid direspon. Sumber: Sistem (Trigger DB)
    
    CONSTRAINT fk_penawaran_bursa FOREIGN KEY (id_bursa) REFERENCES bursa_kasus(id_bursa) ON DELETE CASCADE,
    CONSTRAINT fk_penawaran_konsultan FOREIGN KEY (id_konsultan) REFERENCES konsultan(id_konsultan) ON DELETE CASCADE
);


-- =========================================================================
-- 4. MODUL KONSULTASI & TRANSAKSI (ALUR INTI)
-- =========================================================================

/* TABEL JADWAL KETERSEDIAAN 
   Inventory waktu kosong yang ditawarkan oleh konsultan.
*/
CREATE TABLE jadwal_ketersediaan (
    id_jadwal SERIAL PRIMARY KEY,                        -- Tujuan: Primary Key. Sumber: Sistem (Auto-increment)
    id_konsultan INT NOT NULL,                           -- Tujuan: Pemilik jadwal. Sumber: Sistem (Diekstrak backend dari JWT Token)
    tanggal DATE NOT NULL,                               -- Tujuan: Tanggal spesifik. Sumber: Input User (Konsultan saat setup kalender)
    jam_mulai TIME NOT NULL,                             -- Tujuan: Waktu mulai sesi. Sumber: Input User (Konsultan)
    jam_selesai TIME NOT NULL,                           -- Tujuan: Waktu akhir sesi. Sumber: Input User (Konsultan)
    status_tersedia BOOLEAN DEFAULT TRUE,                -- Tujuan: Kunci (Lock) jadwal. Sumber: Sistem (Diubah jadi FALSE saat klien mem-booking)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu jadwal dibuat. Sumber: Sistem (Otomatis)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu status berubah. Sumber: Sistem (Trigger DB)
    
    CONSTRAINT fk_jadwal_konsultan FOREIGN KEY (id_konsultan) REFERENCES konsultan(id_konsultan) ON DELETE CASCADE
);

/* TABEL PENGAJUAN KONSULTASI 
   Entitas yang menggabungkan Klien, Konsultan, dan Waktu menjadi satu kesepakatan pertemuan.
*/
CREATE TABLE pengajuan_konsultasi (
    id_pengajuan SERIAL PRIMARY KEY,                     -- Tujuan: Primary Key. Sumber: Sistem (Auto-increment)
    id_user INT NOT NULL,                                -- Tujuan: Klien pemesan. Sumber: Sistem (Diekstrak dari JWT Token Klien)
    id_jadwal INT NOT NULL,                              -- Tujuan: Slot waktu yang dibooking. Sumber: Input User (Klien klik dari UI Kalender)
    
    deskripsi_kasus TEXT NOT NULL,                       -- Tujuan: Konteks kasus (jalur reguler). Sumber: Input User (Klien mengisi form saat checkout) ATAU Sistem (Auto-copy dari deskripsi_kasus_awam jika via bursa)
    dokumen_pendukung VARCHAR(255),                      -- Tujuan: Berkas tambahan. Sumber: Input User (Upload file)
    
    tanggal_pengajuan TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Tujuan: Rekam jejak pemesanan. Sumber: Sistem (Otomatis)
    status_pengajuan status_pengajuan_enum DEFAULT 'pending', -- Tujuan: State lifecycle layanan. Sumber: Sistem (Diupdate konsultan saat acc, diupdate sistem saat bayar)
    link_zoom VARCHAR(255),                              -- Tujuan: Ruang virtual (SDG 16). Sumber: Input Admin ATAU Integrasi API Zoom
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Pembuatan record. Sumber: Sistem (Otomatis)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Perubahan status record. Sumber: Sistem (Trigger DB)
    
    CONSTRAINT fk_pengajuan_user FOREIGN KEY (id_user) REFERENCES users(id_user),
    CONSTRAINT fk_pengajuan_jadwal FOREIGN KEY (id_jadwal) REFERENCES jadwal_ketersediaan(id_jadwal)
);

/* TABEL TRANSAKSI 
   Entitas khusus keuangan yang terintegrasi dengan Payment Gateway (Midtrans).
*/
CREATE TABLE transaksi (
    id_transaksi SERIAL PRIMARY KEY,                     -- Tujuan: Internal Primary Key. Sumber: Sistem (Auto-increment)
    id_pengajuan INT UNIQUE NOT NULL,                    -- Tujuan: Relasi ke layanan. Sumber: Sistem (Mapping 1 pengajuan = 1 tagihan)
    
    order_id VARCHAR(100) UNIQUE NOT NULL,               -- Tujuan: ID Eksternal untuk Midtrans. Sumber: Sistem (Backend men-generate UUID unik seperti 'TRX-2026-ABC')
    gross_amount DECIMAL(12,2) NOT NULL,                 -- Tujuan: Total tagihan klien. Sumber: Sistem (Backend mengkalkulasi tarif konsultan + biaya admin)
    nominal_konsultan DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Tujuan: Hak bersih konsultan. Sumber: Sistem (Kalkulasi Backend)
    komisi_platform DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Tujuan: Revenue LangkahLegal. Sumber: Sistem (Kalkulasi Backend)
    
    metode_pembayaran VARCHAR(50),                       -- Tujuan: Rekam cara bayar (Gopay/BCA). Sumber: Sistem (Data dikirim oleh Webhook Midtrans)
    status_pembayaran status_pembayaran_enum DEFAULT 'pending', -- Tujuan: Status lunas/belum. Sumber: Sistem (Diubah murni berdasarkan respons Webhook Midtrans, bukan user)
    waktu_bayar TIMESTAMP,                               -- Tujuan: Waktu mutasi berhasil. Sumber: Sistem (Data dikirim oleh Webhook Midtrans)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu invoice terbit. Sumber: Sistem (Otomatis)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu status bayar berubah. Sumber: Sistem (Trigger DB)
    
    CONSTRAINT fk_transaksi_pengajuan FOREIGN KEY (id_pengajuan) REFERENCES pengajuan_konsultasi(id_pengajuan) ON DELETE CASCADE
);


-- =========================================================================
-- 5. MODUL RATING & ULASAN (SOCIAL PROOF)
-- =========================================================================

/* TABEL RATING ULASAN
   Menyimpan penilaian performa untuk membangun kepercayaan sistem.
*/
CREATE TABLE rating_ulasan (
    id_rating SERIAL PRIMARY KEY,                        -- Tujuan: Primary Key. Sumber: Sistem (Auto-increment)
    id_pengajuan INT UNIQUE NOT NULL,                    -- Tujuan: Mencegah spam review (1 layanan 1 ulasan). Sumber: Sistem (Backend melempar ID pengajuan terkait)
    id_konsultan INT NOT NULL,                           -- Tujuan: Agregasi skor profil. Sumber: Sistem (Disalin backend dari id_konsultan di tabel pengajuan)
    
    skor_rating INT NOT NULL CHECK (skor_rating >= 1 AND skor_rating <= 5), -- Tujuan: Nilai bintang UI. Sumber: Input User (Klien klik bintang 1-5)
    ulasan_teks TEXT,                                    -- Tujuan: Ulasan tertulis. Sumber: Input User (Klien mengetik teks)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu review dibuat. Sumber: Sistem (Otomatis)
    
    CONSTRAINT fk_rating_pengajuan FOREIGN KEY (id_pengajuan) REFERENCES pengajuan_konsultasi(id_pengajuan) ON DELETE CASCADE,
    CONSTRAINT fk_rating_konsultan FOREIGN KEY (id_konsultan) REFERENCES konsultan(id_konsultan) ON DELETE CASCADE
);


-- =========================================================================
-- 6. MODUL KECERDASAN BUATAN (VECTOR DATABASE & RAG)
-- Mengelola penyimpanan pasal dan fungsi komputasi Semantic Search.
-- =========================================================================

-- Aktifkan ekstensi untuk memungkinkan PostgreSQL menyimpan matriks angka (embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Pembuatan Schema logis agar tabel AI terpisah secara rapi dari tabel operasional
CREATE SCHEMA IF NOT EXISTS ai;

/* TABEL DOKUMEN HUKUM (KNOWLEDGE BASE)
   Menyimpan teks perundang-undangan (chunks) yang telah diubah menjadi vektor.
*/
CREATE TABLE ai.dokumen_hukum (
    id_dokumen SERIAL PRIMARY KEY,                       -- Tujuan: Primary Key. Sumber: Sistem (Auto-increment)
    
    -- Metadata Dokumen
    kategori kategori_hukum_enum NOT NULL,               -- Tujuan: Klasifikasi domain hukum. Sumber: Input Admin (saat injeksi data awal)
    sumber_undang_undang VARCHAR(255) NOT NULL,          -- Tujuan: Sitasi referensi (contoh: "KUHP"). Sumber: Input Admin
    pasal_bagian VARCHAR(100) NOT NULL,                  -- Tujuan: Rujukan spesifik (contoh: "Pasal 378"). Sumber: Input Admin
    
    -- Data RAG Inti
    isi_teks TEXT NOT NULL,                              -- Tujuan: Konteks untuk Prompt Gemini (Chunk). Sumber: Input Admin (Potongan teks UU)
    
    -- Vektor 768 dimensi (Disesuaikan untuk model text-embedding-004 milik Google Gemini)
    embedding vector(768) NOT NULL,                      -- Tujuan: Pencarian semantik (Cosine Similarity). Sumber: Sistem (Dihasilkan oleh Embedding Model Gemini)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- Tujuan: Waktu dokumen dimasukkan. Sumber: Sistem
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP       -- Tujuan: Audit log modifikasi. Sumber: Sistem
);

-- Optimasi Pencarian Vektor (HNSW Index)
-- Tujuan: Memastikan pencarian Cosine Similarity tetap secepat kilat (milidetik) walau ada ribuan pasal.
CREATE INDEX ON ai.dokumen_hukum USING hnsw (embedding vector_cosine_ops);

/* FUNGSI RETRIEVAL (REMOTE PROCEDURE CALL / RPC)
   Fungsi ini akan dipanggil oleh backend Python untuk menarik konteks secara langsung di dalam PostgreSQL.
*/
CREATE OR REPLACE FUNCTION ai.cari_pasal_relevan (
  query_embedding vector(768), -- Vektor keluhan klien dari Backend
  match_threshold float,       -- Batas minimal kemiripan (misal: 0.6)
  match_count int              -- Jumlah pasal yang ditarik (Top-K)
)
RETURNS TABLE (
  id_dokumen int,
  sumber_undang_undang varchar,
  pasal_bagian varchar,
  isi_teks text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  -- Tujuan: Melakukan komputasi jarak vektor (Cosine Distance) di level database
  SELECT
    dh.id_dokumen,
    dh.sumber_undang_undang,
    dh.pasal_bagian,
    dh.isi_teks,
    1 - (dh.embedding <=> query_embedding) AS similarity 
  FROM ai.dokumen_hukum dh
  WHERE 1 - (dh.embedding <=> query_embedding) > match_threshold
  ORDER BY dh.embedding <=> query_embedding -- Urutkan dari jarak terdekat
  LIMIT match_count;
$$;


-- =========================================================================
-- 7. AUDIT TRAIL (AUTO-UPDATE TIMESTAMP TRIGGER)
-- Mekanisme otomatis tingkat basis data untuk memperbarui `updated_at`.
-- =========================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Tujuan: Menimpa nilai updated_at dengan jam server database saat terjadi UPDATE query.
    -- Sumber Data: Sistem Mesin Database (PostgreSQL Engine).
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Pemasangan Trigger ke seluruh tabel operasional
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_konsultan_modtime BEFORE UPDATE ON konsultan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bursa_modtime BEFORE UPDATE ON bursa_kasus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_penawaran_modtime BEFORE UPDATE ON penawaran_konsultan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jadwal_modtime BEFORE UPDATE ON jadwal_ketersediaan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pengajuan_modtime BEFORE UPDATE ON pengajuan_konsultasi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transaksi_modtime BEFORE UPDATE ON transaksi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dokumen_hukum_modtime BEFORE UPDATE ON ai.dokumen_hukum FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();