# Ringkasan Perbaikan Keamanan

Tanggal: 10 November 2026 · Branch: `feat/middleware` · Commit: `357be5d feat: fix vulnerability issue`

Dokumen ini merangkum audit keamanan LangkahLegal dan perbaikannya dalam bentuk sebelum/sesudah. Kerentanan yang masih terbuka ada di `VULNERABILITIES.md`; cara menjalankan audit ada di `README.md`.

## 1. Hasil audit

| Sumber | Sebelum | Sesudah |
|---|---|---|
| npm audit `frontend/` | 1 critical, 13 high, 12 moderate, 1 low | 0 critical, 0 high, 10 moderate (alat lint/build) |
| npm audit `qa/` | 0 | 0 |
| pip-audit `backend/` | 16 advisories (`python-multipart`) | 0 |
| gitleaks (riwayat git) | 12 temuan, 2 di antaranya token aktif | 0 (token dicabut, false positive tercatat) |
| bandit | 2 high, 1 low | 1 low (false positive, tercatat) |
| semgrep | 2 medium | 1 medium (false positive, tercatat) |
| Temuan manual | 33 | 5 terbuka, 5 diterima |
| Kode keluar `npm run audit:security` | 1 (ada critical/high) | 0 |

## 2. Alat audit

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Cara menjalankan | Tidak ada; setiap alat dijalankan manual | `npm run audit:security` di `qa/` menjalankan npm audit, pip-audit, bandit, semgrep, dan gitleaks sekaligus |
| Laporan | Tidak ada | `qa/security/reports/<tanggal>/summary.md` + JSON mentah tiap alat, termasuk temuan manual yang masih terbuka |
| Daftar kerentanan | Tidak ada | `VULNERABILITIES.md` dengan severity, prioritas P1–P4, status, penjelasan bisnis, dan perbaikan |
| Checklist audit manual | Tidak ada | Bagian "Audit manual" di `README.md` |
| False positive | Tidak tercatat | `gitleaks.toml`, `# nosec`, `# nosemgrep`, dan dicatat di `VULNERABILITIES.md` |
| Integrasi CI | Tidak bisa | Skrip keluar dengan kode 1 bila ada temuan critical/high |

## 3. Dependensi

| Paket | Sebelum | Sesudah | Risiko yang ditutup |
|---|---|---|---|
| `python-multipart` | 0.0.6 | 0.0.33 | DoS lewat body multipart pada semua form unggahan |
| `next` | 15.2.8 | 15.5.29 | Cache key confusion di Image Optimization (critical), celah `sharp` |
| `postcss` (di dalam `next`) | 8.4.31 | 8.5.32 (`overrides`) | XSS saat memproses CSS tak tepercaya |
| `axios`, `follow-redirects`, `ws`, `zod`, `form-data`, `js-yaml`, `nanoid`, dll. | Versi rentan | Versi aman (`npm audit fix`) | ReDoS, kebocoran header saat redirect, DoS |

## 4. Backend

| Area | Sebelum | Sesudah |
|---|---|---|
| CORS | Semua `*.vercel.app` diizinkan dengan kredensial | Hanya `langkahlegal.vercel.app`, `staging-langkahlegal.vercel.app`, `*.langkahlegal.com`, localhost |
| Dokumentasi API | `/docs`, `/redoc`, `/openapi.json` terbuka di produksi | Dimatikan saat `APP_ENV=production` |
| Email notifikasi | Nama dan pesan disisipkan mentah ke HTML | Di-escape (`html.escape`), baris baru jadi `<br/>` |
| Log webhook Midtrans | Seluruh payload transaksi dicatat | Hanya `order_id` dan status |
| Pesan error | Membawa isi exception (`Otorisasi gagal: …`, pesan Midtrans, `step: … Error: …`) | Pesan generik; detail hanya di log server |
| Panjang teks | Tanpa batas (deskripsi, ulasan, nama, bio, alasan) | Dibatasi, mis. deskripsi 5.000, ulasan 500, nama 100 karakter |
| Format tanggal/jam | Tidak dicek; nilai aneh menghasilkan 500 | Divalidasi pola `YYYY-MM-DD` dan `HH:MM[:SS]`, nilai salah → 422 |
| Kategori hukum | Strin| Log webhook Midtrans | Seluruh payload transaksi dicatat | Hanya `order_id` dan status |
| Pesan error | Membawa isi exception (`Otorisasi gagal: …`, pesan Midtrans, `step: … Error: …`) | Pesan generik; detail hanya di log server |g apa pun diterima (ada data `string` di bursa) | Hanya `pidana`, `perdata`, `umum` |
| URL profil (`linkedin`, `portofolio`, `foto_profil`) | Tidak dicek di backend | Wajib `https` |
| Kata sandi | Panjang minimal hanya dicek di frontend | Minimal 6 karakter juga di API |
| Unggahan gambar | Hanya ekstensi dan `Content-Type` dari klien | Isi file dicek (magic bytes PNG/JPEG/WEBP/GIF) |
| Rate limit login | `login-password` dan `verify-otp` tanpa batas di aplikasi | 10 percobaan/menit per email |
| Respons bursa | Menyertakan `id_user` pemilik kasus "anonim" | `id_user` dihapus |
| Profil publik konsultan | Semua kolom, termasuk email, portofolio, nomor izin, alasan penolakan | Hanya kolom publik |
| Portofolio | URL publik permanen | Signed URL 1 jam |
| Pencarian admin dokumen hukum | Input langsung ke filter `or_` | Dibersihkan `clean_search` |
| Asisten AI | Pesan klien tanpa penanda di prompt klasifikasi, tanpa instruksi penahan | Pesan dibungkus penanda, instruksi sistem menganggap pesan klien sebagai data |
| Route root API | `/consultations/`, `/cases/`, `/consultants/`, `/admin/documents/` | Tanpa garis miring akhir, agar tidak ada redirect yang keluar dari proxy |

## 5. Frontend

| Area | Sebelum | Sesudah |
|---|---|---|
| Header keamanan | Tidak ada | `X-Content-Type-Options`, `X-Frame-Options`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, HSTS |
| Draf kasus Tanya AI | Tertinggal di `localStorage` setelah logout | Dihapus saat logout |
| `NEXT_PUBLIC_IMGBB_API_KEY` | Masih ada di `.env.example` | Dihapus (unggah foto sudah lewat backend) |

## 6. Penyimpanan sesi

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Lokasi token | Access token dan refresh token di `localStorage` | Cookie `httpOnly` yang disetel backend |
| Bisa dibaca JavaScript (dan XSS) | Ya | Tidak |
| Cara token dikirim | Header `Authorization: Bearer …` | Cookie dikirim otomatis oleh browser |
| Alamat API dari browser | Langsung ke backend Railway | `/api/v1` di domain frontend, diteruskan Next.js `rewrites()` ke backend |
| Atribut cookie | `SameSite=None` (bila dipakai), atribut domain dari env | `SameSite=Lax`, `Secure` di produksi, tanpa atribut domain |
| Perlindungan CSRF | Tidak relevan (token di header) | `SameSite=Lax` menahan POST/PUT/DELETE lintas situs |
| Isi `localStorage` | Token, refresh token, peran | Penanda sesi (`ll_session`), metode login, peran |
| Refresh atau logout gagal | Cookie tidak dibersihkan | Cookie selalu dihapus |
| Pengguna yang sedang login | - | Token lama dihapus otomatis; perlu login ulang sekali |
| Harness SIT | Menanam token di `localStorage` | Menanam cookie; state `@continue` membawa cookie; skenario sesi dan logout memeriksa cookie |

## 7. Rahasia dan akses data

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Token sesi akun uji di repo publik (commit `96a4b79`) | Refresh token masih berlaku | Kelima akun `sit.*` di-logout global; token lama ditolak (400) |
| Akses langsung ke tabel Supabase dengan anon key | `users`, `transaksi`, `dokumen_pendukung`, `konsultan`, `bursa_kasus`, `rating_ulasan`, `jadwal_ketersediaan`, statistik transaksi bisa dibaca tanpa login | **Belum berubah**: SQL perbaikan siap di `backend/sql/enable_rls.sql`, menunggu dijalankan |
| Bucket `portofolio` | Publik | Kode memakai signed URL; bucket **masih publik** sampai diubah di dashboard |

## 8. Verifikasi

| Uji | Hasil |
|---|---|
| Audit keamanan (`npm run audit:security`) | 0 critical/high, kode keluar 0 |
| Uji backend dengan TestClient | 14/14 lolos |
| Uji cookie end-to-end di browser lokal | 13/13 lolos |
| Build produksi frontend | Berhasil |
| `bddgen` | Berhasil |
| SIT regression | **Belum dijalankan** |

## 9. Tindak lanjut

| No | Tindakan | Prioritas | Penanggung jawab |
|---|---|---|---|
| 1 | Jalankan `backend/sql/enable_rls.sql` di Supabase SQL Editor; pastikan backend produksi memakai `SUPABASE_SERVICE_ROLE_KEY` | P1 (critical) | Pemegang akses Supabase |
| 2 | Jalankan `npm run regression` (atau `npm run sit`) di `qa/` | P1 | QA |
| 3 | Uji di preview Vercel: login, refresh sesi, unggah dokumen > 4,5 MB, asisten AI (batas proxy 120 detik); pastikan `NEXT_PUBLIC_API_URL` berisi URL backend Railway | P1 | Tim deploy |
| 4 | Ubah bucket `portofolio` menjadi privat di Supabase Storage | P3 | Pemegang akses Supabase |
| 5 | Tambahkan domain preview Vercel ke `ALLOWED_ORIGINS` di `backend/main.py` bila dibutuhkan | Sesuai kebutuhan | Tim backend |
| 6 | Ganti template email reset kata sandi di Supabase ke `token_hash` agar email tidak muncul di URL | P3 | Pemegang akses Supabase |
