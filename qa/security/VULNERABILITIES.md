# Daftar Kerentanan LangkahLegal

Audit: 10 November 2026, branch `feat/middleware`. Pemindai: npm audit, pip-audit 2.10.1, bandit 1.9.4, semgrep 1.184.0 (rules OWASP Top 10, Python, JavaScript, React, secrets), gitleaks 8.30.1, ditambah tinjauan kode manual dan uji akses langsung ke Supabase. Definisi severity dan prioritas ada di `README.md`.

Status: **Terbuka**, **Sebagian diperbaiki**, atau **Diterima** (false positive atau risiko yang disetujui, selalu P4). Temuan yang sudah diperbaiki dihapus dari dokumen ini; riwayatnya ada di commit perbaikannya. ID tidak dipakai ulang.

## Ringkasan

| Sumber | Critical | High | Medium | Low | Terbuka | Prioritas tertinggi |
|---|---|---|---|---|---|---|
| npm audit `frontend/` | 0 | 0 | 10 | 0 | 10 (alat lint/build) | P3 |
| npm audit `qa/` | 0 | 0 | 0 | 0 | 0 | - |
| pip-audit `backend/` | 0 | 0 | 0 | 0 | 0 | - |
| gitleaks (riwayat git) | 0 | 0 | 0 | 0 | 0 (semua tercatat di allowlist) | - |
| bandit | 0 | 0 | 0 | 1 | 0 (false positive) | P4 |
| semgrep | 0 | 0 | 1 | 0 | 0 (false positive) | P4 |
| Tinjauan manual (bagian 5 dan 6) | 1 | 0 | 3 | 1 | 5 | **P1 (RLS Supabase)** |

## 1. Dependensi frontend (npm audit)

`next` sudah dinaikkan ke 15.5.29 dan `postcss` dipaksa ke 8.5.32 lewat `overrides` di `package.json`. Sisanya hanya paket alat lint dan build.

| Paket | Severity | Prioritas | Status | Apa yang bisa dilakukan penyerang | Perbaikan |
|---|---|---|---|---|---|
| `eslint-config-next`, `typescript-eslint` dkk, `minimatch`, `@tailwindcss/typography`, `postcss-selector-parser` | Moderate | P3 | Terbuka | DoS pada alat lint/build di laptop developer. Tidak berjalan di browser pengguna maupun server produksi. | Butuh upgrade major (`npm audit fix --force`); tunda sampai upgrade tooling |

## 2. Dependensi backend (pip-audit)

Tidak ada temuan.

## 3. Rahasia di repositori (gitleaks)

Repositori bersifat publik. Tidak ada kunci layanan (Supabase service role, Midtrans server, Google, Voyage, Brevo) di riwayat; berkas `.env` tidak pernah ter-commit.

| Temuan | Severity | Prioritas | Status | Penjelasan | Penanganan |
|---|---|---|---|---|---|
| Token sesi akun uji di `qa/.sit-state/continue.json`, commit `96a4b79` | - | P4 | Diterima | Seluruh sesi akun `sit.*` dicabut (logout global) pada 10 Nov 2026; refresh token lama terbukti ditolak. Riwayat git tidak ditulis ulang. | Allowlist commit di `gitleaks.toml` |
| `qa/.sit-state/identities.json` (5 temuan) | - | P4 | Diterima | UUID akun uji, bukan rahasia. | Allowlist path |
| `qa/test_data/auth.data.js` `INVALID_TOKEN` | - | P4 | Diterima | Token palsu yang sengaja tidak valid untuk skenario uji. | Allowlist regex |
| `.github/workflows/e2e.yml` (berkas sudah dihapus) | - | P4 | Diterima | Ekspresi `${{ secrets.X }}`, bukan nilai. | Allowlist regex |
| `backend/PROFILE_PHOTO_DOCS.md` (berkas sudah dihapus) | - | P4 | Diterima | Contoh respons dengan token terpotong. | Allowlist regex |

## 4. Kode (semgrep dan bandit)

| Lokasi | Alat | Severity | Prioritas | Status | Penjelasan | Tindakan |
|---|---|---|---|---|---|---|
| `backend/tools/sync_peraturan_files.py:278` | bandit B324, semgrep | - | P4 | Diterima | SHA-1 untuk tanda tangan API Cloudinary, yang memang mewajibkannya. Skrip alat internal, bukan bagian API. | `# nosec B324  # nosemgrep` |
| `backend/services/auth_service.py:26` | bandit B105 | Low | P4 | Diterima | Konstanta `PASSWORD_LOGIN = "password"` adalah nama metode login di klaim JWT, bukan kata sandi. | Tidak ada |
| `backend/middleware/rate_limit.py:40` | semgrep | Medium | P4 | Diterima | F-string berisi method dan path route (bukan input pengguna) untuk nama bucket rate limiter; tidak pernah dikirim ke klien. | Tidak ada |

## 5. Tinjauan manual

| ID | Temuan | Severity | Prioritas | Status | Apa yang bisa dilakukan penyerang | Perbaikan |
|---|---|---|---|---|---|---|
| M-12 | RLS Supabase mati di sebagian besar tabel. Uji 10 Nov 2026 dengan anon key: `users`, `konsultan`, `transaksi`, `dokumen_pendukung`, `bursa_kasus`, `rating_ulasan`, `jadwal_ketersediaan`, dan view `admin_transaction_stats` bisa dibaca langsung lewat PostgREST. Anon key pernah dipakai di `frontend/src` (a.l. commit `225e952`), jadi kemungkinan besar masih tertanam di bundle deployment lama. | Critical | P1 | Terbuka, SQL siap | Siapa pun yang memegang anon key bisa mengunduh email semua pengguna, data transaksi pembayaran, tautan dokumen, dan identitas pemilik kasus bursa tanpa login, melewati seluruh otorisasi backend. Kemungkinan juga bisa mengubah data. | Jalankan `backend/sql/enable_rls.sql` di Supabase SQL Editor (aktifkan RLS di semua tabel dan cabut hak `anon`/`authenticated`). Backend memakai service role key sehingga tidak terdampak; pastikan environment produksi mengisi `SUPABASE_SERVICE_ROLE_KEY`, bukan anon key di `SUPABASE_KEY`. |
| M-10 | Token sesi disimpan di `localStorage` | Medium | P3 | Sebagian diperbaiki | Sudah dipindah ke cookie `httpOnly` + `SameSite=Lax` yang disetel backend dan dibaca lewat proxy `/api/v1` di domain frontend (rewrite `next.config.mjs`); browser hanya menyimpan penanda sesi dan peran. Teruji di lokal, belum di Vercel. Dua hal yang tidak dijelaskan dokumentasi Vercel: batas ukuran body request yang diproksi (unggahan sampai 10 MB; fungsi Vercel dibatasi 4,5 MB) dan penerusan `Set-Cookie`. | Uji di preview Vercel: login, refresh sesi, unggah dokumen > 4,5 MB, asisten AI (batas proxy 120 detik). Hapus baris ini bila lolos |
| M-11 | Berkas pengguna di bucket Supabase publik | Medium | P3 | Sebagian diperbaiki | Dokumen pendukung dan portofolio kini dilayani lewat signed URL 1 jam, tapi bucket `portofolio` masih publik sehingga tautan lama tetap bisa dibuka. | Ubah bucket `portofolio` menjadi privat di Supabase Storage |
| M-13 | Pengguna bisa berpindah peran klien ↔ konsultan lewat `/auth/role` | Low | P4 | Diterima | Perilaku lama yang dipertahankan; hanya `admin` yang diblokir. | Tolak perubahan bila peran sudah terisi |
| M-14 | Pembatas laju endpoint OTP hanya per email | Low | P4 | Diterima | Penyerang yang mencoba banyak email berbeda tidak tertahan; pembatas Supabase tetap berlaku. Pembatasan per IP ditolak karena banyak pengguna berbagi IP. | CAPTCHA di form OTP bila dibutuhkan |

## 6. Audit manual lanjutan

Kategori yang tidak tercakup pemindai otomatis: data di penyimpanan browser, transport, injeksi, validasi input, kebocoran informasi, pembatas laju, dan rahasia di bundle frontend. Perintah pemeriksaannya ada di `README.md` bagian "Audit manual".

Enkripsi di sisi browser **bukan** solusi untuk data di `localStorage`: kuncinya harus tersedia di JavaScript yang sama, sehingga skrip penyerang yang sudah berjalan di halaman bisa membukanya juga. Pertahanannya adalah menyimpan sesedikit mungkin, menghapusnya saat logout, dan memindahkan token ke cookie `httpOnly` (M-10).

Backend tidak menulis SQL; semua akses database lewat PostgREST/RPC yang mengirim nilai sebagai parameter, dan input pencarian dibersihkan `clean_search` di semua endpoint.

| ID | Temuan | Severity | Prioritas | Status | Apa yang bisa dilakukan penyerang | Perbaikan |
|---|---|---|---|---|---|---|
| M-16 | Email dan peran pendaftaran di `sessionStorage` | Low | P4 | Diterima | Hanya hidup selama tab terbuka, bukan rahasia. | Tidak ada |
| M-17 | Email pengguna disisipkan ke query string tautan reset kata sandi (`?email=`) | Low | P3 | Terbuka | Email tercatat di riwayat browser dan log proxy. Tautannya tetap aman karena token Supabase yang menentukan. | Ganti template email reset di Supabase ke `token_hash`, lalu verifikasi tanpa email di halaman reset |
| M-19 | Prompt injection pada asisten AI | Medium | P3 | Sebagian diperbaiki | Instruksi sistem kini memperlakukan pesan klien sebagai data dan pesan dibungkus penanda di klasifikasi, tapi prompt injection tidak bisa dihilangkan sepenuhnya; pengguna yang gigih masih bisa membuat jawaban menyimpang. Dampaknya kualitas jawaban, bukan akses data. | Pantau lewat evaluasi chatbot; pertahankan disclaimer |
| M-25 | Panjang minimal kata sandi 6 karakter | Low | P4 | Diterima | Kini ditegakkan juga di API, selaras dengan halaman daftar dan pengaturan. Menaikkan ke 8 butuh perubahan UI dan skenario SIT. | Naikkan bersama di `schemas/validation.py`, `frontend/src/lib/passwordRules.js`, dan pengaturan Supabase |
| M-28 | `/health` mengungkap nama environment dan status database | Low | P4 | Diterima | Informasi kecil yang berguna untuk monitoring. | Tidak ada |

## Memperbarui dokumen ini

1. Jalankan `npm run audit:security` di `qa/`.
2. Bandingkan `reports/<tanggal>/summary.md` dengan tabel di sini: tambahkan temuan baru dengan prioritas dan penjelasan bisnisnya, hapus baris temuan yang sudah diperbaiki (sebut ID-nya di pesan commit perbaikan).
3. Catat false positive baru di `gitleaks.toml` (atau `# nosec` / `# nosemgrep`) **dan** di tabel sebagai P4.
