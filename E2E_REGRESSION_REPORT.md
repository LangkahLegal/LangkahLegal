# Laporan E2E & Regression Testing — LangkahLegal

| | |
|---|---|
| **Aplikasi** | LangkahLegal — platform konsultasi hukum (Next.js 15.2.8 + FastAPI + Supabase) |
| **Jenis pengujian** | End-to-End (UI) · Regression · Edge case · Negative · Security · Accessibility · Live API |
| **Tanggal eksekusi** | Sabtu, 03 Oktober 2026 pukul 20.09 WIB |
| **Durasi eksekusi** | 4.0 menit (268 eksekusi test) |
| **Tool** | Playwright 1.59.1 (Chromium) |
| **Status akhir** | Suite regression hijau — semua kegagalan adalah defect yang sudah tercatat |

## 1. Ringkasan Eksekutif

Seluruh fitur aplikasi (36 fitur, 3 role + publik) diuji melalui **251 test case** yang dieksekusi **268 kali** pada 3 project (Desktop Chromium, Mobile Chromium/Pixel 7, Live API).

| Metrik | Jumlah |
|---|---:|
| Test case unik | 251 (✅ 206 lulus · ❌ 43 known defect · ⏭️ 2 skip) |
| Total eksekusi (desktop + mobile + live) | 268 |
| ✅ Lulus | 222 |
| ❌ Gagal — defect terkonfirmasi (known defect) | 43 |
| ❌ Gagal — tidak terduga | 0 |
| ⚠️ Flaky | 0 |
| ⚠️ Defect tampak sudah diperbaiki | 0 |
| ⏭️ Dilewati (butuh kredensial akun uji) | 3 |
| **Pass rate eksekusi (tanpa skip)** | **83.8%** — seluruh kegagalan adalah defect aplikasi yang terdokumentasi di Bagian 6 |

**Temuan:** 36 defect — **1 Critical**, **3 High**, **13 Medium**, **19 Low**.

Temuan paling kritis:

- **[BUG-01](#bug-01) (Critical)** — Privilege escalation: user mana pun dapat menjadikan dirinya admin lewat POST /auth/role.
- **[BUG-02](#bug-02) (High)** — Halaman Buat Password selalu gagal: authService.createPassword tidak ada.
- **[BUG-03](#bug-03) (High)** — Endpoint toggle slot jadwal dapat diakses tanpa autentikasi (IDOR).
- **[BUG-04](#bug-04) (High)** — PUT /consultations/{id}/status menerima status apa pun (bypass pembayaran & alur status).

## 2. Lingkup & Daftar Fitur

Status dihitung per test case (gabungan semua project): sebuah TC dihitung "Known defect" bila gagal sesuai temuan di salah satu project, "Skip" bila tidak dijalankan di project mana pun.

| Kode | Fitur | Role | Jumlah TC | ✅ Lulus | ❌ Known defect | ⏭️ Skip |
|---|---|---|---:|---:|---:|---:|
| F01 | Landing Page | Publik | 8 | 8 | 0 | 0 |
| F02 | Halaman Informasi Publik (About/Privacy/Terms/Compliance) | Publik | 5 | 5 | 0 | 0 |
| F03 | Login Email & Password | Semua | 13 | 12 | 1 | 0 |
| F04 | Login Google (OAuth) | Semua | 2 | 2 | 0 | 0 |
| F05 | Pemilihan Role | Tamu | 1 | 1 | 0 | 0 |
| F06 | Registrasi (Signup) | Tamu | 6 | 5 | 1 | 0 |
| F07 | Verifikasi OTP Email | Tamu | 6 | 6 | 0 | 0 |
| F08 | Lupa Password | Semua | 2 | 2 | 0 | 0 |
| F09 | Reset Password via Link | Semua | 5 | 4 | 1 | 0 |
| F10 | Buat Password (akun OAuth) | Semua | 2 | 1 | 1 | 0 |
| F11 | OAuth Callback | Semua | 6 | 5 | 1 | 0 |
| F12 | Proteksi Route & Role Guard | Semua | 17 | 9 | 8 | 0 |
| F13 | Dashboard Client | Client | 11 | 8 | 3 | 0 |
| F14 | Katalog Konsultan (Explore) | Client/Tamu | 12 | 9 | 3 | 0 |
| F15 | Detail Konsultan & Booking | Client | 11 | 9 | 2 | 0 |
| F16 | Pembayaran (Midtrans Snap) | Client | 9 | 7 | 2 | 0 |
| F17 | Riwayat Konsultasi Client | Client | 3 | 3 | 0 | 0 |
| F18 | Detail Konsultasi (Zoom & Ulasan) | Client/Konsultan | 10 | 9 | 1 | 0 |
| F19 | Posting Kasus Anonim (Bursa) | Client | 7 | 7 | 0 | 0 |
| F20 | Dashboard Konsultan | Konsultan | 5 | 5 | 0 | 0 |
| F21 | Detail Permintaan Konsultasi (Terima/Tolak/Jadwalkan) | Konsultan | 7 | 6 | 1 | 0 |
| F22 | Daftar Klien Aktif | Konsultan | 2 | 2 | 0 | 0 |
| F23 | Kelola Jadwal Ketersediaan | Konsultan | 10 | 6 | 4 | 0 |
| F24 | Bursa Kasus (Klaim) | Konsultan | 10 | 10 | 0 | 0 |
| F25 | Riwayat Sesi Konsultan | Konsultan | 2 | 2 | 0 | 0 |
| F26 | Tanya AI (Chatbot Hukum RAG) | Semua | 13 | 12 | 1 | 0 |
| F27 | Pengaturan Akun (Tema & Logout) | Semua | 7 | 7 | 0 | 0 |
| F28 | Edit Profil (Client & Konsultan) | Semua | 9 | 6 | 3 | 0 |
| F29 | Keamanan & Ganti Kata Sandi | Semua | 6 | 3 | 3 | 0 |
| F30 | Pengaturan Bahasa | Semua | 1 | 0 | 1 | 0 |
| F31 | Tentang Aplikasi | Semua | 1 | 1 | 0 | 0 |
| F32 | Dashboard Admin | Admin | 3 | 3 | 0 | 0 |
| F33 | Verifikasi Konsultan | Admin | 9 | 7 | 2 | 0 |
| F34 | Knowledge Base Dokumen Hukum | Admin | 11 | 9 | 2 | 0 |
| F35 | Manajemen Sesi & Refresh Token | Semua | 4 | 3 | 1 | 0 |
| F36 | Kontrak & Keamanan API Backend (Live) | Sistem | 15 | 12 | 1 | 2 |
| **Total** | | | **251** | **206** | **43** | **2** |

Distribusi kategori test case: E2E (89), Negative (73), Regression (35), Edge Case (27), Security (22), Accessibility (2), Contract (2), Smoke (1).

## 3. Test Environment

| Komponen | Detail |
|---|---|
| Sistem operasi | Windows_NT 10.0.26200 (x64), 16 CPU, RAM 15.7 GB |
| Node.js | v24.19.0 |
| Frontend | Next.js 15.2.8 (build produksi `next build` + `next start` port 3100), React 19.2.4, TanStack Query 5.99.0 |
| Backend (live API) | Python 3.11.9, FastAPI 0.135.2, Uvicorn — `http://127.0.0.1:8000`, APP_ENV=development, Supabase project development |
| Test runner | @playwright/test 1.59.1 |
| Browser | Chromium 147.0.7727.15 (headless shell, revisi 1217) |
| Project / viewport | desktop-chromium 1440×900 · mobile-chromium Pixel 7 (412×915, touch) · live-api (HTTP request) |
| Locale / zona waktu | id-ID / Asia/Jakarta |
| Workers | 2 paralel (batas stabil di mesin Windows ini) |
| Data uji | API backend di-mock di level jaringan (`page.route`) dengan data realistis yang meniru response FastAPI; tanggal dihitung relatif ke hari eksekusi |
| Isolasi | Request eksternal (ui-avatars, Midtrans Snap, ImgBB) dilayani stub lokal; font ikon Google dimuat dari jaringan |

## 4. Strategi & Metodologi

1. **Inventaris fitur** dari kode sumber (`src/app`, `src/services`, `backend/routers`) → 36 fitur (lihat Bagian 2).
2. **E2E UI (mocked backend)** — frontend asli (build produksi) dijalankan di browser; seluruh panggilan `/api/v1/*` dicegat oleh lapisan `MockApi` sehingga skenario sukses, error 4xx/5xx, data kosong, data rusak, dan race condition dapat direproduksi secara deterministik. Setiap test memverifikasi **UI** sekaligus **payload request** yang dikirim ke backend (kontrak API).
3. **Regression** — suite dapat dijalankan ulang setiap perubahan (`npm run test:regression`). Defect yang sudah dikonfirmasi ditandai `knownDefect()` (`test.fail`) sehingga suite tetap hijau namun **otomatis memberi peringatan bila defect sudah diperbaiki** (status "LULUS (defect diperbaiki?)"). Mode `E2E_STRICT=1` menonaktifkan penanda ini.
4. **Edge case & negative** — input kosong/ekstrem (500 karakter, emoji, payload XSS & SQL), file terlalu besar / tipe berbahaya, klik ganda, token kedaluwarsa, data null, localStorage rusak, perubahan tanggal (clock mocking 31 Jan, jam 14:10), layanan pihak ketiga gagal.
5. **Live API** — pengujian **non-destruktif** langsung ke backend FastAPI + Supabase (endpoint publik, validasi, akses tanpa token/token palsu, CORS, webhook palsu, ID yang tidak ada). Tidak ada data produksi yang diubah.
6. **Code review terarah** untuk logika backend yang berisiko tetapi tidak aman dieksploitasi pada database bersama (ditandai verifikasi "Code review").

**Definisi severity**

| Severity | Kriteria |
|---|---|
| Critical | Kompromi keamanan/akses penuh atau kehilangan data; harus diperbaiki sebelum rilis. |
| High | Fitur inti tidak berfungsi atau celah keamanan signifikan tanpa workaround. |
| Medium | Fungsi terganggu / risiko keamanan terbatas, ada workaround. |
| Low | Masalah UX, konsistensi, aksesibilitas, atau validasi minor. |

## 5. Ringkasan Hasil per Project

| Project | Eksekusi | ✅ Lulus | ❌ Known defect | ❌ Gagal baru | ⏭️ Skip | Durasi |
|---|---:|---:|---:|---:|---:|---:|
| desktop-chromium | 236 | 193 | 42 | 0 | 1 | 431 dtk |
| mobile-chromium | 17 | 17 | 0 | 0 | 0 | 20 dtk |
| live-api | 15 | 12 | 1 | 0 | 2 | 5 dtk |

## 6. Findings (Temuan Defect)

| ID | Severity | Komponen | Fitur | Judul | Verifikasi | Test terkait |
|---|---|---|---|---|---|---|
| [BUG-01](#bug-01) | Critical | Backend | F05/F06 Role & Registrasi | Privilege escalation: user mana pun dapat menjadikan dirinya admin lewat POST /auth/role | Code review | — |
| [BUG-02](#bug-02) | High | Frontend | F10 Buat Password (akun OAuth) | Halaman Buat Password selalu gagal: authService.createPassword tidak ada | Test UI E2E | AUTH-036 |
| [BUG-03](#bug-03) | High | Backend | F23 Kelola Jadwal | Endpoint toggle slot jadwal dapat diakses tanpa autentikasi (IDOR) | Live API | LIVE-010 |
| [BUG-04](#bug-04) | High | Backend | F13/F21 Status Konsultasi & Pembayaran | PUT /consultations/{id}/status menerima status apa pun (bypass pembayaran & alur status) | Code review | — |
| [BUG-05](#bug-05) | Medium | Frontend | F12 Proteksi Route | Halaman admin /verification dan /knowledge tidak dilindungi AuthGuard | Test UI E2E | GRD-002, GRD-003 |
| [BUG-06](#bug-06) | Medium | Frontend | F12 Role Guard | Tidak ada role guard di luar /dashboard; halaman role lain & /payment dapat dibuka | Test UI E2E | GRD-004, GRD-013, GRD-014, GRD-015, GRD-016, GRD-017 |
| [BUG-07](#bug-07) | Medium | Frontend | F11 OAuth Callback | Open redirect melalui parameter 'next' pada /auth/callback | Test UI E2E | AUTH-041 |
| [BUG-08](#bug-08) | Medium | Frontend | F23 Kelola Jadwal | Toggle 'Status Konsultasi' tidak pernah disimpan ke server | Test UI E2E | SCH-007 |
| [BUG-09](#bug-09) | Medium | Frontend | F21 Detail Permintaan | Tombol Terima/Tolak dapat diklik berulang (double submit) | Test UI E2E | REQ-003 |
| [BUG-10](#bug-10) | Medium | Frontend | F13 Dashboard Client | CTA 'Cari Konsultan' pada dashboard kosong mengarah ke halaman 404 (/konsultasi) | Test UI E2E | CLI-002 |
| [BUG-11](#bug-11) | Medium | Frontend | F14 Explore & F33 Verifikasi | Katalog & daftar verifikasi crash bila ada konsultan tanpa nama | Test UI E2E | EXP-010, VER-009 |
| [BUG-12](#bug-12) | Medium | Frontend | F15 Booking / F19 Bursa | Komponen FileUpload tidak memvalidasi tipe file (hanya ukuran) | Test UI E2E | BOK-008 |
| [BUG-13](#bug-13) | Medium | Frontend | F16 Pembayaran | Tombol 'Bayar Sekarang' diam tanpa umpan balik bila script Midtrans gagal dimuat | Test UI E2E | PAY-007 |
| [BUG-15](#bug-15) | Medium | Frontend | F23 Kelola Jadwal | Slot jadwal dengan jam selesai ≤ jam mulai atau tanggal lampau dapat dibuat | Test UI E2E | SCH-005, SCH-006 |
| [BUG-16](#bug-16) | Medium | Frontend | F33 Verifikasi Konsultan | Kegagalan approve/reject konsultan tidak diberitahukan ke admin | Test UI E2E | VER-008 |
| [BUG-20](#bug-20) | Medium | Frontend | F16 Pembayaran | Status pembayaran dibaca dari field yang salah: transaksi lunas tetap menampilkan tombol bayar & polling mati | Test UI E2E | PAY-006 |
| [BUG-22](#bug-22) | Medium | Frontend + Backend | F29 Keamanan & Sandi | Ganti kata sandi tidak meminta kata sandi saat ini | Test UI E2E | SEC-004 |
| [BUG-14](#bug-14) | Low | Frontend | F03 Login | User yang sudah login tidak diarahkan keluar dari halaman /auth/* | Test UI E2E | AUTH-013 |
| [BUG-17](#bug-17) | Low | Frontend | F14 Explore | Pencarian katalog hanya mencocokkan nama, padahal placeholder 'Cari keahlian atau nama' | Test UI E2E | EXP-003 |
| [BUG-18](#bug-18) | Low | Frontend | F13/F14 | Error API ditampilkan sebagai 'data kosong' (tidak ada error state) | Test UI E2E | CLI-009, EXP-011 |
| [BUG-19](#bug-19) | Low | Frontend | F15 Detail Konsultan | Konsultan tidak ditemukan (404) tetap menampilkan form booking kosong | Test UI E2E | BOK-011 |
| [BUG-21](#bug-21) | Low | Frontend | F06 Registrasi | Form signup tidak memvalidasi panjang password di sisi klien | Test UI E2E | AUTH-021 |
| [BUG-23](#bug-23) | Low | Frontend | F29 Keamanan & Sandi | Aturan panjang minimal sandi tidak konsisten (JS 6 vs HTML minLength 8) | Test UI E2E | SEC-003 |
| [BUG-24](#bug-24) | Low | Frontend | F28 Edit Profil | Field email di Edit Profil dapat diedit tetapi tidak pernah disimpan | Test UI E2E | PRF-002 |
| [BUG-25](#bug-25) | Low | Frontend | F30 Pengaturan Bahasa | Pengaturan bahasa hanya simulasi (tidak disimpan/diterapkan) | Test UI E2E | LNG-001 |
| [BUG-26](#bug-26) | Low | Frontend | Lintas fitur (ikon UI) | Ikon bergantung pada CDN Google Fonts tanpa fallback; layout rusak saat CDN gagal | Test UI E2E | AI-013 |
| [BUG-27](#bug-27) | Low | Frontend | F18 Detail Konsultasi | Link Zoom tidak divalidasi formatnya | Test UI E2E | CON-009 |
| [BUG-28](#bug-28) | Low | Frontend | F35 Manajemen Sesi | Sesi kedaluwarsa (refresh gagal) tidak mengarahkan user ke login | Test UI E2E | SES-002 |
| [BUG-29](#bug-29) | Low | Frontend | F13 Dashboard Client | Data localStorage rusak membuat dashboard client crash | Test UI E2E | CLI-008 |
| [BUG-30](#bug-30) | Low | Frontend | F28 Edit Profil | Tarif & pengalaman bernilai negatif dapat disimpan | Test UI E2E | PRF-004 |
| [BUG-31](#bug-31) | Low | Frontend | F01 Landing / Build | Konfigurasi next.config.mjs tidak valid & aset gambar hero sangat besar | Code review | — |
| [BUG-32](#bug-32) | Low | Frontend | F23 Kelola Jadwal | Navigasi bulan di kalender jadwal melompati bulan pada tanggal 29–31 | Test UI E2E | SCH-009 |
| [BUG-33](#bug-33) | Low | Frontend | F09/F28 Aksesibilitas Form | Label form tidak terhubung ke input (id duplikat 'password' & InputField tanpa id) | Test UI E2E | AUTH-043, PRF-009 |
| [BUG-34](#bug-34) | Low | Frontend | F29 Keamanan & Sandi | Token lokal tidak dihapus setelah kata sandi diganti | Test UI E2E | SEC-006 |
| [BUG-35](#bug-35) | Low | Frontend | F34 Knowledge Base | Tahun undang-undang di luar rentang (mis. 3000) tetap bisa diunggah | Test UI E2E | KNW-010 |
| [BUG-36](#bug-36) | Low | Frontend | F34 Knowledge Base | Paginasi Knowledge Base ter-reset ke halaman 1 oleh debounce pencarian saat halaman baru dimuat | Test UI E2E | KNW-011 |

### BUG-01

**Privilege escalation: user mana pun dapat menjadikan dirinya admin lewat POST /auth/role**

| Atribut | Detail |
|---|---|
| Severity | **Critical** |
| Komponen | Backend |
| Fitur | F05/F06 Role & Registrasi |
| Lokasi | `backend/routers/auth.py:460 (update_role), backend/routers/auth.py:168 (sign_up), backend/schemas/auth.py:42 (RolePayload.role: str)` |
| Verifikasi | Code review (tidak dieksploitasi agar data Supabase tidak berubah) |
| Input | POST /api/v1/auth/role {"role":"admin"} (token client); juga POST /auth/signup dengan role='admin' |
| Expected output | Backend hanya menerima role 'client' \| 'konsultan', hanya untuk user yang belum punya role; perubahan ke 'admin' ditolak (403/422). |
| Actual output | Nilai role disimpan apa adanya ke tabel users (tanpa whitelist & tanpa cek role sebelumnya). get_current_user membaca role dari tabel users sehingga _require_admin() lolos → akses penuh fitur admin (verifikasi konsultan, hapus dokumen hukum, data transaksi). |
| Dampak | Pengambilalihan penuh fungsi admin oleh user mana pun; integritas verifikasi konsultan & knowledge base AI rusak. |
| Rekomendasi | Gunakan Literal['client','konsultan'] pada RolePayload/SignUpPayload, tolak perubahan bila user sudah memiliki role, dan hanya izinkan penetapan admin lewat proses internal (service role / migrasi). |
| Test terkait | — |

Langkah reproduksi:
1. Login sebagai client biasa (mendapat access_token).
2. Kirim POST /api/v1/auth/role dengan body {"role":"admin"} dan header Authorization.
3. Panggil GET /api/v1/admin/stats atau PATCH /api/v1/admin/consultants/{id}/verify.

### BUG-02

**Halaman Buat Password selalu gagal: authService.createPassword tidak ada**

| Atribut | Detail |
|---|---|
| Severity | **High** |
| Komponen | Frontend |
| Fitur | F10 Buat Password (akun OAuth) |
| Lokasi | `frontend/src/app/auth/create-password/page.js:37` |
| Verifikasi | Test UI E2E |
| Input | password='Rahasia123!', konfirmasi='Rahasia123!' |
| Expected output | Password tersimpan dan user diarahkan ke dashboard sesuai role. |
| Actual output | Muncul pesan error 'authService.createPassword is not a function'; tidak ada request API, user tertahan di halaman. |
| Dampak | User yang mendaftar via Google tidak pernah bisa membuat password (fitur rusak total). |
| Rekomendasi | Tambahkan createPassword pada auth.service.js (mis. memanggil POST /auth/reset-password dengan sesi aktif) atau arahkan halaman ke service yang sudah ada. |
| Test terkait | [AUTH-036](#tc-auth-036) |

Langkah reproduksi:
1. Buka /auth/create-password.
2. Isi password & konfirmasi yang valid (≥ 6 karakter, sama).
3. Klik 'Simpan Password'.

### BUG-03

**Endpoint toggle slot jadwal dapat diakses tanpa autentikasi (IDOR)**

| Atribut | Detail |
|---|---|
| Severity | **High** |
| Komponen | Backend |
| Fitur | F23 Kelola Jadwal |
| Lokasi | `backend/routers/consultants.py:499 (toggle_schedule_slot)` |
| Verifikasi | Live API |
| Input | PATCH /consultants/schedules/999999999/toggle tanpa header Authorization |
| Expected output | 401/403; hanya konsultan pemilik slot yang boleh mengubah. |
| Actual output | HTTP 200 {"data":[],"count":null} — query UPDATE tetap dieksekusi tanpa auth (pada ID nyata akan mengubah slot milik konsultan mana pun). |
| Dampak | Penyerang anonim dapat menutup/membuka seluruh jadwal konsultan, mengganggu booking & pendapatan. |
| Rekomendasi | Tambahkan Depends(get_current_user) dan filter .eq('id_konsultan', <milik user>) pada query update. |
| Test terkait | [LIVE-010](#tc-live-010) |

Langkah reproduksi:
1. Tanpa login, kirim PATCH /api/v1/consultants/schedules/{id_jadwal}/toggle {"status_tersedia": false}.

### BUG-04

**PUT /consultations/{id}/status menerima status apa pun (bypass pembayaran & alur status)**

| Atribut | Detail |
|---|---|
| Severity | **High** |
| Komponen | Backend |
| Fitur | F13/F21 Status Konsultasi & Pembayaran |
| Lokasi | `backend/routers/consultations.py:152-235 (update_consultation_status, param new_status: str)` |
| Verifikasi | Code review (tidak dieksploitasi agar data Supabase tidak berubah) |
| Input | new_status='terjadwal' pada pengajuan 'pending' yang belum dibayar; client: new_status='dibatalkan' pada pengajuan 'terjadwal'/'selesai' |
| Expected output | Transisi status divalidasi (pending→menunggu_pembayaran/ditolak; terjadwal hanya via webhook pembayaran; client hanya boleh batal sebelum dibayar). |
| Actual output | Tidak ada whitelist/state machine: konsultan bisa langsung men-set 'terjadwal'/'selesai' tanpa pembayaran atau nilai sembarang; client bisa membatalkan konsultasi yang sudah dibayar/selesai. |
| Dampak | Pembayaran dapat dilewati, data status korup, potensi sengketa refund. |
| Rekomendasi | Gunakan Enum status & tabel transisi yang diizinkan per role; status 'terjadwal' hanya diset oleh webhook/sync pembayaran. |
| Test terkait | — |

Langkah reproduksi:
1. Login sebagai konsultan pemilik pengajuan.
2. PUT /api/v1/consultations/{id}/status?new_status=terjadwal (atau 'selesai'/teks bebas).

### BUG-05

**Halaman admin /verification dan /knowledge tidak dilindungi AuthGuard**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F12 Proteksi Route |
| Lokasi | `frontend/src/app/verification/, frontend/src/app/knowledge/ (tidak ada layout.js dengan AuthGuard)` |
| Verifikasi | Test UI E2E |
| Input | Akses langsung URL admin tanpa token |
| Expected output | Diarahkan ke /auth/login. |
| Actual output | UI admin dirender (sidebar admin, tombol 'Tambah Dokumen', dsb.), request API gagal 401 secara diam-diam. |
| Dampak | Struktur & fungsi panel admin terekspos; pengalaman membingungkan. Data tetap aman karena backend mengecek role. |
| Rekomendasi | Tambahkan layout.js berisi <AuthGuard requireAuth requireRole> + pengecekan role admin untuk /verification dan /knowledge. |
| Test terkait | [GRD-002](#tc-grd-002), [GRD-003](#tc-grd-003) |

Langkah reproduksi:
1. Tanpa login buka /verification atau /knowledge.

### BUG-06

**Tidak ada role guard di luar /dashboard; halaman role lain & /payment dapat dibuka**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F12 Role Guard |
| Lokasi | `frontend/src/components/auth/AuthGuard.jsx:69-80; layout bursa/schedule/request/consultation hanya requireAuth` |
| Verifikasi | Test UI E2E |
| Input | Sesi client → /schedule; sesi konsultan → /bursa/post; tamu → /payment/501 |
| Expected output | Diarahkan ke dashboard role masing-masing / login. |
| Actual output | Halaman milik role lain tetap dirender (data kosong/error 403); /payment tanpa login menampilkan 'Gagal Memuat Pembayaran'. |
| Dampak | UX membingungkan & menambah permukaan serangan; mengandalkan backend sepenuhnya. |
| Rekomendasi | Terapkan pemetaan route→role di AuthGuard (atau middleware.js yang membaca cookie ll_role) dan redirect bila tidak sesuai. |
| Test terkait | [GRD-004](#tc-grd-004), [GRD-013](#tc-grd-013), [GRD-014](#tc-grd-014), [GRD-015](#tc-grd-015), [GRD-016](#tc-grd-016), [GRD-017](#tc-grd-017) |

Langkah reproduksi:
1. Login sebagai client, buka /schedule, /bursa, /verification.
2. Login sebagai konsultan, buka /bursa/post, /knowledge.
3. Tanpa login buka /payment/501.

### BUG-07

**Open redirect melalui parameter 'next' pada /auth/callback**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F11 OAuth Callback |
| Lokasi | `frontend/src/app/auth/callback/page.js:52` |
| Verifikasi | Test UI E2E |
| Input | next=https://evil.example/phishing |
| Expected output | Parameter next eksternal diabaikan; hanya path relatif internal yang diizinkan. |
| Actual output | Setelah login berhasil, browser diarahkan ke https://evil.example/phishing. |
| Dampak | Dapat dipakai untuk phishing (link login resmi yang berakhir di situs penyerang). |
| Rekomendasi | Validasi next: harus diawali '/' dan bukan '//' (atau whitelist path), selain itu fallback ke dashboard. |
| Test terkait | [AUTH-041](#tc-auth-041) |

Langkah reproduksi:
1. Buka /auth/callback?code=<kode valid>&next=https://evil.example/phishing.

### BUG-08

**Toggle 'Status Konsultasi' tidak pernah disimpan ke server**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F23 Kelola Jadwal |
| Lokasi | `frontend/src/app/schedule/page.js:137 (onChange hanya setQueryData)` |
| Verifikasi | Test UI E2E |
| Input | Toggle aktif → nonaktif |
| Expected output | PATCH /consultants/me/active-status {is_active:false} dan status bertahan setelah reload. |
| Actual output | Hanya cache lokal berubah; tidak ada request (scheduleService.toggleGlobalActive tidak dipanggil). Setelah reload kembali 'Aktif'. |
| Dampak | Konsultan mengira sudah nonaktif padahal tetap tampil di katalog dan bisa dibooking. |
| Rekomendasi | Gunakan useMutation(scheduleService.toggleGlobalActive) dengan optimistic update & rollback. |
| Test terkait | [SCH-007](#tc-sch-007) |

Langkah reproduksi:
1. Login konsultan, buka /schedule.
2. Klik toggle 'Status Konsultasi'.
3. Reload halaman.

### BUG-09

**Tombol Terima/Tolak dapat diklik berulang (double submit)**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F21 Detail Permintaan |
| Lokasi | `frontend/src/components/request/ActionButtons.jsx:7 (prop isLoading diabaikan)` |
| Verifikasi | Test UI E2E |
| Input | 2 klik dalam < 1 detik, response 1.5 dtk |
| Expected output | Tombol nonaktif selama proses, hanya 1 request. |
| Actual output | 2 request PUT /status terkirim (email notifikasi ke client juga terkirim ganda). |
| Dampak | Duplikasi aksi & notifikasi; potensi race condition status. |
| Rekomendasi | Terima prop isLoading di ActionButtons dan teruskan ke <Button isLoading/disabled>. |
| Test terkait | [REQ-003](#tc-req-003) |

Langkah reproduksi:
1. Login konsultan, buka /request/{id}.
2. Klik 'Terima' dua kali dengan cepat.

### BUG-10

**CTA 'Cari Konsultan' pada dashboard kosong mengarah ke halaman 404 (/konsultasi)**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F13 Dashboard Client |
| Lokasi | `frontend/src/components/dashboard/EmptyConsultationCard.jsx:33` |
| Verifikasi | Test UI E2E |
| Input | Klik CTA pada kartu 'Belum Ada Konsultasi Aktif' |
| Expected output | Diarahkan ke /explore. |
| Actual output | Diarahkan ke /konsultasi → 404 'This page could not be found'. |
| Dampak | CTA utama untuk setiap client baru rusak. |
| Rekomendasi | Ganti href menjadi '/explore'. |
| Test terkait | [CLI-002](#tc-cli-002) |

Langkah reproduksi:
1. Login client baru (belum punya konsultasi).
2. Klik 'Cari Konsultan'.

### BUG-11

**Katalog & daftar verifikasi crash bila ada konsultan tanpa nama**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F14 Explore & F33 Verifikasi |
| Lokasi | `frontend/src/app/explore/page.js:54, frontend/src/app/verification/page.js:89` |
| Verifikasi | Test UI E2E |
| Input | Item katalog {name:null} / admin consultant {nama_lengkap:null} |
| Expected output | Item tetap tampil dengan nama fallback, halaman tidak crash. |
| Actual output | TypeError: Cannot read properties of null (reading 'toLowerCase') → 'Application error' (seluruh halaman blank). |
| Dampak | Satu data tidak lengkap membuat katalog tidak bisa dipakai seluruh client / admin tidak bisa memverifikasi. |
| Rekomendasi | Gunakan (pro.name ?? '').toLowerCase() dan validasi data di backend. |
| Test terkait | [EXP-010](#tc-exp-010), [VER-009](#tc-ver-009) |

Langkah reproduksi:
1. Backend mengembalikan konsultan dengan name/nama_lengkap null (profil baru belum lengkap).
2. Buka /explore atau /verification.

### BUG-12

**Komponen FileUpload tidak memvalidasi tipe file (hanya ukuran)**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F15 Booking / F19 Bursa |
| Lokasi | `frontend/src/components/ui/FileUpload.jsx:31` |
| Verifikasi | Test UI E2E |
| Input | malware.exe (application/x-msdownload) |
| Expected output | Ditolak dengan pesan tipe tidak didukung (hanya PDF/JPG/PNG). |
| Actual output | File diterima masuk daftar dokumen dan akan ikut dikirim ke server. |
| Dampak | Berkas berbahaya bisa terunggah ke storage dan dibuka konsultan. |
| Rekomendasi | Validasi ekstensi & MIME terhadap prop accept di validateAndProcess, dan validasi ulang di backend. |
| Test terkait | [BOK-008](#tc-bok-008) |

Langkah reproduksi:
1. Buka /explore/{id}.
2. Drag-and-drop atau pilih file 'malware.exe'.

### BUG-13

**Tombol 'Bayar Sekarang' diam tanpa umpan balik bila script Midtrans gagal dimuat**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F16 Pembayaran |
| Lokasi | `frontend/src/app/payment/[id]/page.js:59 (if (window.snap) tanpa else)` |
| Verifikasi | Test UI E2E |
| Input | snap.js gagal dimuat |
| Expected output | Pesan error 'Layanan pembayaran tidak tersedia, coba lagi'. |
| Actual output | Transaksi dibuat di backend tetapi tidak ada popup maupun pesan apa pun. |
| Dampak | User tidak bisa membayar dan tidak tahu penyebabnya. |
| Rekomendasi | Tambahkan else → alert/toast, dan onError pada <Script>. |
| Test terkait | [PAY-007](#tc-pay-007) |

Langkah reproduksi:
1. Blokir app.sandbox.midtrans.com (adblock/jaringan).
2. Klik 'Bayar Sekarang'.

### BUG-15

**Slot jadwal dengan jam selesai ≤ jam mulai atau tanggal lampau dapat dibuat**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F23 Kelola Jadwal |
| Lokasi | `frontend/src/app/schedule/page.js:98 (handleSave tanpa validasi)` |
| Verifikasi | Test UI E2E |
| Input | jam_mulai=12:00, jam_selesai=09:00; tanggal kemarin |
| Expected output | Validasi menolak sebelum request. |
| Actual output | POST /consultants/schedules tetap dikirim; modal untuk tanggal lampau tetap terbuka. |
| Dampak | Data jadwal invalid; slot lampau/terbalik bisa muncul di halaman booking. |
| Rekomendasi | Validasi end > start dan tanggal ≥ hari ini di AddSlotModal (dan di backend). |
| Test terkait | [SCH-005](#tc-sch-005), [SCH-006](#tc-sch-006) |

Langkah reproduksi:
1. Buka /schedule, pilih tanggal.
2. Mulai 12:00, Selesai 09:00 → 'Tambah Slot' (atau pilih tanggal bulan lalu).

### BUG-16

**Kegagalan approve/reject konsultan tidak diberitahukan ke admin**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F33 Verifikasi Konsultan |
| Lokasi | `frontend/src/app/verification/[id]/page.js:36, frontend/src/app/verification/page.js:50 (useMutation tanpa onError)` |
| Verifikasi | Test UI E2E |
| Input | PATCH /admin/consultants/{id}/verify → 500 |
| Expected output | Pesan error tampil. |
| Actual output | Tidak ada umpan balik; modal tetap terbuka tanpa info. |
| Dampak | Admin mengira verifikasi berhasil/terkatung-katung. |
| Rekomendasi | Tambahkan onError → alert/toast dengan pesan backend. |
| Test terkait | [VER-008](#tc-ver-008) |

Langkah reproduksi:
1. Buka /verification/{id}, klik Terima → 'Ya, Verifikasi' saat server error.

### BUG-20

**Status pembayaran dibaca dari field yang salah: transaksi lunas tetap menampilkan tombol bayar & polling mati**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend |
| Fitur | F16 Pembayaran |
| Lokasi | `frontend/src/app/payment/[id]/page.js:82 dan :51` |
| Verifikasi | Test UI E2E |
| Input | GET /payments/status/{id} → {data:{status_pembayaran:'settlement'}} (format asli backend) |
| Expected output | Layar 'Pembayaran Berhasil!' langsung tampil; polling 5 dtk saat pending. |
| Actual output | Kode membaca paymentStatus.status_pembayaran (seharusnya paymentStatus.data.status_pembayaran) sehingga selalu undefined → tombol 'Bayar Sekarang' tampil lagi; refetchInterval memakai signature v4 (data) padahal TanStack v5 memberi query → polling tidak pernah aktif. |
| Dampak | User yang sudah membayar diminta bayar lagi (backend menolak dengan 400 → membingungkan). |
| Rekomendasi | Gunakan paymentStatus?.data?.status_pembayaran dan refetchInterval: (q) => q.state.data?.data?.status_pembayaran === 'pending' ? 5000 : false. |
| Test terkait | [PAY-006](#tc-pay-006) |

Langkah reproduksi:
1. Buka /payment/{id} untuk pengajuan yang sudah settlement.

### BUG-22

**Ganti kata sandi tidak meminta kata sandi saat ini**

| Atribut | Detail |
|---|---|
| Severity | **Medium** |
| Komponen | Frontend + Backend |
| Fitur | F29 Keamanan & Sandi |
| Lokasi | `frontend/src/app/setting/security/page.js:77, backend/routers/auth.py (reset_password hanya butuh token)` |
| Verifikasi | Test UI E2E |
| Input | Sandi baru tanpa sandi lama |
| Expected output | Field 'Kata Sandi Saat Ini' diverifikasi server (kecuali akun OAuth tanpa password). |
| Actual output | Sandi dapat diganti hanya dengan access token. |
| Dampak | Sesi yang dicuri/tertinggal = pengambilalihan akun permanen. |
| Rekomendasi | Re-autentikasi (sandi lama atau OTP email) sebelum mengubah sandi; bedakan alur akun OAuth. |
| Test terkait | [SEC-004](#tc-sec-004) |

Langkah reproduksi:
1. Dengan sesi yang tertinggal (perangkat bersama), buka /setting/security dan ganti sandi.

### BUG-14

**User yang sudah login tidak diarahkan keluar dari halaman /auth/***

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F03 Login |
| Lokasi | `frontend/src/components/auth/AuthGuard.jsx:74 (redirectToRoleHome tidak berlaku tanpa requireRole)` |
| Verifikasi | Test UI E2E |
| Input | Sesi aktif → /auth/login |
| Expected output | Redirect otomatis ke /dashboard/client. |
| Actual output | Form login tetap tampil. |
| Dampak | Kebingungan dan kemungkinan login ganda akun berbeda di tab yang sama. |
| Rekomendasi | Ubah kondisi agar redirectToRoleHome bekerja meski requireRole=false (atau set requireRole pada auth layout dengan pengecualian /auth/role). |
| Test terkait | [AUTH-013](#tc-auth-013) |

Langkah reproduksi:
1. Login sebagai client.
2. Buka /auth/login.

### BUG-17

**Pencarian katalog hanya mencocokkan nama, padahal placeholder 'Cari keahlian atau nama'**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F14 Explore |
| Lokasi | `frontend/src/app/explore/page.js:54, frontend/src/components/layout/SearchBar.jsx:14` |
| Verifikasi | Test UI E2E |
| Input | search='Pidana' |
| Expected output | Konsultan berspesialisasi Pidana tampil. |
| Actual output | 0 hasil ('Tidak Ditemukan'). |
| Dampak | Fitur pencarian tidak sesuai ekspektasi user. |
| Rekomendasi | Sertakan pro.spec dalam pencocokan atau ubah placeholder. |
| Test terkait | [EXP-003](#tc-exp-003) |

Langkah reproduksi:
1. Buka /explore, ketik 'Pidana'.

### BUG-18

**Error API ditampilkan sebagai 'data kosong' (tidak ada error state)**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F13/F14 |
| Lokasi | `frontend/src/app/dashboard/client/page.js:105, frontend/src/app/explore/page.js:53` |
| Verifikasi | Test UI E2E |
| Input | HTTP 500 |
| Expected output | Pesan 'Gagal memuat data' + tombol coba lagi. |
| Actual output | Menampilkan 'Belum Ada Konsultasi Aktif' / 'Tidak Ditemukan' yang menyesatkan. |
| Dampak | User mengira datanya hilang. |
| Rekomendasi | Gunakan isError dari useQuery untuk merender error state (sesuai AGENTS.md: loading/success/empty/error). |
| Test terkait | [CLI-009](#tc-cli-009), [EXP-011](#tc-exp-011) |

Langkah reproduksi:
1. Simulasikan GET /consultations/ atau /consultants/ → 500.

### BUG-19

**Konsultan tidak ditemukan (404) tetap menampilkan form booking kosong**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F15 Detail Konsultan |
| Lokasi | `frontend/src/app/explore/[id]/page.js:126` |
| Verifikasi | Test UI E2E |
| Input | GET /consultants/99999 → 404 |
| Expected output | State 'Konsultan tidak ditemukan', tanpa form booking. |
| Actual output | Profil placeholder 'Konsultan', harga Rp 0, dan tombol 'Booking Konsultasi' tetap tampil. |
| Dampak | User bisa mencoba booking ke konsultan yang tidak ada. |
| Rekomendasi | Tangani isError/!consultant dengan halaman not-found. |
| Test terkait | [BOK-011](#tc-bok-011) |

Langkah reproduksi:
1. Buka /explore/99999.

### BUG-21

**Form signup tidak memvalidasi panjang password di sisi klien**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F06 Registrasi |
| Lokasi | `frontend/src/app/auth/signup/page.js:38` |
| Verifikasi | Test UI E2E |
| Input | password='123' |
| Expected output | Validasi min. 6 karakter sebelum request (konsisten dengan reset/create password). |
| Actual output | Request langsung dikirim ke backend. |
| Dampak | Round-trip tidak perlu & pesan error bahasa Inggris dari Supabase. |
| Rekomendasi | Tambahkan validasi panjang minimal yang sama dengan halaman password lain. |
| Test terkait | [AUTH-021](#tc-auth-021) |

Langkah reproduksi:
1. Isi signup dengan password '123'.

### BUG-23

**Aturan panjang minimal sandi tidak konsisten (JS 6 vs HTML minLength 8)**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F29 Keamanan & Sandi |
| Lokasi | `frontend/src/app/setting/security/page.js:25 dan :87` |
| Verifikasi | Test UI E2E |
| Input | 'abc123' |
| Expected output | Satu aturan yang sama di placeholder, atribut HTML dan pesan validasi. |
| Actual output | Pesan JS menyebut minimal 6, tetapi browser memblokir dengan minLength=8. |
| Dampak | Pesan validasi membingungkan. |
| Rekomendasi | Samakan aturan (disarankan min 8) di semua halaman password dan backend. |
| Test terkait | [SEC-003](#tc-sec-003) |

Langkah reproduksi:
1. Isi sandi baru 6–7 karakter yang cocok, klik simpan.

### BUG-24

**Field email di Edit Profil dapat diedit tetapi tidak pernah disimpan**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F28 Edit Profil |
| Lokasi | `frontend/src/components/setting/profile/ProfileForm.jsx:45, frontend/src/app/setting/profile/page.js (payload tanpa email)` |
| Verifikasi | Test UI E2E |
| Input | email='baru@example.com' |
| Expected output | Email diperbarui atau field dibuat read-only. |
| Actual output | Request sukses tanpa field email; perubahan hilang diam-diam. |
| Dampak | User mengira email sudah berubah. |
| Rekomendasi | Jadikan field read-only (email dikelola Supabase Auth) atau implementasikan alur ganti email dengan verifikasi. |
| Test terkait | [PRF-002](#tc-prf-002) |

Langkah reproduksi:
1. Ubah email di /setting/profile, klik Simpan.

### BUG-25

**Pengaturan bahasa hanya simulasi (tidak disimpan/diterapkan)**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F30 Pengaturan Bahasa |
| Lokasi | `frontend/src/app/setting/language/page.js:25` |
| Verifikasi | Test UI E2E |
| Input | Bahasa = English |
| Expected output | Pilihan tersimpan & UI berganti bahasa (atau fitur disembunyikan). |
| Actual output | Kembali ke 'Bahasa Indonesia', UI tidak berubah. |
| Dampak | Fitur palsu menurunkan kepercayaan user. |
| Rekomendasi | Implementasikan i18n atau sembunyikan menu sampai siap. |
| Test terkait | [LNG-001](#tc-lng-001) |

Langkah reproduksi:
1. Pilih English, klik 'Simpan Pengaturan', buka kembali halaman.

### BUG-26

**Ikon bergantung pada CDN Google Fonts tanpa fallback; layout rusak saat CDN gagal**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | Lintas fitur (ikon UI) |
| Lokasi | `frontend/src/app/layout.js:29` |
| Verifikasi | Test UI E2E |
| Input | CDN font tidak tersedia (offline/firewall) |
| Expected output | Ikon fallback / layout tetap terbaca. |
| Actual output | Nama ikon tampil sebagai teks panjang (mis. 'chat_bubble_outline') dan judul sesi terdesak hingga lebar 0 px. |
| Dampak | UI tidak terbaca di jaringan yang memblokir Google Fonts. |
| Rekomendasi | Self-host font ikon (next/font/local) atau gunakan library ikon SVG. |
| Test terkait | [AI-013](#tc-ai-013) |

Langkah reproduksi:
1. Blokir fonts.googleapis.com, buka /ai lalu buka riwayat chat.

### BUG-27

**Link Zoom tidak divalidasi formatnya**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F18 Detail Konsultasi |
| Lokasi | `frontend/src/components/consultation/ZoomLinkCard.jsx:53` |
| Verifikasi | Test UI E2E |
| Input | link_zoom='bukan-url' |
| Expected output | Ditolak dengan pesan format URL (https://…zoom.us/…). |
| Actual output | Tersimpan dan ditampilkan ke client sebagai link rusak. |
| Dampak | Client gagal bergabung ke sesi. |
| Rekomendasi | Validasi new URL() + protokol https (opsional domain zoom.us/meet.google.com). |
| Test terkait | [CON-009](#tc-con-009) |

Langkah reproduksi:
1. Konsultan isi link Zoom 'bukan-url', klik Simpan.

### BUG-28

**Sesi kedaluwarsa (refresh gagal) tidak mengarahkan user ke login**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F35 Manajemen Sesi |
| Lokasi | `frontend/src/lib/axios.js:81 dan :133` |
| Verifikasi | Test UI E2E |
| Input | Semua request 401, refresh 401 |
| Expected output | Token dibersihkan lalu redirect ke /auth/login. |
| Actual output | Token dibersihkan tetapi user tetap di dashboard kosong. |
| Dampak | User terjebak di halaman tanpa data. |
| Rekomendasi | Pada kegagalan refresh, redirect ke /auth/login (window.location.replace). |
| Test terkait | [SES-002](#tc-ses-002) |

Langkah reproduksi:
1. Buat access & refresh token invalid, buka dashboard.

### BUG-29

**Data localStorage rusak membuat dashboard client crash**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F13 Dashboard Client |
| Lokasi | `frontend/src/app/dashboard/client/page.js:51 (JSON.parse tanpa try/catch)` |
| Verifikasi | Test UI E2E |
| Input | hidden_rejected_ids='{rusak' |
| Expected output | Nilai rusak diabaikan. |
| Actual output | SyntaxError → 'Application error'. |
| Dampak | Dashboard tidak bisa dibuka sampai storage dibersihkan manual. |
| Rekomendasi | Bungkus JSON.parse dengan try/catch dan reset nilai rusak. |
| Test terkait | [CLI-008](#tc-cli-008) |

Langkah reproduksi:
1. Set localStorage hidden_rejected_ids='{rusak'.
2. Buka /dashboard/client dengan ≥1 konsultasi.

### BUG-30

**Tarif & pengalaman bernilai negatif dapat disimpan**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F28 Edit Profil |
| Lokasi | `frontend/src/app/setting/profile/page.js:97` |
| Verifikasi | Test UI E2E |
| Input | tarif_per_sesi=-50000, pengalaman_tahun=-3 |
| Expected output | Validasi menolak nilai negatif. |
| Actual output | Nilai negatif dikirim ke server. |
| Dampak | Harga negatif dapat muncul di katalog & pembayaran. |
| Rekomendasi | Validasi ≥ 0 di frontend dan constraint di backend/DB. |
| Test terkait | [PRF-004](#tc-prf-004) |

Langkah reproduksi:
1. Konsultan isi tarif -50000 & pengalaman -3, klik Simpan.

### BUG-31

**Konfigurasi next.config.mjs tidak valid & aset gambar hero sangat besar**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F01 Landing / Build |
| Lokasi | `frontend/next.config.mjs:5-6; public/images/background.jpg (11,8 MB), logo.png (5,2 MB), statue.png (4,6 MB), bg_editorial.jpg (4,0 MB)` |
| Verifikasi | Code review (tidak dieksploitasi agar data Supabase tidak berubah) |
| Input | next build |
| Expected output | Build tanpa warning konfigurasi; aset < 500 KB. |
| Actual output | Warning 'Unrecognized key(s): hostname, protocol' (seharusnya di images.remotePatterns); total gambar publik ±26 MB. |
| Dampak | Konfigurasi gambar remote tidak berlaku; biaya optimasi gambar & cold start lebih tinggi. |
| Rekomendasi | Pindahkan ke images.remotePatterns dan kompres gambar (WebP/AVIF ≤ 300 KB). |
| Test terkait | — |

Langkah reproduksi:
1. Jalankan npm run build.

### BUG-32

**Navigasi bulan di kalender jadwal melompati bulan pada tanggal 29–31**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F23 Kelola Jadwal |
| Lokasi | `frontend/src/app/schedule/page.js:159 (setMonth tanpa set tanggal 1)` |
| Verifikasi | Test UI E2E |
| Input | Tanggal browser 2027-01-31 |
| Expected output | Kalender menampilkan Februari 2027. |
| Actual output | Kalender menampilkan Maret 2027 (31 Feb → 3 Mar). |
| Dampak | Konsultan tidak bisa mengatur jadwal Februari (dan bulan 30 hari lainnya) pada akhir bulan. |
| Rekomendasi | Gunakan new Date(y, m ± 1, 1) saat navigasi bulan. |
| Test terkait | [SCH-009](#tc-sch-009) |

Langkah reproduksi:
1. Pada tanggal 31 Januari buka /schedule, klik bulan berikutnya.

### BUG-33

**Label form tidak terhubung ke input (id duplikat 'password' & InputField tanpa id)**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F09/F28 Aksesibilitas Form |
| Lokasi | `frontend/src/components/ui/PasswordField.jsx:9 (default id='password'), frontend/src/components/ui/InputField.jsx:12` |
| Verifikasi | Test UI E2E |
| Input | Klik label / cari via screen reader |
| Expected output | Fokus pindah ke input yang benar; setiap input punya nama aksesibel. |
| Actual output | Dua input ber-id 'password' sehingga label konfirmasi memfokuskan input pertama; field profil tidak punya nama aksesibel. |
| Dampak | Tidak memenuhi WCAG 1.3.1/4.1.2; pengguna screen reader kesulitan. |
| Rekomendasi | Gunakan useId() sebagai default id di PasswordField & InputField. |
| Test terkait | [AUTH-043](#tc-auth-043), [PRF-009](#tc-prf-009) |

Langkah reproduksi:
1. Buka form reset password atau Edit Profil, klik label 'Konfirmasi Password Baru' / 'Nama Lengkap'.

### BUG-34

**Token lokal tidak dihapus setelah kata sandi diganti**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F29 Keamanan & Sandi |
| Lokasi | `frontend/src/app/setting/security/page.js:41` |
| Verifikasi | Test UI E2E |
| Input | Ganti sandi sukses |
| Expected output | clearAuthSession() dipanggil sebelum redirect ke login. |
| Actual output | ll_token & refresh_token tetap tersimpan. |
| Dampak | Sesi lama tetap aktif di perangkat. |
| Rekomendasi | Panggil clearAuthSession() (dan queryClient.clear()) sebelum router.replace('/auth/login'). |
| Test terkait | [SEC-006](#tc-sec-006) |

Langkah reproduksi:
1. Ganti sandi di /setting/security, lalu cek localStorage / buka '/' (navbar menampilkan 'Dashboard').

### BUG-35

**Tahun undang-undang di luar rentang (mis. 3000) tetap bisa diunggah**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F34 Knowledge Base |
| Lokasi | `frontend/src/components/knowledge/modals/UploadDocumentModal.jsx:24` |
| Verifikasi | Test UI E2E |
| Input | tahun_uu=3000 |
| Expected output | Ditolak (1945 ≤ tahun ≤ tahun berjalan). |
| Actual output | Upload dikirim; atribut min/max hanya hint. |
| Dampak | Metadata dokumen hukum RAG tidak valid. |
| Rekomendasi | Tambahkan validasi rentang pada isFormValid & backend. |
| Test terkait | [KNW-010](#tc-knw-010) |

Langkah reproduksi:
1. Tambah Dokumen, isi Tahun 3000 dan field lain valid, klik Unggah.

### BUG-36

**Paginasi Knowledge Base ter-reset ke halaman 1 oleh debounce pencarian saat halaman baru dimuat**

| Atribut | Detail |
|---|---|
| Severity | **Low** |
| Komponen | Frontend |
| Fitur | F34 Knowledge Base |
| Lokasi | `frontend/src/app/knowledge/page.js:57-63 (useEffect debounce memanggil setPage(1) juga saat mount)` |
| Verifikasi | Test UI E2E |
| Input | Klik 'Selanjutnya' < 500 ms setelah halaman dimuat |
| Expected output | Tetap di halaman 2. |
| Actual output | Setelah ±500 ms halaman kembali ke 1 (timer debounce awal memanggil setPage(1)). |
| Dampak | Navigasi paginasi terasa 'melompat' bagi admin yang cepat. |
| Rekomendasi | Lewati efek debounce saat searchInput tidak berubah (bandingkan dengan nilai search sebelumnya) atau reset page hanya ketika nilai search benar-benar berubah. |
| Test terkait | [KNW-011](#tc-knw-011) |

Langkah reproduksi:
1. Buka /knowledge dengan > 20 dokumen.
2. Dalam 0,5 detik pertama klik tombol halaman berikutnya.

## 7. Detail Test Case

Kolom **Status** menampilkan hasil per project bila test dijalankan di lebih dari satu viewport. "FAIL (known defect)" berarti test gagal **sesuai temuan** yang tercatat di Bagian 6.

### F01 Landing Page

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-pub-001"></a>PUB-001 | Landing page tampil lengkap (hero, fitur, CTA, FAQ, footer) | E2E | Buka / tanpa sesi login | Judul hero, section Fitur/Editorial, CTA 'Buat Akun Gratis', FAQ, dan footer copyright tahun berjalan tampil | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-pub-002"></a>PUB-002 | Tombol 'Mulai Sekarang' mengarah ke pemilihan role | E2E | Klik 'Mulai Sekarang' pada hero | Redirect ke /auth/role | Sesuai expected | ✅ PASS |
| <a id="tc-pub-003"></a>PUB-003 | CTA navbar 'Mulai' untuk tamu mengarah ke login | E2E | Klik tombol 'Mulai' di navbar tanpa sesi | Redirect ke /auth/login | Sesuai expected | ✅ PASS |
| <a id="tc-pub-004"></a>PUB-004 | CTA navbar berubah jadi 'Dashboard' saat sudah login (konsultan) | Regression | Sesi konsultan tersimpan, klik 'Dashboard' di navbar | Label tombol 'Dashboard' dan redirect ke /dashboard/consultant | Sesuai expected | ✅ PASS |
| <a id="tc-pub-005"></a>PUB-005 | Sesi tanpa role diarahkan ke pemilihan role dari CTA navbar | Edge Case | localStorage berisi token tetapi tanpa role, klik 'Dashboard' | Redirect ke /auth/role | Sesuai expected | ✅ PASS |
| <a id="tc-pub-006"></a>PUB-006 | FAQ accordion membuka & menutup jawaban | E2E | Klik pertanyaan FAQ pertama dua kali | Jawaban tampil setelah klik pertama dan tersembunyi setelah klik kedua | Sesuai expected | ✅ PASS |
| <a id="tc-pub-007"></a>PUB-007 | Link navigasi 'Services' melakukan scroll ke section fitur | E2E | Klik link 'Services' di navbar (desktop) | URL tetap '/', section #features masuk viewport | Sesuai expected | ✅ PASS |
| <a id="tc-pub-008"></a>PUB-008 | Tidak ada horizontal overflow pada landing page (mobile) | Regression | Buka / pada viewport Pixel 7 | document.scrollWidth <= window.innerWidth (tidak ada scroll horizontal) | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |

### F02 Halaman Informasi Publik

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-pub-009"></a>PUB-009 | Halaman /about dapat diakses publik | E2E | Buka /about tanpa login | Heading 'Mendigitalisasi' tampil tanpa error | Sesuai expected | ✅ PASS |
| <a id="tc-pub-010"></a>PUB-010 | Halaman /privacy dapat diakses publik | E2E | Buka /privacy tanpa login | Heading 'Kebijakan Privasi' tampil tanpa error | Sesuai expected | ✅ PASS |
| <a id="tc-pub-011"></a>PUB-011 | Halaman /terms dapat diakses publik | E2E | Buka /terms tanpa login | Heading 'Syarat & Ketentuan' tampil tanpa error | Sesuai expected | ✅ PASS |
| <a id="tc-pub-012"></a>PUB-012 | Halaman /compliance dapat diakses publik | E2E | Buka /compliance tanpa login | Heading 'Kepatuhan Hukum' tampil tanpa error | Sesuai expected | ✅ PASS |
| <a id="tc-pub-013"></a>PUB-013 | Route tidak dikenal menampilkan halaman 404 | Negative | Buka /halaman-yang-tidak-ada | HTTP 404 dan teks 'This page could not be found' | Sesuai expected | ✅ PASS |

### F03 Login Email & Password

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-auth-001"></a>AUTH-001 | Login sukses sebagai client diarahkan ke /dashboard/client | E2E | email=budi.client@example.com, password=Rahasia123! | POST /auth/login-password dengan body {email,password}, token tersimpan di localStorage, redirect ke /dashboard/client | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-auth-002"></a>AUTH-002 | Login sukses sebagai konsultan diarahkan ke /dashboard/consultant | E2E | email=siti.konsultan@example.com, password=Rahasia123! | POST /auth/login-password dengan body {email,password}, token tersimpan di localStorage, redirect ke /dashboard/consultant | Sesuai expected | ✅ PASS |
| <a id="tc-auth-003"></a>AUTH-003 | Login sukses sebagai admin diarahkan ke /dashboard/admin | E2E | email=admin@example.com, password=Rahasia123! | POST /auth/login-password dengan body {email,password}, token tersimpan di localStorage, redirect ke /dashboard/admin | Sesuai expected | ✅ PASS |
| <a id="tc-auth-004"></a>AUTH-004 | Login akun tanpa role diarahkan ke pemilihan role | Edge Case | Login valid, GET /auth/profile mengembalikan role=null | Redirect ke /auth/role | Sesuai expected | ✅ PASS |
| <a id="tc-auth-005"></a>AUTH-005 | Password salah menampilkan pesan error dari backend | Negative | email valid, password=salah123 → backend 400 'Invalid login credentials' | Pesan 'Invalid login credentials' tampil, tetap di /auth/login, token tidak tersimpan | Sesuai expected | ✅ PASS |
| <a id="tc-auth-006"></a>AUTH-006 | Password kosong divalidasi di sisi klien tanpa memanggil API | Negative | email=budi@example.com, password kosong | Pesan 'Password wajib diisi.' tampil dan tidak ada request ke /auth/login-password | Sesuai expected | ✅ PASS |
| <a id="tc-auth-007"></a>AUTH-007 | Email kosong / format salah diblokir validasi HTML5 | Negative | (a) email kosong, (b) email='bukan-email', password=Rahasia123! | Form tidak tersubmit (validity invalid), tidak ada request ke API | Sesuai expected | ✅ PASS |
| <a id="tc-auth-008"></a>AUTH-008 | Server error 500 / koneksi putus ditangani dengan pesan error | Negative | (a) backend 500 tanpa detail, (b) request network failure | Pesan error tampil, tombol 'Masuk' aktif kembali, halaman tidak crash | Sesuai expected | ✅ PASS |
| <a id="tc-auth-009"></a>AUTH-009 | Tombol login dinonaktifkan selama proses (anti double-submit) | Edge Case | Klik 'Masuk' lalu klik lagi saat request masih berjalan (delay 1.5s) | Label 'Memverifikasi...', tombol disabled, hanya 1 request terkirim | Sesuai expected | ✅ PASS |
| <a id="tc-auth-010"></a>AUTH-010 | Toggle tampilkan/sembunyikan password | E2E | Ketik password lalu klik ikon mata dua kali | type input berubah password → text → password | Sesuai expected | ✅ PASS |
| <a id="tc-auth-011"></a>AUTH-011 | Pesan error berisi payload XSS dirender sebagai teks (tidak dieksekusi) | Security | Backend 400 detail='<img src=x onerror=alert("xss")>' | Teks payload tampil apa adanya, tidak ada dialog alert yang muncul | Sesuai expected | ✅ PASS |
| <a id="tc-auth-012"></a>AUTH-012 | Link 'Lupa Password?' dan 'Daftar' mengarah ke halaman yang benar | E2E | Klik 'Lupa Password?' lalu kembali dan klik 'Daftar' | Masing-masing menuju /auth/forgot-password dan /auth/role | Sesuai expected | ✅ PASS |
| <a id="tc-auth-013"></a>AUTH-013 | User yang sudah login membuka /auth/login diarahkan ke dashboard | Regression | Sesi client aktif di localStorage, buka /auth/login | Redirect otomatis ke /dashboard/client (AuthGuard redirectToRoleHome) | Form login tetap tampil. _(assert: Expected pattern: /\/dashboard\/client$/ · Received string:  "http://localhost:3100/auth/login")_ | ❌ FAIL (known defect) [BUG-14](#bug-14) |

### F04 Login Google (OAuth)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-auth-014"></a>AUTH-014 | Login Google mengarahkan ke URL OAuth & menyimpan code_verifier | E2E | Klik 'Masuk dengan Google', backend mengembalikan {url, code_verifier} | POST /auth/oauth/google dengan redirectTo=<origin>/auth/callback, code_verifier tersimpan di sessionStorage, browser pindah ke URL Google | Sesuai expected | ✅ PASS |
| <a id="tc-auth-015"></a>AUTH-015 | Login Google gagal (URL kosong / error server) menampilkan pesan | Negative | Backend mengembalikan data tanpa url | Pesan 'Gagal menyiapkan login Google.' tampil, tetap di halaman login | Sesuai expected | ✅ PASS |

### F05 Pemilihan Role

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-auth-016"></a>AUTH-016 | Pilih role Konsultan lalu lanjut ke form signup konsultan | E2E | Di /auth/role pilih kartu 'Konsultan Hukum' lalu klik 'Lanjutkan' | sessionStorage pending_role=konsultan, redirect /auth/signup dengan judul 'Daftar sebagai Konsultan' | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |

### F06 Registrasi (Signup)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-auth-017"></a>AUTH-017 | Akses /auth/signup langsung tanpa memilih role diarahkan ke /auth/role | Negative | Buka /auth/signup dengan sessionStorage kosong | Redirect ke /auth/role | Sesuai expected | ✅ PASS |
| <a id="tc-auth-018"></a>AUTH-018 | Signup sukses mengirim data lengkap dan menuju verifikasi OTP | E2E | role=client, name='Budi Santoso', email=budi.baru@example.com, password=Rahasia123! | POST /auth/signup {email,password,name,role:'client',emailRedirectTo:'…/auth/callback'}, pending_auth tersimpan, redirect /auth/verify | Sesuai expected | ✅ PASS |
| <a id="tc-auth-019"></a>AUTH-019 | Signup email sudah terdaftar menampilkan error backend | Negative | Backend 400 detail='User already registered' | Pesan 'User already registered' tampil, tetap di /auth/signup | Sesuai expected | ✅ PASS |
| <a id="tc-auth-020"></a>AUTH-020 | Nama dengan unicode/emoji dikirim utuh | Edge Case | name='Ñandú 测试 🚀', password=Rahasia123! | Body request berisi nama yang sama persis | Sesuai expected | ✅ PASS |
| <a id="tc-auth-021"></a>AUTH-021 | Password lemah (3 karakter) ditolak di sisi klien sebelum dikirim | Negative | password='123' | Muncul pesan validasi minimal panjang password; tidak ada request ke /auth/signup (konsisten dengan halaman reset password yang mewajibkan min. 6 karakter) | Request langsung dikirim ke backend. _(assert: Expected length: 0 · Received length: 1 · Received array:  [{"at": 1791033017410, "body": {"email": "budi@example.com", "emailRedirectTo": "http://localhost:3000/auth/callback", "name": "Budi", "password": "123", "role": "client"}, "headers": {"accept": "appli)_ | ❌ FAIL (known defect) [BUG-21](#bug-21) |
| <a id="tc-auth-022"></a>AUTH-022 | Field nama kosong diblokir validasi HTML5 | Negative | name kosong, email & password valid | Form tidak tersubmit, tidak ada request API | Sesuai expected | ✅ PASS |

### F07 Verifikasi OTP Email

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-auth-023"></a>AUTH-023 | Verifikasi OTP signup konsultan → set role → dashboard konsultan | E2E | pending_auth={email, role:'konsultan', flow:'signup'}, OTP='123456' | POST /auth/verify-otp {type:'signup'}, POST /auth/role {role:'konsultan'}, redirect /dashboard/consultant | Sesuai expected | ✅ PASS |
| <a id="tc-auth-024"></a>AUTH-024 | Input OTP hanya menerima alfanumerik & auto-focus ke kotak berikutnya | Edge Case | Ketik '!' di kotak 1, lalu '7' di kotak 1, lalu Backspace di kotak 2 kosong | Karakter '!' diabaikan, '7' diterima lalu fokus pindah ke kotak 2, Backspace mengembalikan fokus ke kotak 1 | Sesuai expected | ✅ PASS |
| <a id="tc-auth-025"></a>AUTH-025 | Paste kode OTP 6 digit mengisi semua kotak | E2E | Paste teks ' 654 321 ' (dengan spasi) ke kotak pertama | Kotak terisi 6,5,4,3,2,1 dan tombol Verifikasi aktif | Sesuai expected | ✅ PASS |
| <a id="tc-auth-026"></a>AUTH-026 | OTP salah/kedaluwarsa menampilkan pesan error | Negative | OTP='000000', backend 400 'Token has expired or is invalid' | Pesan error tampil dan tetap di /auth/verify | Sesuai expected | ✅ PASS |
| <a id="tc-auth-027"></a>AUTH-027 | Kirim ulang OTP memanggil endpoint resend & mengosongkan input | E2E | pending_auth flow=signup, isi 3 digit lalu klik 'Kirim Ulang' | POST /auth/resend-signup-otp {email}, semua kotak OTP kosong | Sesuai expected | ✅ PASS |
| <a id="tc-auth-028"></a>AUTH-028 | Verifikasi tanpa data pending_auth diarahkan ke login | Negative | sessionStorage kosong, isi OTP 6 digit, klik Verifikasi | Redirect ke /auth/login, tidak ada request verify-otp | Sesuai expected | ✅ PASS |

### F08 Lupa Password

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-auth-029"></a>AUTH-029 | Lupa password sukses menampilkan konfirmasi tautan terkirim | E2E | email=budi@example.com | POST /auth/forgot-password {email, emailRedirectTo:'…/auth/reset-password'}, teks 'Tautan Terkirim!' + email tampil | Sesuai expected | ✅ PASS |
| <a id="tc-auth-030"></a>AUTH-030 | Lupa password: error backend ditampilkan & email kosong diblokir | Negative | (a) submit kosong, (b) email tidak terdaftar → backend 404 'User not found' | (a) tidak ada request, (b) pesan 'User not found' tampil | Sesuai expected | ✅ PASS |

### F09 Reset Password via Link

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-auth-031"></a>AUTH-031 | Link reset tanpa token menampilkan 'Link Tidak Valid' | Negative | Buka /auth/reset-password tanpa query | Judul 'Link Tidak Valid' + tombol 'Minta Link Baru' ke /auth/forgot-password | Sesuai expected | ✅ PASS |
| <a id="tc-auth-032"></a>AUTH-032 | Link reset kedaluwarsa menampilkan pesan khusus | Negative | token=abc&type=recovery&email=…, backend 400 'Token has expired' | Pesan 'Link reset password sudah kadaluarsa…' tampil | Sesuai expected | ✅ PASS |
| <a id="tc-auth-033"></a>AUTH-033 | Reset password: validasi kosong, tidak cocok, dan terlalu pendek | Negative | (a) kosong, (b) 'Rahasia123'/'Rahasia124', (c) '12345'/'12345' | Pesan: 'Semua kolom wajib diisi.', 'Password dan konfirmasi password tidak cocok.', 'Password minimal 6 karakter.'; tidak ada request reset | Sesuai expected | ✅ PASS |
| <a id="tc-auth-034"></a>AUTH-034 | Reset password sukses lalu diarahkan ke login | E2E | token valid, password baru 'PasswordBaru1!' (cocok) | POST /auth/reset-password {new_password}, alert sukses, redirect /auth/login | Sesuai expected | ✅ PASS |
| <a id="tc-auth-043"></a>AUTH-043 | Label form reset password terhubung ke input yang benar (id unik) | Accessibility | Buka form reset password (token valid), klik label 'Konfirmasi Password Baru' | Setiap input punya id unik; klik label memfokuskan input konfirmasi (name=confirmPassword) | Dua input ber-id 'password' sehingga label konfirmasi memfokuskan input pertama; field profil tidak punya nama aksesibel. _(assert: id input: password,password · Expected: 2 · Received: 1)_ | ❌ FAIL (known defect) [BUG-33](#bug-33) |

### F10 Buat Password (akun OAuth)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-auth-035"></a>AUTH-035 | Create password: validasi panjang & konfirmasi | Negative | (a) '123'/'123', (b) 'Rahasia123'/'Beda123' | Pesan 'Password minimal 6 karakter.' lalu 'Password dan konfirmasi password tidak cocok.' | Sesuai expected | ✅ PASS |
| <a id="tc-auth-036"></a>AUTH-036 | Create password valid tersimpan lalu redirect ke dashboard sesuai role | E2E | pending_create_password={role:'client'}, password 'Rahasia123!' (cocok) | Password tersimpan via API dan redirect ke /dashboard/client tanpa error | Muncul pesan error 'authService.createPassword is not a function'; tidak ada request API, user tertahan di halaman. _(assert: Locator:  getByTestId('create-password-error-msg') · Expected: 0 · Received: 1)_ | ❌ FAIL (known defect) [BUG-02](#bug-02) |

### F11 OAuth Callback

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-auth-037"></a>AUTH-037 | Callback dengan error dari provider menampilkan pesan & tombol kembali | Negative | /auth/callback?error_description=Akses%20ditolak%20pengguna | Judul 'Terjadi Kesalahan', teks 'Akses ditolak pengguna', tombol 'Kembali ke Login' → /auth/login | Sesuai expected | ✅ PASS |
| <a id="tc-auth-038"></a>AUTH-038 | Callback tanpa parameter code diarahkan ke login | Negative | /auth/callback | Redirect ke /auth/login | Sesuai expected | ✅ PASS |
| <a id="tc-auth-039"></a>AUTH-039 | Callback signup Google konsultan: tukar code, set role, ke dashboard konsultan | E2E | ?code=oauth-code, sessionStorage pending_oauth_verifier=ver-1, pending_auth={role:'konsultan',flow:'oauth_signup'} | POST /auth/exchange-code {code, code_verifier}, POST /auth/role {role:'konsultan'}, redirect /dashboard/consultant | Sesuai expected | ✅ PASS |
| <a id="tc-auth-040"></a>AUTH-040 | Callback user baru tanpa role otomatis menjadi client | Edge Case | ?code=x, profile.role=null | POST /auth/role {role:'client'} lalu redirect /dashboard/client | Sesuai expected | ✅ PASS |
| <a id="tc-auth-041"></a>AUTH-041 | Parameter 'next' eksternal tidak boleh menjadi open redirect | Security | ?code=x&next=https://evil.example/phishing | User tetap berada di origin aplikasi (tidak diarahkan ke evil.example) | Setelah login berhasil, browser diarahkan ke https://evil.example/phishing. _(assert: Expected: not "evil.example")_ | ❌ FAIL (known defect) [BUG-07](#bug-07) |
| <a id="tc-auth-042"></a>AUTH-042 | Gagal menukar code menampilkan pesan error | Negative | ?code=expired, backend 400 'invalid flow state' | Pesan 'invalid flow state' tampil pada halaman callback | Sesuai expected | ✅ PASS |

### F12 Proteksi Route & Role Guard

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-grd-001"></a>GRD-001 | Semua halaman privat (layout ber-AuthGuard) mengarahkan tamu ke login | Regression | Buka tanpa sesi: /dashboard/client, /dashboard/consultant, /dashboard/admin, /consultation, /consultation/501, /history/client, /history/consultant, /schedule, /setting, /setting/profile, /bursa, /bursa/post, /request/601 | Setiap halaman redirect ke /auth/login | Sesuai expected | ✅ PASS |
| <a id="tc-grd-002"></a>GRD-002 | Halaman /verification tanpa sesi diarahkan ke login | Security | Buka /verification tanpa token di localStorage | Redirect ke /auth/login (halaman ini memanggil API yang butuh autentikasi) | UI admin dirender (sidebar admin, tombol 'Tambah Dokumen', dsb.), request API gagal 401 secara diam-diam. _(assert: Expected pattern: /\/auth\/login$/ · Received string:  "http://localhost:3100/verification")_ | ❌ FAIL (known defect) [BUG-05](#bug-05) |
| <a id="tc-grd-003"></a>GRD-003 | Halaman /knowledge tanpa sesi diarahkan ke login | Security | Buka /knowledge tanpa token di localStorage | Redirect ke /auth/login (halaman ini memanggil API yang butuh autentikasi) | UI admin dirender (sidebar admin, tombol 'Tambah Dokumen', dsb.), request API gagal 401 secara diam-diam. _(assert: Expected pattern: /\/auth\/login$/ · Received string:  "http://localhost:3100/knowledge")_ | ❌ FAIL (known defect) [BUG-05](#bug-05) |
| <a id="tc-grd-004"></a>GRD-004 | Halaman /payment/501 tanpa sesi diarahkan ke login | Security | Buka /payment/501 tanpa token di localStorage | Redirect ke /auth/login (halaman ini memanggil API yang butuh autentikasi) | Halaman milik role lain tetap dirender (data kosong/error 403); /payment tanpa login menampilkan 'Gagal Memuat Pembayaran'. _(assert: Expected pattern: /\/auth\/login$/ · Received string:  "http://localhost:3100/payment/501")_ | ❌ FAIL (known defect) [BUG-06](#bug-06) |
| <a id="tc-grd-005"></a>GRD-005 | Katalog /explore dapat dijelajahi tamu (endpoint katalog publik) | E2E | Buka /explore tanpa sesi, GET /consultants/ publik | Kartu konsultan tampil tanpa harus login | Sesuai expected | ✅ PASS |
| <a id="tc-grd-006"></a>GRD-006 | Tamu yang bertanya di Tanya AI mendapat pesan untuk login | Negative | Tanpa sesi, kirim pesan di /ai → backend 401 | Bubble AI berisi 'Silakan login terlebih dahulu' (tidak crash) | Sesuai expected | ✅ PASS |
| <a id="tc-grd-007"></a>GRD-007 | client yang membuka /dashboard/consultant dikembalikan ke /dashboard/client | Regression | Sesi client, buka /dashboard/consultant | Redirect ke /dashboard/client | Sesuai expected | ✅ PASS |
| <a id="tc-grd-008"></a>GRD-008 | client yang membuka /dashboard/admin dikembalikan ke /dashboard/client | Regression | Sesi client, buka /dashboard/admin | Redirect ke /dashboard/client | Sesuai expected | ✅ PASS |
| <a id="tc-grd-009"></a>GRD-009 | konsultan yang membuka /dashboard/client dikembalikan ke /dashboard/consultant | Regression | Sesi konsultan, buka /dashboard/client | Redirect ke /dashboard/consultant | Sesuai expected | ✅ PASS |
| <a id="tc-grd-010"></a>GRD-010 | konsultan yang membuka /dashboard/admin dikembalikan ke /dashboard/consultant | Regression | Sesi konsultan, buka /dashboard/admin | Redirect ke /dashboard/consultant | Sesuai expected | ✅ PASS |
| <a id="tc-grd-011"></a>GRD-011 | admin yang membuka /dashboard/client dikembalikan ke /dashboard/admin | Regression | Sesi admin, buka /dashboard/client | Redirect ke /dashboard/admin | Sesuai expected | ✅ PASS |
| <a id="tc-grd-012"></a>GRD-012 | Sesi tanpa role yang membuka dashboard diarahkan ke pemilihan role | Edge Case | Token ada, role tidak tersimpan, buka /dashboard/client | Redirect ke /auth/role | Sesuai expected | ✅ PASS |
| <a id="tc-grd-013"></a>GRD-013 | client tidak boleh membuka halaman role lain /schedule | Security | Sesi client, buka /schedule | Diarahkan kembali ke dashboard client (halaman milik role lain tidak dirender) | Halaman milik role lain tetap dirender (data kosong/error 403); /payment tanpa login menampilkan 'Gagal Memuat Pembayaran'. _(assert: Expected pattern: /\/dashboard\/(client\|consultant)$/ · Received string:  "http://localhost:3100/schedule")_ | ❌ FAIL (known defect) [BUG-06](#bug-06) |
| <a id="tc-grd-014"></a>GRD-014 | client tidak boleh membuka halaman role lain /bursa | Security | Sesi client, buka /bursa | Diarahkan kembali ke dashboard client (halaman milik role lain tidak dirender) | Halaman milik role lain tetap dirender (data kosong/error 403); /payment tanpa login menampilkan 'Gagal Memuat Pembayaran'. _(assert: Expected pattern: /\/dashboard\/(client\|consultant)$/ · Received string:  "http://localhost:3100/bursa")_ | ❌ FAIL (known defect) [BUG-06](#bug-06) |
| <a id="tc-grd-015"></a>GRD-015 | client tidak boleh membuka halaman role lain /verification | Security | Sesi client, buka /verification | Diarahkan kembali ke dashboard client (halaman milik role lain tidak dirender) | Halaman milik role lain tetap dirender (data kosong/error 403); /payment tanpa login menampilkan 'Gagal Memuat Pembayaran'. _(assert: Expected pattern: /\/dashboard\/(client\|consultant)$/ · Received string:  "http://localhost:3100/verification")_ | ❌ FAIL (known defect) [BUG-06](#bug-06) |
| <a id="tc-grd-016"></a>GRD-016 | konsultan tidak boleh membuka halaman role lain /bursa/post | Security | Sesi konsultan, buka /bursa/post | Diarahkan kembali ke dashboard konsultan (halaman milik role lain tidak dirender) | Halaman milik role lain tetap dirender (data kosong/error 403); /payment tanpa login menampilkan 'Gagal Memuat Pembayaran'. _(assert: Expected pattern: /\/dashboard\/(client\|consultant)$/ · Received string:  "http://localhost:3100/bursa/post")_ | ❌ FAIL (known defect) [BUG-06](#bug-06) |
| <a id="tc-grd-017"></a>GRD-017 | konsultan tidak boleh membuka halaman role lain /knowledge | Security | Sesi konsultan, buka /knowledge | Diarahkan kembali ke dashboard konsultan (halaman milik role lain tidak dirender) | Halaman milik role lain tetap dirender (data kosong/error 403); /payment tanpa login menampilkan 'Gagal Memuat Pembayaran'. _(assert: Expected pattern: /\/dashboard\/(client\|consultant)$/ · Received string:  "http://localhost:3100/knowledge")_ | ❌ FAIL (known defect) [BUG-06](#bug-06) |

### F13 Dashboard Client

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-cli-001"></a>CLI-001 | Dashboard client menampilkan sapaan, layanan unggulan & kartu kosong | E2E | Sesi client, GET /consultations/ → [] | Nama 'Budi Santoso', kartu 'Belum Ada Konsultasi Aktif', layanan 'Tanya AI Langkah', 'Eksplorasi Konsultan', 'Ajukan Kasus Anonim' | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-cli-002"></a>CLI-002 | Tombol 'Cari Konsultan' pada kartu kosong membuka katalog | E2E | Klik 'Cari Konsultan' pada kartu 'Belum Ada Konsultasi Aktif' | Diarahkan ke halaman katalog /explore | Diarahkan ke /konsultasi → 404 'This page could not be found'. _(assert: Expected pattern: /\/explore$/ · Received string:  "http://localhost:3100/konsultasi")_ | ❌ FAIL (known defect) [BUG-10](#bug-10) |
| <a id="tc-cli-003"></a>CLI-003 | Kartu konsultasi aktif menampilkan pengajuan terbaru & status | Regression | 2 pengajuan: pending (terbaru) & selesai (lama) | Hanya pengajuan pending (terbaru) yang tampil dengan label 'Pending' dan nama konsultan | Sesuai expected | ✅ PASS |
| <a id="tc-cli-004"></a>CLI-004 | Membatalkan konsultasi pending lewat menu kartu | E2E | Menu ⋮ → 'BATALKAN' → konfirmasi OK | PUT /consultations/501/status?new_status=dibatalkan, alert 'Konsultasi berhasil dibatalkan.' | Sesuai expected | ✅ PASS |
| <a id="tc-cli-005"></a>CLI-005 | Batal membatalkan (confirm=Cancel) tidak memanggil API | Negative | Menu ⋮ → 'BATALKAN' → konfirmasi Cancel | Tidak ada request PUT status | Sesuai expected | ✅ PASS |
| <a id="tc-cli-006"></a>CLI-006 | Kartu 'Menunggu Pembayaran' mengarahkan ke halaman pembayaran | E2E | Pengajuan status=menunggu_pembayaran, klik 'Lanjut Pembayaran' | Redirect ke /payment/501 | Sesuai expected | ✅ PASS |
| <a id="tc-cli-007"></a>CLI-007 | Kartu 'Ditolak' yang disembunyikan tetap tersembunyi setelah reload | Regression | Pengajuan status=ditolak → menu ⋮ → 'HAPUS' → reload halaman | ID tersimpan di localStorage hidden_rejected_ids, kartu kosong tampil setelah reload | Sesuai expected | ✅ PASS |
| <a id="tc-cli-008"></a>CLI-008 | Data localStorage rusak tidak membuat dashboard crash | Edge Case | localStorage hidden_rejected_ids='{rusak' lalu buka dashboard dengan 1 pengajuan | Dashboard tetap tampil (data rusak diabaikan), tidak ada 'Application error' | SyntaxError → 'Application error'. _(assert: Locator: getByText('Siti Rahma, S.H., M.H.') · Expected: visible)_ | ❌ FAIL (known defect) [BUG-29](#bug-29) |
| <a id="tc-cli-009"></a>CLI-009 | Gagal memuat konsultasi (500) menampilkan pesan error, bukan kartu kosong | Negative | GET /consultations/ → 500 | Pesan error/coba lagi tampil; tidak menampilkan 'Belum Ada Konsultasi Aktif' yang menyesatkan | Menampilkan 'Belum Ada Konsultasi Aktif' / 'Tidak Ditemukan' yang menyesatkan. _(assert: Locator: getByText(/gagal\|error\|coba lagi/i).first() · Expected: visible)_ | ❌ FAIL (known defect) [BUG-18](#bug-18) |
| <a id="tc-cli-010"></a>CLI-010 | Navigasi layanan unggulan & tombol pengaturan | E2E | Klik 'Eksplorasi Konsultan', kembali, klik ikon Settings | Masing-masing menuju /explore dan /setting | Sesuai expected | ✅ PASS |
| <a id="tc-cli-011"></a>CLI-011 | Bottom navigation tampil di mobile dan berfungsi | Regression | Viewport mobile, klik 'Riwayat' di bottom nav | Bottom nav berisi Konsultasi/Bursa/Tanya AI/Riwayat; klik Riwayat menuju /history/client | Tidak dijalankan: Khusus viewport mobile | Desktop: ⏭️ SKIP<br>Mobile: ✅ PASS |

### F14 Katalog Konsultan (Explore)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-exp-001"></a>EXP-001 | Katalog menampilkan semua konsultan aktif beserta harga & badge | E2E | GET /consultants/ → 4 konsultan | 4 kartu; tarif 'Rp 150.000', 'Gratis' untuk tarif 0; rating & jumlah ulasan tampil | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-exp-002"></a>EXP-002 | Pencarian nama bersifat case-insensitive | E2E | Ketik 'siti' lalu 'ANDI' | Masing-masing hanya 1 kartu yang cocok | Sesuai expected | ✅ PASS |
| <a id="tc-exp-003"></a>EXP-003 | Pencarian berdasarkan keahlian sesuai placeholder | E2E | Placeholder 'Cari keahlian atau nama...', ketik 'Pidana' | Konsultan dengan spesialisasi Pidana (Andi Wijaya, Dewi Lestari) tampil | 0 hasil ('Tidak Ditemukan'). _(assert: Locator:  getByTestId('consultant-card') · Expected: 2 · Received: 0)_ | ❌ FAIL (known defect) [BUG-17](#bug-17) |
| <a id="tc-exp-004"></a>EXP-004 | Pencarian tanpa hasil menampilkan empty state | Negative | Ketik 'zzzz-tidak-ada' | 0 kartu dan teks 'Tidak Ditemukan' | Sesuai expected | ✅ PASS |
| <a id="tc-exp-005"></a>EXP-005 | Input pencarian ekstrem (500 karakter, XSS, SQL, emoji) tidak merusak halaman | Edge Case | 'A'×500, '<script>alert(1)</script>', "' OR 1=1 --", '测试 🚀' | Tidak ada dialog/eksekusi script, tidak crash, empty state tampil | Sesuai expected | ✅ PASS |
| <a id="tc-exp-006"></a>EXP-006 | Filter kategori memanggil API dengan parameter spesialisasi | Regression | Dropdown kategori → 'Pidana' | GET /consultants/?spesialisasi=pidana dan hanya hasil API tersebut yang tampil | Sesuai expected | ✅ PASS |
| <a id="tc-exp-007"></a>EXP-007 | Filter status verifikasi & rentang harga, lalu reset | E2E | Verified → harga min 100000 max 200000 → Reset | Verified: 2 kartu; + harga: 1 kartu (Siti); setelah Reset: 4 kartu & tombol Reset nonaktif | Sesuai expected | ✅ PASS |
| <a id="tc-exp-008"></a>EXP-008 | Rentang harga terbalik (min > max) & nilai negatif | Edge Case | min=500000, max=100000; lalu min=-1 | Min>max menghasilkan empty state tanpa crash; min negatif diperlakukan seperti tanpa batas bawah | Sesuai expected | ✅ PASS |
| <a id="tc-exp-009"></a>EXP-009 | URL foto berbahaya (javascript:) tidak dipakai sebagai src gambar | Security | Konsultan 'Clara' dengan foto_profil='javascript:alert(1)' | src <img> memakai fallback ui-avatars, bukan 'javascript:' | Sesuai expected | ✅ PASS |
| <a id="tc-exp-010"></a>EXP-010 | Konsultan dengan nama null tidak membuat katalog crash | Edge Case | GET /consultants/ berisi item {name:null} (profil konsultan belum lengkap) | Katalog tetap tampil (kartu lain terlihat), tidak ada 'Application error' | TypeError: Cannot read properties of null (reading 'toLowerCase') → 'Application error' (seluruh halaman blank). _(assert: Locator: getByTestId('consultant-card').first() · Expected: visible)_ | ❌ FAIL (known defect) [BUG-11](#bug-11) |
| <a id="tc-exp-011"></a>EXP-011 | Gagal memuat katalog (500) menampilkan pesan error yang jelas | Negative | GET /consultants/ → 500 | Pesan error/coba lagi, bukan 'Tidak Ditemukan' yang menyesatkan | Menampilkan 'Belum Ada Konsultasi Aktif' / 'Tidak Ditemukan' yang menyesatkan. _(assert: Locator: getByText(/gagal\|error\|coba lagi/i).first() · Expected: visible)_ | ❌ FAIL (known defect) [BUG-18](#bug-18) |
| <a id="tc-exp-012"></a>EXP-012 | Tombol 'Lihat' membuka halaman detail konsultan | E2E | Klik 'Lihat' pada kartu Siti Rahma | Menuju /explore/10 | Sesuai expected | ✅ PASS |

### F15 Detail Konsultan & Booking

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-bok-001"></a>BOK-001 | Profil konsultan menampilkan nama, badge, harga, deskripsi & tag | E2E | Buka /explore/10 | Nama, '✅ Verified', 'Rp 150.000', deskripsi, tag 'Perdata' & 'Waris' | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-bok-002"></a>BOK-002 | Booking konsultasi sukses dengan dokumen pendukung | E2E | tanggal=2026-10-05, jam 09:00–09:30, deskripsi kasus, 1 file PDF 'bukti.pdf' | POST /consultations/ multipart {id_jadwal:101, deskripsi_kasus, tanggal_pengajuan, jam_mulai:'09:00:00', jam_selesai:'09:30:00', dokumen_pendukung_files:bukti.pdf} → layar 'Permintaan Booking Berhasil Terkirim!' → kembali ke dashboard | Sesuai expected | ✅ PASS |
| <a id="tc-bok-003"></a>BOK-003 | Booking dengan data belum lengkap ditolak di sisi klien | Negative | (a) tanpa memilih apa pun, (b) tanggal+jam dipilih tapi deskripsi hanya spasi | Alert 'Mohon lengkapi semua data pengajuan.' 2x dan tidak ada POST /consultations/ | Sesuai expected | ✅ PASS |
| <a id="tc-bok-004"></a>BOK-004 | Slot yang sudah dipesan ditandai 'Terisi' & tidak bisa dipilih | Regression | booked-slots: 2026-10-05 09:00–10:00 (terjadwal) | Opsi 09:00 & 09:30 berlabel 'Terisi'; klik tidak mengubah jam mulai (tetap '--:--') | Sesuai expected | ✅ PASS |
| <a id="tc-bok-005"></a>BOK-005 | Jam di luar jam operasional konsultan tidak dapat dipilih | Edge Case | Jadwal 08:00–17:00; buka dropdown jam mulai | 07:30 dan 17:00 nonaktif (opacity), 08:00 dan 16:30 aktif | Sesuai expected | ✅ PASS |
| <a id="tc-bok-006"></a>BOK-006 | Konsultan tanpa jadwal: semua tanggal nonaktif | Edge Case | jadwal_ketersediaan=[] | Tidak ada tombol tanggal yang aktif | Sesuai expected | ✅ PASS |
| <a id="tc-bok-007"></a>BOK-007 | Upload file > 10MB ditolak dan file dapat dihapus dari daftar | Negative | (a) file 10.5MB, (b) file 'akta.pdf' lalu 'Hapus Berkas' | (a) alert 'File terlalu besar! Maksimal 10MB', tidak masuk daftar; (b) daftar kembali kosong | Sesuai expected | ✅ PASS |
| <a id="tc-bok-008"></a>BOK-008 | File dengan tipe tidak diizinkan (.exe) ditolak | Security | Unggah 'malware.exe' (application/x-msdownload) via drag-drop/input | File ditolak dengan pesan tipe tidak didukung; tidak masuk daftar dokumen | File diterima masuk daftar dokumen dan akan ikut dikirim ke server. _(assert: Locator:  getByText('malware.exe') · Expected: 0 · Received: 1)_ | ❌ FAIL (known defect) [BUG-12](#bug-12) |
| <a id="tc-bok-009"></a>BOK-009 | Error backend saat booking ditampilkan ke user | Negative | POST /consultations/ → 400 detail='Jadwal sudah terisi' | Alert 'Jadwal sudah terisi', tetap di form (tidak ke layar sukses) | Sesuai expected | ✅ PASS |
| <a id="tc-bok-010"></a>BOK-010 | Tombol booking terkunci saat request berjalan (anti double-booking) | Edge Case | Klik 'Booking Konsultasi' 2x cepat, response delay 1.5s | Hanya 1 POST /consultations/ terkirim | Sesuai expected | ✅ PASS |
| <a id="tc-bok-011"></a>BOK-011 | ID konsultan tidak ditemukan (404) menampilkan state 'tidak ditemukan' | Negative | Buka /explore/99999 → GET /consultants/99999 404 | Pesan konsultan tidak ditemukan; form booking tidak ditampilkan | Profil placeholder 'Konsultan', harga Rp 0, dan tombol 'Booking Konsultasi' tetap tampil. _(assert: Locator: getByText(/tidak ditemukan/i) · Expected: visible)_ | ❌ FAIL (known defect) [BUG-19](#bug-19) |

### F16 Pembayaran (Midtrans)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-pay-001"></a>PAY-001 | Halaman pembayaran menampilkan konsultan, jadwal & rincian biaya | E2E | Buka /payment/501 (status menunggu_pembayaran, tarif 150.000) | Nama konsultan, 'Rincian Biaya', 'Harga Per Sesi (30 Menit)', total Rp 150.000, tombol 'Bayar Sekarang' | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-pay-002"></a>PAY-002 | Pembayaran sukses via Snap → sinkronisasi status → layar sukses | E2E | Klik 'Bayar Sekarang', Snap memanggil onSuccess | POST /payments/create-transaction {id_pengajuan:501}, snap.pay('snap-token-1'), POST /payments/sync/501, layar 'Pembayaran Berhasil!' → tombol kembali ke dashboard | Sesuai expected | ✅ PASS |
| <a id="tc-pay-003"></a>PAY-003 | Pembayaran pending (mis. VA belum dibayar) kembali ke dashboard | E2E | Snap memanggil onPending | Alert 'Pembayaran tertunda…' lalu redirect /dashboard/client | Sesuai expected | ✅ PASS |
| <a id="tc-pay-004"></a>PAY-004 | Pembayaran ditolak/gagal di Snap menampilkan alert | Negative | Snap memanggil onError | Alert 'Pembayaran gagal. Silakan coba lagi.', tetap di halaman pembayaran | Sesuai expected | ✅ PASS |
| <a id="tc-pay-005"></a>PAY-005 | Backend menolak pembuatan transaksi (status tidak valid) | Negative | POST create-transaction → 400 'Pengajuan tidak dalam status yang memerlukan pembayaran' | Alert berisi pesan backend; Snap tidak dibuka | Sesuai expected | ✅ PASS |
| <a id="tc-pay-006"></a>PAY-006 | Transaksi yang sudah lunas langsung menampilkan layar sukses | Regression | GET /payments/status/501 → {data:{status_pembayaran:'settlement'}} (format asli backend) | Layar 'Pembayaran Berhasil!' tampil; tombol 'Bayar Sekarang' tidak ditampilkan | Kode membaca paymentStatus.status_pembayaran (seharusnya paymentStatus.data.status_pembayaran) sehingga selalu undefined → tombol 'Bayar Sekarang' tampil lagi; refetchInterval memakai signature v4 (data) padahal TanStack v5 memberi query → polling tidak pernah aktif. _(assert: Locator: getByText('Pembayaran Berhasil!') · Expected: visible)_ | ❌ FAIL (known defect) [BUG-20](#bug-20) |
| <a id="tc-pay-007"></a>PAY-007 | Script Midtrans gagal dimuat: user mendapat umpan balik saat klik bayar | Negative | Request snap.js diblokir (CDN down/adblock), klik 'Bayar Sekarang' | Pesan error ditampilkan (mis. 'Layanan pembayaran tidak tersedia'), bukan diam tanpa respon | Transaksi dibuat di backend tetapi tidak ada popup maupun pesan apa pun. _(assert: Expected: > 0 · Received:   0)_ | ❌ FAIL (known defect) [BUG-13](#bug-13) |
| <a id="tc-pay-008"></a>PAY-008 | Detail pengajuan gagal dimuat menampilkan state error + Coba Lagi | Negative | GET /consultations/501 → 404 | Teks 'Gagal Memuat Pembayaran' dan tombol 'Coba Lagi' | Sesuai expected | ✅ PASS |
| <a id="tc-pay-009"></a>PAY-009 | Klik 'Bayar' berulang hanya membuat satu transaksi | Edge Case | Klik 2x cepat, create-transaction delay 1.5s | Hanya 1 POST /payments/create-transaction | Sesuai expected | ✅ PASS |

### F17 Riwayat Konsultasi Client

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-his-001"></a>HIS-001 | Riwayat diurutkan (terjadwal → pending → menunggu bayar → lainnya) & hitung selesai | Regression | 5 pengajuan: selesai(A), terjadwal(B), pending(C), dibatalkan(D), selesai(E) | Badge '2 Selesai'; urutan kartu pertama B lalu C; total 5 kartu | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-his-002"></a>HIS-002 | Riwayat kosong menampilkan empty state | Negative | GET /consultations/ → [] | 'Riwayat Kosong' dan badge '0 Selesai' | Sesuai expected | ✅ PASS |
| <a id="tc-his-003"></a>HIS-003 | Klik 'Lihat Detail' pada riwayat membuka detail konsultasi | E2E | 1 pengajuan selesai id=501, klik 'Lihat Detail' | Redirect ke /consultation/501 | Sesuai expected | ✅ PASS |

### F18 Detail Konsultasi (Zoom & Ulasan)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-con-001"></a>CON-001 | Client melihat detail konsultasi terjadwal lengkap dengan dokumen & link Zoom | E2E | Sesi client, GET /consultations/501 status=terjadwal, link_zoom terisi | Badge 'terjadwal', deskripsi kasus, dokumen 'sertifikat-tanah.pdf', link Zoom, tombol 'Gabung Sesi Konsultasi' membuka tab baru | Sesuai expected | ✅ PASS |
| <a id="tc-con-002"></a>CON-002 | Salin link Zoom ke clipboard | E2E | Klik ikon salin di samping link Zoom | Clipboard berisi link Zoom, ikon berubah menjadi tanda centang | Sesuai expected | ✅ PASS |
| <a id="tc-con-003"></a>CON-003 | Client memberi rating & ulasan untuk menyelesaikan sesi | E2E | Klik 'Beri Ulasan & Selesaikan' → pilih bintang 4 → ulasan 'Sangat membantu' → Kirim | Tombol Kirim nonaktif sebelum memilih bintang; POST /consultations/501/rating {skor_rating:4, ulasan_teks:'Sangat membantu'}; modal tertutup | Sesuai expected | ✅ PASS |
| <a id="tc-con-004"></a>CON-004 | Ulasan dibatasi maksimal 500 karakter | Edge Case | Ketik 600 karakter pada textarea ulasan | Nilai terpotong menjadi 500 karakter dan penghitung '500/500' | Sesuai expected | ✅ PASS |
| <a id="tc-con-005"></a>CON-005 | Gagal mengirim ulasan menampilkan pesan error dari backend | Negative | POST rating → 400 'Ulasan sudah pernah diberikan' | Alert 'Gagal menyimpan ulasan: Ulasan sudah pernah diberikan', modal tetap terbuka | Sesuai expected | ✅ PASS |
| <a id="tc-con-006"></a>CON-006 | Konsultasi dibatalkan tidak menampilkan bagian Zoom maupun tombol ulasan | Regression | status_pengajuan=dibatalkan | Teks 'Link Zoom Meetings' & 'Beri Ulasan & Selesaikan' tidak ada; badge 'dibatalkan' | Sesuai expected | ✅ PASS |
| <a id="tc-con-007"></a>CON-007 | Detail tidak ditemukan / bukan milik user menampilkan state error | Negative | GET /consultations/999 → 403 'Anda tidak berhak' | Teks 'Gagal memuat detail konsultasi.' dan tombol 'Coba Lagi' | Sesuai expected | ✅ PASS |
| <a id="tc-con-008"></a>CON-008 | Konsultan menambahkan link Zoom untuk sesi terjadwal | E2E | Sesi konsultan, link kosong → ikon tambah link → 'https://zoom.us/j/999' → Simpan | PUT /consultations/501/zoom-link (form-data link_zoom), mode edit tertutup; label tombol 'Mulai Sesi Konsultasi' | Sesuai expected | ✅ PASS |
| <a id="tc-con-009"></a>CON-009 | Link Zoom tidak valid ditolak sebelum disimpan | Negative | Isi link Zoom 'bukan-url' lalu Simpan | Muncul validasi format URL; tidak ada request PUT zoom-link | Tersimpan dan ditampilkan ke client sebagai link rusak. _(assert: Expected length: 0 · Received length: 1 · Received array:  [{"at": 1791033122234, "body": "------WebKitFormBoundaryFZAFyC7C9qp2mw8u·)_ | ❌ FAIL (known defect) [BUG-27](#bug-27) |
| <a id="tc-con-010"></a>CON-010 | Konsultan tidak melihat tombol ulasan & dapat membatalkan edit link | Regression | Sesi konsultan, status terjadwal → ikon tambah link → Batal | Tombol 'Beri Ulasan & Selesaikan' tidak ada; setelah Batal kembali ke tampilan 'Link belum tersedia' | Sesuai expected | ✅ PASS |

### F19 Posting Kasus Anonim (Bursa)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-bpo-001"></a>BPO-001 | Form posting kasus tampil dengan kategori default 'Umum' & info anonim | E2E | Buka /bursa/post sebagai client | Judul 'Ajukan Kasus ke Ruang Publik', pilihan Umum/Pidana/Perdata, info 'secara anonim' | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-bpo-002"></a>BPO-002 | Posting kasus pidana lengkap dengan dokumen berhasil | E2E | kategori=Pidana, deskripsi='   Saya ditipu penjual online   ', tanggal=besok, 10:00–10:30, file 'chat.png' | POST /cases/ multipart {kategori_hukum:'pidana', deskripsi_kasus_awam (di-trim), tanggal_konsultasi, jam_mulai:'10:00', jam_selesai:'10:30', dokumen_pendukung_files:'chat.png'} → layar sukses → dashboard client | Sesuai expected | ✅ PASS |
| <a id="tc-bpo-003"></a>BPO-003 | Posting dengan data belum lengkap ditolak | Negative | (a) semua kosong, (b) deskripsi terisi tanpa tanggal/jam | Alert 'Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).' & tidak ada POST /cases/ | Sesuai expected | ✅ PASS |
| <a id="tc-bpo-004"></a>BPO-004 | Error backend saat posting ditampilkan | Negative | POST /cases/ → 403 'Hanya client yang dapat memposting kasus' | Alert berisi pesan backend, tetap di form | Sesuai expected | ✅ PASS |
| <a id="tc-bpo-005"></a>BPO-005 | Slot yang bentrok dengan konsultasi milik sendiri ditandai 'Terisi' | Regression | Client punya pengajuan pending besok 10:00–11:00 | Opsi jam mulai 10:00 & 10:30 berlabel 'Terisi', 11:00 tersedia | Sesuai expected | ✅ PASS |
| <a id="tc-bpo-006"></a>BPO-006 | Jam yang sudah lewat hari ini tidak dapat dipilih | Edge Case | Jam browser diset 14:10 WIB, pilih tanggal hari ini lalu buka dropdown jam mulai | Opsi 14:00 nonaktif, 14:30 aktif | Sesuai expected | ✅ PASS |
| <a id="tc-bpo-007"></a>BPO-007 | Maksimal 10 dokumen pendukung | Edge Case | Unggah 11 file PDF satu per satu | 10 file masuk daftar ('10 Files'), file ke-11 memunculkan alert 'Maksimal 10 file' | Sesuai expected | ✅ PASS |

### F20 Dashboard Konsultan

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-cdb-001"></a>CDB-001 | Dashboard menampilkan pendapatan, statistik & empty state | E2E | stats {income:1.500.000, klien:4, aktif:2}, tanpa request | 'Rp 1.500.000', 'Konsultasi Aktif' 2, 'Total Klien' 4, 'Jadwal Kosong', 'Kotak Masuk Bersih' | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-cdb-002"></a>CDB-002 | 'Jadwal Terdekat' memilih sesi terjadwal paling dekat di masa depan | Regression | Active: terjadwal H+3 (Klien Jauh), terjadwal H+2 (Klien Dekat), terjadwal H-1 (Klien Lewat) | Hanya 'Klien Dekat' tampil di Jadwal Terdekat | Sesuai expected | ✅ PASS |
| <a id="tc-cdb-003"></a>CDB-003 | 'Permintaan Baru' menyaring permintaan kedaluwarsa & membuka detail | E2E | Pending: H+2 (Rina Klien, id 601) & H-2 (Klien Basi); klik 'Lihat Detail' Rina | Hanya Rina tampil; klik membuka /request/601 | Sesuai expected | ✅ PASS |
| <a id="tc-cdb-004"></a>CDB-004 | Peringatan verifikasi ditolak beserta alasan & tautan ke profil | E2E | Profil status_verifikasi='ditolak', alasan_penolakan='Nomor izin tidak valid' | Kotak 'Pengajuan Verifikasi Ditolak' berisi alasan; klik 'Pengaturan Profil' → /setting/profile | Sesuai expected | ✅ PASS |
| <a id="tc-cdb-005"></a>CDB-005 | Statistik gagal dimuat tidak membuat dashboard crash | Negative | GET /consultants/me/dashboard-stats → 500 | Dashboard tetap tampil dengan nilai default 'Rp 0' | Sesuai expected | ✅ PASS |

### F21 Detail Permintaan Konsultasi

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-req-001"></a>REQ-001 | Menerima permintaan reguler → status menunggu pembayaran | E2E | Buka /request/601 → klik 'Terima' | Info klien/jadwal/deskripsi/dokumen tampil; PUT /consultations/601/status?new_status=menunggu_pembayaran; layar 'Permintaan Berhasil Diterima!' → dashboard konsultan | Sesuai expected | ✅ PASS |
| <a id="tc-req-002"></a>REQ-002 | Menolak permintaan | E2E | Klik 'Tolak' | PUT status?new_status=ditolak & layar 'Permintaan Berhasil Ditolak!' | Sesuai expected | ✅ PASS |
| <a id="tc-req-003"></a>REQ-003 | Klik ganda 'Terima' hanya mengirim satu request | Edge Case | Klik 'Terima' 2x cepat (response delay 1.5s) | Tombol dinonaktifkan saat proses; hanya 1 PUT /status terkirim | 2 request PUT /status terkirim (email notifikasi ke client juga terkirim ganda). _(assert: Expected length: 1 · Received length: 2 · Received array:  [{"at": 1791033141578, "body": null, "headers": {"accept": "application/json, text/plain, */*", "accept-language": "id-ID", "authorization": "Bearer access-konsultan-token", "content-type": "applicatio)_ | ❌ FAIL (known defect) [BUG-09](#bug-09) |
| <a id="tc-req-004"></a>REQ-004 | Gagal memproses permintaan menampilkan alert | Negative | PUT /status → 403 'Akses ditolak: Pengajuan ini bukan milik Anda' | Alert 'Gagal memproses permintaan.', tetap di halaman detail | Sesuai expected | ✅ PASS |
| <a id="tc-req-005"></a>REQ-005 | Klaim bursa: pilih slot & jam lalu 'Terima & Jadwalkan' | E2E | id_bursa=701, id_jadwal=null; slot 2026-10-08 09:00–12:00; jam 10:00–11:00 | Badge 'Dari Bursa Kasus'; tombol terkunci sampai slot & jam dipilih; PUT /consultations/601/assign-schedule {id_jadwal:301, jam_mulai:'10:00:00', jam_selesai:'11:00:00'}; layar 'Permintaan Berhasil Diterima & Dijadwalkan!' | Sesuai expected | ✅ PASS |
| <a id="tc-req-006"></a>REQ-006 | Klaim bursa tanpa slot jadwal tersedia mengarahkan ke halaman Jadwal | Negative | Bursa claim, GET /consultants/me/schedules → [] | Pesan 'Belum ada slot jadwal tersedia'; klik 'Jadwal' → /schedule | Sesuai expected | ✅ PASS |
| <a id="tc-req-007"></a>REQ-007 | Permintaan tidak ditemukan menampilkan 'Data tidak ditemukan.' | Negative | GET /consultations/999 → 404 | Teks 'Data tidak ditemukan.' | Sesuai expected | ✅ PASS |

### F22 Daftar Klien Aktif

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-clt-001"></a>CLT-001 | Daftar klien aktif & pengurutan (Terbaru, Terlama, Jadwal Paling Dekat) | Regression | 3 klien aktif dengan created_at & tanggal berbeda; ubah urutan via tombol filter | '3 Klien'; default Terbaru: Kedua, Ketiga, Pertama; Terlama: Pertama…; Paling Dekat: Kedua, Ketiga, Pertama | Sesuai expected | ✅ PASS |
| <a id="tc-clt-002"></a>CLT-002 | Daftar klien kosong & error ditangani | Negative | (a) GET active → [], (b) GET active → 500 | (a) 'Klien Kosong', (b) 'Gagal memuat data klien.' | Sesuai expected | ✅ PASS |

### F23 Kelola Jadwal Ketersediaan

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-sch-001"></a>SCH-001 | Halaman jadwal menampilkan status ketersediaan & kalender bulan berjalan | E2E | Buka /schedule (stats.is_active=true) | 'Status Konsultasi', 'Aktif Menerima Konsultasi', label bulan berjalan pada kalender | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-sch-002"></a>SCH-002 | Menambah slot jadwal baru | E2E | Bulan depan tgl 15 → Mulai 09:00, Selesai 12:00, status Tersedia → 'Tambah Slot' | POST /consultants/schedules {tanggal:'<bulan depan>-15', jam_mulai:'09:00:00', jam_selesai:'12:00:00', status_tersedia:true}; alert 'Jadwal baru berhasil ditambahkan!' | Sesuai expected | ✅ PASS |
| <a id="tc-sch-003"></a>SCH-003 | Mengubah slot yang sudah ada menjadi 'Libur / Tutup' | E2E | Slot id 410 di bulan depan tgl 10 (08:00–10:00) → status 'Libur / Tutup' → 'Simpan Perubahan' | Modal 'Edit Jadwal' terisi jam lama; PUT /consultants/schedules/410 {status_tersedia:false}; alert 'Jadwal berhasil diperbarui!' | Sesuai expected | ✅ PASS |
| <a id="tc-sch-004"></a>SCH-004 | Slot yang sudah dibooking klien bersifat read-only | Regression | Slot bulan depan tgl 12 dengan nama_klien='Rina' | Modal 'Detail Jadwal', pesan 'Jadwal yang sudah dipesan tidak dapat diubah kembali.', tanpa tombol simpan | Sesuai expected | ✅ PASS |
| <a id="tc-sch-005"></a>SCH-005 | Jam selesai lebih awal dari jam mulai ditolak | Negative | Bulan depan tgl 16, Mulai 12:00, Selesai 09:00 → 'Tambah Slot' | Pesan validasi tampil; tidak ada POST /consultants/schedules | POST /consultants/schedules tetap dikirim; modal untuk tanggal lampau tetap terbuka. _(assert: Expected length: 0 · Received length: 1 · Received array:  [{"at": 1791033150895, "body": {"jam_mulai": "12:00:00", "jam_selesai": "09:00:00", "status_tersedia": true, "tanggal": "2026-11-16"}, "headers": {"accept": "application/json, text/plain, */*", "accept)_ | ❌ FAIL (known defect) [BUG-15](#bug-15) |
| <a id="tc-sch-006"></a>SCH-006 | Tidak dapat menambah slot pada tanggal yang sudah lewat | Negative | Navigasi ke bulan lalu, klik tanggal 1 | Modal tambah jadwal tidak terbuka / tanggal nonaktif | POST /consultants/schedules tetap dikirim; modal untuk tanggal lampau tetap terbuka. _(assert: Locator:  getByTestId('add-slot-modal') · Expected: 0 · Received: 1)_ | ❌ FAIL (known defect) [BUG-15](#bug-15) |
| <a id="tc-sch-007"></a>SCH-007 | Toggle 'Status Konsultasi' tersimpan ke server | Regression | Klik toggle ketersediaan (aktif → nonaktif) | PATCH /consultants/me/active-status {is_active:false}; status tetap nonaktif setelah reload | Hanya cache lokal berubah; tidak ada request (scheduleService.toggleGlobalActive tidak dipanggil). Setelah reload kembali 'Aktif'. _(assert: Expected: 1 · Received: 0)_ | ❌ FAIL (known defect) [BUG-08](#bug-08) |
| <a id="tc-sch-008"></a>SCH-008 | Gagal menambah slot (bentrok) menampilkan alert | Negative | POST /consultants/schedules → 409 | Alert 'Gagal menambah jadwal. Pastikan jam tidak bertabrakan.' | Sesuai expected | ✅ PASS |
| <a id="tc-sch-009"></a>SCH-009 | Navigasi bulan tidak melompati bulan saat tanggal hari ini 31 | Edge Case | Jam browser diset 31 Januari 2027, klik tombol bulan berikutnya | Kalender menampilkan 'Februari 2027' (bukan Maret) | Kalender menampilkan Maret 2027 (31 Feb → 3 Mar). _(assert: Locator: getByTestId('monthly-calendar') · Expected substring: "Februari 2027" · Received string:    "calendar_monthMaret 2027chevron_leftchevron_rightMinSenSelRabKamJumSab12345678910111213141516171819202122232425262728293031")_ | ❌ FAIL (known defect) [BUG-32](#bug-32) |
| <a id="tc-sch-010"></a>SCH-010 | Menutup modal jadwal tanpa menyimpan | E2E | Buka tanggal bulan depan → klik tombol close (×) | Modal tertutup, tidak ada request POST/PUT | Sesuai expected | ✅ PASS |

### F24 Bursa Kasus (Konsultan)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-bur-001"></a>BUR-001 | Daftar kasus open tampil dengan jumlah, kategori, waktu & jadwal | E2E | GET /cases/ → 3 kasus | Badge '3 Kasus', 3 kartu 'Klien Anonim', label waktu '2 jam lalu', link 'Lihat Dokumen' untuk kasus berdokumen | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-bur-002"></a>BUR-002 | Filter kategori & kasus tanpa kategori diperlakukan sebagai 'Umum' | Regression | Filter 'Pidana' → 'Umum' → 'Perdata' (data perdata dikosongkan) | Pidana: 1 kartu (701); Umum: 1 kartu (703, kategori null); Perdata kosong menampilkan 'Tidak ada kasus "Perdata"…' | Sesuai expected | ✅ PASS |
| <a id="tc-bur-003"></a>BUR-003 | Deskripsi panjang bisa diperluas & diciutkan | E2E | Kasus 702 dengan deskripsi > 150 karakter → 'Lihat Selengkapnya' → 'Sembunyikan' | Kelas line-clamp-3 hilang saat diperluas dan kembali saat diciutkan | Sesuai expected | ✅ PASS |
| <a id="tc-bur-004"></a>BUR-004 | Deskripsi berisi HTML/script dirender sebagai teks biasa | Security | deskripsi_kasus_awam='<img src=x onerror="alert(1)">Kasus umum…' | Teks mentah tampil, tidak ada elemen <img> injeksi, tidak ada dialog | Sesuai expected | ✅ PASS |
| <a id="tc-bur-005"></a>BUR-005 | Batal klaim menutup modal tanpa memanggil API | Negative | Klik 'Klaim Kasus' → 'Batal'; lalu buka lagi → klik backdrop | Modal konfirmasi tertutup kedua kalinya; tidak ada POST /cases/*/claim | Sesuai expected | ✅ PASS |
| <a id="tc-bur-006"></a>BUR-006 | Klaim kasus sukses → layar sukses → detail konsultasi | E2E | Klaim kasus 701 → 'Ya, Klaim'; backend mengembalikan {data:{id_pengajuan:9001}} | POST /cases/701/claim, layar 'Kasus Berhasil Diklaim!', tombol 'Lihat Detail Konsultasi' → /consultation/9001 | Sesuai expected | ✅ PASS |
| <a id="tc-bur-007"></a>BUR-007 | Kembali ke bursa setelah klaim sukses | E2E | Klaim sukses → klik 'Kembali ke Bursa' | Daftar bursa tampil kembali | Sesuai expected | ✅ PASS |
| <a id="tc-bur-008"></a>BUR-008 | Kasus sudah diklaim konsultan lain (409) menampilkan alert | Negative | POST /cases/701/claim → 409 'Kasus sudah diklaim' | Alert 'Kasus sudah diklaim', modal tertutup, tetap di daftar | Sesuai expected | ✅ PASS |
| <a id="tc-bur-009"></a>BUR-009 | Gagal memuat bursa (403) menampilkan pesan error | Negative | GET /cases/ → 403 | Teks 'Gagal memuat data bursa. Pastikan Anda login sebagai konsultan.' | Sesuai expected | ✅ PASS |
| <a id="tc-bur-010"></a>BUR-010 | Bursa kosong menampilkan empty state | Negative | GET /cases/ → [] | 'Bursa Kosong' & badge '0 Kasus' | Sesuai expected | ✅ PASS |

### F25 Riwayat Sesi Konsultan

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-chi-001"></a>CHI-001 | Riwayat konsultan mengecualikan status pending & menampilkan total selesai | Regression | history: selesai (Ana), pending (Bayu), dibatalkan (Citra); total_sesi_selesai=7 | Badge '7 Selesai'; kartu Ana & Citra tampil; Bayu tidak tampil | Sesuai expected | ✅ PASS |
| <a id="tc-chi-002"></a>CHI-002 | Riwayat konsultan kosong | Negative | history data=[] | 'Riwayat Kosong' & '0 Selesai' | Sesuai expected | ✅ PASS |

### F26 Tanya AI (Chatbot Hukum)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-ai-001"></a>AI-001 | Halaman Tanya AI menampilkan header & pesan sambutan | E2E | Buka /ai | Header 'Visi' status 'Online', 1 bubble AI berisi 'Halo! Saya Visi', input chat kosong & tombol kirim nonaktif | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-ai-002"></a>AI-002 | Kirim pertanyaan dengan Enter → indikator mengetik → jawaban AI + referensi pasal | E2E | Ketik 'Apakah menghina di medsos bisa dipidana?' lalu Enter (response delay 800ms) | Bubble user muncul, indikator 'Visi sedang membaca kronologi Anda...', POST /chatbot/triage {query, session_id:null, kategori:null}; jawaban dengan <strong>UU ITE</strong>, referensi 'Pasal 27 ayat (3)' 87%, disclaimer | Sesuai expected | ✅ PASS |
| <a id="tc-ai-003"></a>AI-003 | Pesan lanjutan memakai session_id dari jawaban pertama | Regression | Kirim 2 pesan berturut-turut; jawaban pertama session_id='sess-1' | Request kedua membawa session_id='sess-1' | Sesuai expected | ✅ PASS |
| <a id="tc-ai-004"></a>AI-004 | Shift+Enter membuat baris baru tanpa mengirim; input kosong/spasi tidak terkirim | Edge Case | Ketik 'Baris 1' + Shift+Enter + 'Baris 2'; lalu kosongkan & ketik '   ' + Enter | Nilai input berisi newline & tidak ada request; input spasi tidak mengirim request dan tombol kirim nonaktif | Sesuai expected | ✅ PASS |
| <a id="tc-ai-005"></a>AI-005 | Error 429 dari layanan AI ditampilkan sebagai pesan ramah | Negative | POST /chatbot/triage → HTTP 429 | Bubble AI error berisi pesan yang sesuai (/terlalu banyak permintaan/); input dapat dipakai lagi | Sesuai expected | ✅ PASS |
| <a id="tc-ai-006"></a>AI-006 | Error 500 dari layanan AI ditampilkan sebagai pesan ramah | Negative | POST /chatbot/triage → HTTP 500 | Bubble AI error berisi pesan yang sesuai (/kendala pada sistem internal/); input dapat dipakai lagi | Sesuai expected | ✅ PASS |
| <a id="tc-ai-007"></a>AI-007 | Error network dari layanan AI ditampilkan sebagai pesan ramah | Negative | Request /chatbot/triage gagal di jaringan | Bubble AI error berisi pesan yang sesuai (/Koneksi terputus/); input dapat dipakai lagi | Sesuai expected | ✅ PASS |
| <a id="tc-ai-008"></a>AI-008 | Rekomendasi konsultan dari AI tampil sebagai kartu & tombol 'Jadwalkan' | E2E | Jawaban type='consultant_list' dengan 1 konsultan (id 10, tarif 150000, rating 4.8) | Judul 'Rekomendasi Konsultan:', nama, 'Rp 150.000', '4.8'; klik 'Jadwalkan' membuka /explore/10 di tab baru | Sesuai expected | ✅ PASS |
| <a id="tc-ai-009"></a>AI-009 | Quick reply muncul saat AI menanyakan bukti & dapat diklik untuk mengirim | E2E | Jawaban AI mengandung kata 'bukti' → klik 'Ya, saya punya buktinya' | 2 tombol quick reply tampil; klik mengirim POST triage dengan query 'Ya, saya punya buktinya' | Sesuai expected | ✅ PASS |
| <a id="tc-ai-010"></a>AI-010 | Jawaban AI berisi HTML/link berbahaya tidak dieksekusi (sanitasi markdown) | Security | jawaban='<img src=x onerror=alert(1)> [klik](javascript:alert(2)) <script>alert(3)</script>' | Tidak ada elemen <img>/<script> hasil injeksi, href link bukan 'javascript:', tidak ada dialog | Sesuai expected | ✅ PASS |
| <a id="tc-ai-011"></a>AI-011 | Tidak bisa mengirim pesan baru selama AI masih memproses | Edge Case | Kirim pesan 1 (delay 1.5s), segera ketik pesan 2 + Enter | Hanya 1 request triage selama pesan 1 diproses | Sesuai expected | ✅ PASS |
| <a id="tc-ai-012"></a>AI-012 | Riwayat sesi: daftar, buka sesi lama, hapus (konfirmasi 2x), mulai baru | E2E | 2 sesi tersimpan → buka 'Sengketa Tanah' → hapus 'Kasus PHK' (klik 2x) → 'Konsultasi Baru' | Pesan sesi lama dimuat dari GET /chatbot/sessions/s1/messages; DELETE /chatbot/sessions/s2 hanya setelah klik ke-2; 'Konsultasi Baru' menampilkan sambutan lagi | Sesuai expected | ✅ PASS |
| <a id="tc-ai-013"></a>AI-013 | Layout tetap terbaca saat CDN font ikon (Google Fonts) gagal dimuat | Edge Case | Blokir fonts.googleapis.com, buka riwayat chat dengan sesi 'Sengketa Tanah' | Judul sesi tetap terlihat (lebar > 0); nama ikon tidak merusak layout | Nama ikon tampil sebagai teks panjang (mis. 'chat_bubble_outline') dan judul sesi terdesak hingga lebar 0 px. _(assert: Locator:  getByText('Sengketa Tanah') · Expected: visible · Received: hidden)_ | ❌ FAIL (known defect) [BUG-26](#bug-26) |

### F27 Pengaturan Akun (Tema & Logout)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-set-001"></a>SET-001 | Halaman pengaturan menampilkan kartu profil & grup menu | E2E | Sesi client, buka /setting | Nama & email user, menu 'Profil Saya', 'Bahasa', 'Tema Aplikasi', 'Keamanan & Sandi', 'Tentang LangkahLegal', 'Keluar' | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-set-002"></a>SET-002 | Badge status verifikasi tampil untuk konsultan | Regression | Sesi konsultan status_verifikasi=terverifikasi | Badge 'Terverifikasi' pada kartu profil | Sesuai expected | ✅ PASS |
| <a id="tc-set-003"></a>SET-003 | Toggle tema terang/gelap & tersimpan setelah reload | E2E | Klik menu 'Tema Aplikasi' lalu reload | Class <html> berubah ke 'dark-tech', deskripsi 'Mode Gelap (Aktif)', localStorage user-pref-theme='dark-tech' bertahan setelah reload | Sesuai expected | ✅ PASS |
| <a id="tc-set-004"></a>SET-004 | Logout menghapus sesi & kembali ke login | E2E | Klik 'Keluar' → konfirmasi OK | POST /auth/logout, semua token di localStorage terhapus, redirect /auth/login | Sesuai expected | ✅ PASS |
| <a id="tc-set-005"></a>SET-005 | Logout tetap membersihkan sesi meski API logout gagal; batal tidak logout | Negative | (a) confirm Cancel → tidak terjadi apa-apa; (b) confirm OK, POST /auth/logout → 500 | (a) tetap di /setting tanpa request; (b) token terhapus & redirect /auth/login | Sesuai expected | ✅ PASS |
| <a id="tc-set-006"></a>SET-006 | Klik area kosong halaman tidak boleh mengganti tema | Edge Case | Klik area kosong di pojok kanan bawah halaman pengaturan | Tema tetap 'theme-white-modern' (tidak ada perubahan tak sengaja) | Sesuai expected | ✅ PASS |
| <a id="tc-set-007"></a>SET-007 | Navigasi menu pengaturan ke sub-halaman | E2E | Klik Profil Saya, Bahasa, Keamanan & Sandi, Tentang LangkahLegal (kembali ke /setting tiap kali) | Masing-masing menuju /setting/profile, /setting/language, /setting/security, /setting/about | Sesuai expected | ✅ PASS |

### F28 Edit Profil (Client & Konsultan)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-prf-001"></a>PRF-001 | Client mengubah nama & tersimpan | E2E | Ubah nama menjadi 'Budi Santoso Updated' → 'Simpan Perubahan' | Form terisi data awal; PUT /users/me/profile/update (form-data nama='Budi Santoso Updated'), field kosong tidak dikirim; redirect /setting | Sesuai expected | ✅ PASS |
| <a id="tc-prf-002"></a>PRF-002 | Perubahan email disimpan atau field email dibuat read-only | Regression | Ubah email menjadi 'baru@example.com' → Simpan | Payload memuat email baru, ATAU field email tidak dapat diedit (tidak menyesatkan user) | Request sukses tanpa field email; perubahan hilang diam-diam. _(assert: Expected: "baru@example.com" · Received: undefined)_ | ❌ FAIL (known defect) [BUG-24](#bug-24) |
| <a id="tc-prf-003"></a>PRF-003 | Konsultan memperbarui kredensial profesional & portofolio PDF | E2E | Tarif 200000, pengalaman 9, spesialisasi 'Pidana', kota 'Surabaya', upload 'portofolio.pdf' | Bagian 'Kredensial Profesional' tampil; payload multipart berisi tarif_per_sesi=200000, pengalaman_tahun=9, spesialisasi=Pidana, kota_praktik=Surabaya, portofolio_file=portofolio.pdf | Sesuai expected | ✅ PASS |
| <a id="tc-prf-004"></a>PRF-004 | Tarif & pengalaman bernilai negatif ditolak | Negative | Tarif '-50000', pengalaman '-3' → Simpan | Pesan validasi tampil; nilai negatif tidak dikirim ke server | Nilai negatif dikirim ke server. _(assert: Expected: not "-50000")_ | ❌ FAIL (known defect) [BUG-30](#bug-30) |
| <a id="tc-prf-005"></a>PRF-005 | Gagal menyimpan profil menampilkan alert & tetap di halaman | Negative | PUT /users/me/profile/update → 500 | Alert 'Gagal menyimpan perubahan.', tetap di /setting/profile | Sesuai expected | ✅ PASS |
| <a id="tc-prf-006"></a>PRF-006 | Upload foto profil: >2MB ditolak, upload sukses memperbarui avatar | E2E | (a) gambar 2.5MB, (b) 'avatar.png' → ImgBB sukses url=https://i.ibb.co/x/avatar.png | (a) alert 'File terlalu besar (max 2MB)'; (b) PUT profil dengan foto_profil=url ImgBB, src avatar berubah | Sesuai expected | ✅ PASS |
| <a id="tc-prf-007"></a>PRF-007 | Upload foto gagal (ImgBB error) menampilkan alert | Negative | ImgBB mengembalikan {success:false} | Alert 'Gagal sinkronisasi foto.', tidak ada PUT profil | Sesuai expected | ✅ PASS |
| <a id="tc-prf-008"></a>PRF-008 | Konsultan yang ditolak melihat alasan penolakan di halaman profil | Regression | Profil status_verifikasi='ditolak', alasan='Foto KTP buram' | Kotak 'Pengajuan Verifikasi Ditolak' dengan alasan '"Foto KTP buram"' | Sesuai expected | ✅ PASS |
| <a id="tc-prf-009"></a>PRF-009 | Label field profil terhubung ke input (aksesibilitas) | Accessibility | Cari input dengan nama aksesibel 'Nama Lengkap' & 'Email' | getByLabel menemukan input yang tepat (label punya atribut for yang valid) | Dua input ber-id 'password' sehingga label konfirmasi memfokuskan input pertama; field profil tidak punya nama aksesibel. _(assert: Locator: getByLabel('Nama Lengkap') · Expected: "Budi Santoso")_ | ❌ FAIL (known defect) [BUG-33](#bug-33) |

### F29 Keamanan & Ganti Kata Sandi

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-sec-001"></a>SEC-001 | Ganti kata sandi sukses lalu diminta login ulang | E2E | Sandi baru 'SandiBaru123' (cocok) | POST /auth/reset-password {new_password:'SandiBaru123'}, alert sukses, redirect /auth/login | Sesuai expected | ✅ PASS |
| <a id="tc-sec-002"></a>SEC-002 | Konfirmasi sandi tidak cocok ditolak | Negative | 'SandiBaru123' vs 'SandiBaru124' | Alert 'Konfirmasi password baru tidak cocok.', tidak ada request | Sesuai expected | ✅ PASS |
| <a id="tc-sec-003"></a>SEC-003 | Aturan panjang minimal kata sandi konsisten | Regression | Bandingkan atribut minLength input, placeholder, dan validasi JS (pesan 'minimal 6 karakter') | Satu aturan yang sama (mis. min 8) dipakai di placeholder, atribut HTML & pesan validasi | Pesan JS menyebut minimal 6, tetapi browser memblokir dengan minLength=8. _(assert: 6 karakter diterima oleh pesan JS 'minimal 6' tetapi ditolak minLength=8 · Expected: true · Received: false)_ | ❌ FAIL (known defect) [BUG-23](#bug-23) |
| <a id="tc-sec-004"></a>SEC-004 | Mengganti sandi mensyaratkan kata sandi saat ini | Security | Buka /setting/security | Terdapat field 'Kata Sandi Saat Ini' yang diverifikasi server sebelum sandi diganti (mencegah pengambilalihan akun dari sesi yang tertinggal) | Sandi dapat diganti hanya dengan access token. _(assert: Locator: getByLabel(/Kata Sandi Saat Ini\|Password Lama/) · Expected: visible)_ | ❌ FAIL (known defect) [BUG-22](#bug-22) |
| <a id="tc-sec-005"></a>SEC-005 | Gagal mengganti sandi (sesi kedaluwarsa) menampilkan pesan | Negative | POST /auth/reset-password → 401 detail='Sesi berakhir' | Alert berisi pesan error, tetap di halaman keamanan | Sesuai expected | ✅ PASS |
| <a id="tc-sec-006"></a>SEC-006 | Sesi lokal dihapus setelah kata sandi diganti | Security | Ganti sandi sukses → periksa localStorage | Token ll_token/refresh dihapus sehingga user benar-benar harus login ulang | ll_token & refresh_token tetap tersimpan. _(assert: Received: "access-client-token")_ | ❌ FAIL (known defect) [BUG-34](#bug-34) |

### F30 Pengaturan Bahasa

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-lng-001"></a>LNG-001 | Memilih bahasa English tersimpan & diterapkan | E2E | Pilih 'English' → 'Simpan Pengaturan' → buka lagi /setting/language | Pilihan English tetap aktif setelah dibuka ulang / UI berganti bahasa | Kembali ke 'Bahasa Indonesia', UI tidak berubah. _(assert: Locator: getByRole('button', { name: /English/ }) · Expected pattern: /bg-primary\/10/ · Received string:  "w-full flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-300 group bg-card/30 border-surface hover:border-primary/20)_ | ❌ FAIL (known defect) [BUG-25](#bug-25) |

### F31 Tentang Aplikasi

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-abt-001"></a>ABT-001 | Halaman Tentang LangkahLegal di pengaturan dapat dibuka | E2E | Buka /setting/about | Header 'Tentang LangkahLegal' & hero 'Mendigitalisasi akses hukum' tampil | Sesuai expected | ✅ PASS |

### F32 Dashboard Admin

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-adm-001"></a>ADM-001 | Dashboard admin menampilkan statistik platform & keuangan | E2E | GET /admin/stats {users:120, clients:90, konsultan:29, pending:2, tx:35, revenue:5jt, komisi:500rb} | Kartu 120/90/29/2, 'Monitoring Transaksi' 35, 'Rp 5.000.000', 'Rp 500.000' | Sesuai expected | Desktop: ✅ PASS<br>Mobile: ✅ PASS |
| <a id="tc-adm-002"></a>ADM-002 | Pengajuan verifikasi terbaru tampil & membuka detail | E2E | Ada konsultan pending 'Fajar Nugroho' (id 20) → 'Lihat Detail' | Kartu Fajar Nugroho (Pidana • Bandung • 4 tahun, Rp 200.000); klik → /verification/20 | Sesuai expected | ✅ PASS |
| <a id="tc-adm-003"></a>ADM-003 | Tidak ada pengajuan pending menampilkan empty state; stats gagal tidak crash | Negative | GET /admin/consultants → semua terverifikasi; GET /admin/stats → 500 | Empty state 'Selesai!', kartu statistik bernilai 0, tanpa crash | Sesuai expected | ✅ PASS |

### F33 Verifikasi Konsultan (Admin)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-ver-001"></a>VER-001 | Daftar ajuan verifikasi dengan tab status berhitung | E2E | 4 konsultan (2 pending, 1 terverifikasi, 1 ditolak) | Tab 'Semua (4)', 'Pending (2)', 'Terverifikasi (1)', 'Ditolak (1)', 4 kartu | Sesuai expected | ✅ PASS |
| <a id="tc-ver-002"></a>VER-002 | Filter tab 'Pending' memanggil API dengan status_filter | Regression | Klik tab 'Pending (2)' | GET /admin/consultants?status_filter=pending, 2 kartu (Fajar & Gita) | Sesuai expected | ✅ PASS |
| <a id="tc-ver-003"></a>VER-003 | Pencarian berdasarkan nama & spesialisasi, serta tanpa hasil | E2E | 'gita' → 'umum' → 'xyz' | 'gita': Gita Permata; 'umum': Hendra Saputra; 'xyz': 'Tidak Ditemukan' | Sesuai expected | ✅ PASS |
| <a id="tc-ver-004"></a>VER-004 | Admin menyetujui konsultan dari halaman detail | E2E | /verification/20 → 'Terima' → 'Ya, Verifikasi' | Data detail (email, izin, harga) tampil; PATCH /admin/consultants/20/verify {action:'terverifikasi', alasan:''}; redirect /verification | Sesuai expected | ✅ PASS |
| <a id="tc-ver-005"></a>VER-005 | Penolakan wajib menyertakan alasan | Negative | 'Tolak' → alasan kosong → isi 'Nomor izin tidak terdaftar' → 'Ya, Tolak' | Tombol 'Ya, Tolak' nonaktif saat alasan kosong; PATCH {action:'ditolak', alasan:'Nomor izin tidak terdaftar'} | Sesuai expected | ✅ PASS |
| <a id="tc-ver-006"></a>VER-006 | Konsultan yang sudah diverifikasi tidak menampilkan tombol aksi | Regression | Detail konsultan status=terverifikasi | Tombol 'Terima' & 'Tolak' tidak ada | Sesuai expected | ✅ PASS |
| <a id="tc-ver-007"></a>VER-007 | Detail konsultan tidak ditemukan | Negative | GET /admin/consultants/999 → 404 | Teks 'Data Konsultan Tidak Ditemukan' | Sesuai expected | ✅ PASS |
| <a id="tc-ver-008"></a>VER-008 | Kegagalan verifikasi di server diberitahukan ke admin | Negative | PATCH /admin/consultants/20/verify → 500 | Pesan error tampil (alert/toast) dan admin tetap di halaman detail | Tidak ada umpan balik; modal tetap terbuka tanpa info. _(assert: Expected: > 0 · Received:   0)_ | ❌ FAIL (known defect) [BUG-16](#bug-16) |
| <a id="tc-ver-009"></a>VER-009 | Konsultan tanpa nama lengkap tidak membuat daftar verifikasi crash | Edge Case | GET /admin/consultants berisi item nama_lengkap=null (profil baru) | Daftar tetap tampil, tidak ada 'Application error' | TypeError: Cannot read properties of null (reading 'toLowerCase') → 'Application error' (seluruh halaman blank). _(assert: Locator: getByText('Fajar Nugroho') · Expected: visible)_ | ❌ FAIL (known defect) [BUG-11](#bug-11) |

### F34 Knowledge Base Dokumen Hukum (Admin)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-knw-001"></a>KNW-001 | Tabel dokumen hukum tampil dengan nomor/tahun, jumlah pasal & status | E2E | GET /admin/documents/ → 2 dokumen (total 2) | 2 baris; '27 / 2022', '76', 'Berlaku'; 'Total Dokumen' 2 | Sesuai expected | ✅ PASS |
| <a id="tc-knw-002"></a>KNW-002 | Pencarian dokumen di-debounce (1 request setelah berhenti mengetik) | Regression | Ketik 'pidana' karakter per karakter | Hanya 1 request dengan search='pidana' & page=1 (tidak ada request per karakter) | Sesuai expected | ✅ PASS |
| <a id="tc-knw-003"></a>KNW-003 | Filter kategori & paginasi | E2E | Kategori 'Pidana'; total 45 dokumen → tombol halaman berikut; input halaman '9' (di luar rentang) | Request kategori=pidana; 'dari 3'; next → page=2; input 9 dikembalikan ke halaman aktif | Sesuai expected | ✅ PASS |
| <a id="tc-knw-004"></a>KNW-004 | Unggah dokumen PDF baru → proses background → toast selesai | E2E | Isi nama/nomor/tahun/kategori/status + 'uu-pdp.pdf' → 'Unggah'; job status processing → completed | Tombol Unggah nonaktif sebelum lengkap; POST /admin/documents/upload multipart lengkap; banner proses tampil; toast 'Proses dokumen selesai!' | Sesuai expected | ✅ PASS |
| <a id="tc-knw-005"></a>KNW-005 | Job pemrosesan gagal menampilkan toast error | Negative | localStorage activeJobId='job-x' (job berjalan sebelumnya), status → failed 'PDF hasil scan' | Toast 'Gagal memproses dokumen: PDF hasil scan' & banner hilang | Sesuai expected | ✅ PASS |
| <a id="tc-knw-006"></a>KNW-006 | Menghapus dokumen beserta seluruh pasalnya | E2E | Ikon hapus pada baris 'UU Perlindungan Data Pribadi' → 'Ya, Hapus' | Modal konfirmasi menyebut nama dokumen; DELETE /admin/documents/by-uri?frbr_uri=/akn/id/act/uu/2022/27; toast 'Dokumen berhasil dihapus!' | Sesuai expected | ✅ PASS |
| <a id="tc-knw-007"></a>KNW-007 | Mengganti dokumen dengan PDF baru (metadata terisi otomatis) | E2E | Ikon sync pada baris pertama → pilih 'uu-pdp-revisi.pdf' → 'Ganti' | Form 'Ganti Dokumen' terisi metadata lama; PUT /admin/documents/replace multipart dengan frbr_uri & file baru | Sesuai expected | ✅ PASS |
| <a id="tc-knw-008"></a>KNW-008 | Detail dokumen: daftar pasal, buka semua, edit isi pasal | E2E | /knowledge/detail?uri=/akn/id/act/uu/2022/27 → 'Buka Semua' → 'Edit Pasal' Pasal 1 → ubah teks → Simpan | Kartu dokumen & 'Daftar Pasal'; isi pasal terlihat; PATCH /admin/documents/chunks/9001 {isi_teks, kategori}; toast 'Berhasil menyimpan perubahan pasal!' | Sesuai expected | ✅ PASS |
| <a id="tc-knw-009"></a>KNW-009 | Detail dokumen tanpa parameter uri menampilkan 'Tidak Ada Data' | Negative | Buka /knowledge/detail tanpa query | Empty state 'Tidak Ada Data' | Sesuai expected | ✅ PASS |
| <a id="tc-knw-010"></a>KNW-010 | Tahun undang-undang di luar rentang ditolak saat unggah | Negative | Tahun '3000' (atribut max = tahun berjalan) dengan field lain valid | Tombol 'Unggah' nonaktif / pesan validasi; tidak ada POST upload | Upload dikirim; atribut min/max hanya hint. _(assert: Expected length: 0 · Received length: 1 · Received array:  [{"at": 1791033216496, "body": "------WebKitFormBoundarya1M1dIeOu2BLJqFY·)_ | ❌ FAIL (known defect) [BUG-35](#bug-35) |
| <a id="tc-knw-011"></a>KNW-011 | Pindah halaman segera setelah halaman dimuat tidak di-reset ke halaman 1 | Edge Case | total 45 dokumen; klik 'Selanjutnya' < 500 ms setelah halaman dimuat, tunggu 1 detik | Input halaman tetap '2' dan request terakhir page=2 | Setelah ±500 ms halaman kembali ke 1 (timer debounce awal memanggil setPage(1)). _(assert: Locator:  locator('input.w-10') · Expected: "2" · Received: "1")_ | ❌ FAIL (known defect) [BUG-36](#bug-36) |

### F35 Manajemen Sesi & Refresh Token

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-ses-001"></a>SES-001 | Access token kedaluwarsa diperbarui otomatis via refresh token lalu request diulang | Regression | GET /users/me/profile/full → 401 sekali, POST /auth/refresh → session baru | Refresh dipanggil 1x dengan refresh_token lama, request diulang dengan token baru, nama user tampil | Sesuai expected | ✅ PASS |
| <a id="tc-ses-002"></a>SES-002 | Refresh token juga invalid → sesi dibersihkan & user diarahkan ke login | Negative | Semua request 401, POST /auth/refresh → 401 | localStorage token dihapus dan user diarahkan ke /auth/login | Token dibersihkan tetapi user tetap di dashboard kosong. _(assert: Expected pattern: /\/auth\/login$/ · Received string:  "http://localhost:3100/dashboard/client")_ | ❌ FAIL (known defect) [BUG-28](#bug-28) |
| <a id="tc-ses-003"></a>SES-003 | Beberapa request 401 bersamaan hanya memicu satu refresh | Edge Case | Dashboard konsultan memanggil 4 endpoint paralel yang semuanya 401 pada percobaan pertama | POST /auth/refresh hanya dipanggil 1 kali (refreshPromise di-share) | Sesuai expected | ✅ PASS |
| <a id="tc-ses-004"></a>SES-004 | Header Authorization Bearer dikirim pada setiap request API | Regression | Sesi client, buka /dashboard/client | Semua request ke /api/v1 memiliki header 'Authorization: Bearer access-client-token' | Sesuai expected | ✅ PASS |

### F36 Kontrak & Keamanan API Backend (Live)

| ID | Skenario | Tipe | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|---|
| <a id="tc-live-001"></a>LIVE-001 | Health check backend & koneksi database | Smoke | GET /health | 200 {status:'ok', database:'connected'} | Sesuai expected | ✅ PASS |
| <a id="tc-live-002"></a>LIVE-002 | Kontrak katalog konsultan sesuai yang dipakai frontend | Contract | GET /api/v1/consultants/ | 200, data array; tiap item punya id, name, spec, rating, reviews, status, status_verifikasi, tarif_per_sesi; waktu respons < 5 dtk | Sesuai expected — 25 konsultan aktif, 628 ms; nama null: 0 | ✅ PASS |
| <a id="tc-live-003"></a>LIVE-003 | Parameter filter berisi payload injeksi tidak menyebabkan error server | Security | GET /consultants/?spesialisasi=' OR 1=1 --  dan  %25_%25 | 200 dengan data array (tidak 500, tidak membocorkan error SQL) | Sesuai expected | ✅ PASS |
| <a id="tc-live-004"></a>LIVE-004 | Detail konsultan yang tidak ada → 404; ID non-numerik → 422 | Negative | GET /consultants/999999999 ; GET /consultants/abc | 404 detail 'Konsultan tidak ditemukan' ; 422 validation error | Sesuai expected | ✅ PASS |
| <a id="tc-live-005"></a>LIVE-005 | Booked-slots konsultan yang tidak ada mengembalikan array kosong | Contract | GET /consultations/999999999/booked-slots | 200 {data: []} | Sesuai expected | ✅ PASS |
| <a id="tc-live-006"></a>LIVE-006 | Login dengan kredensial salah ditolak tanpa error server | Negative | POST /auth/login-password {email:'tidak.ada.e2e@example.com', password:'SalahSekali123'} | Status 400/401 dengan field detail, bukan 500; tidak ada session | Sesuai expected — 400 detail='Invalid login credentials' | ✅ PASS |
| <a id="tc-live-007"></a>LIVE-007 | Payload login/signup tidak lengkap ditolak validasi (422) | Negative | POST /auth/login-password {email} ; POST /auth/signup {email,password} tanpa name/role | 422 untuk keduanya (tidak ada akun yang dibuat) | Sesuai expected | ✅ PASS |
| <a id="tc-live-008"></a>LIVE-008 | Endpoint privat menolak request tanpa token | Security | Tanpa header Authorization: GET /auth/profile, /users/me/profile/full, /consultations/, /cases/, /consultants/me/schedules, /admin/stats, /chatbot/sessions; POST /cases/, /chatbot/triage, /payments/create-transaction; PATCH /consultants/me/active-status | Semua 401/403 (tidak ada yang 200/500) | Sesuai expected — GET /auth/profile → 401; GET /users/me/profile/full → 401; GET /consultations/ → 401; GET /cases/ → 401; GET /consultants/me/schedules → 401; GET /admin/stats → 401; GET /admin/consultants → 401; GET /chatbot/sessions → 401; POST /cases/ → 401; POST /chatbot/triage → 401; POST /payments/create-transaction → 401; PATCH /consultants/me/active-status → 401 | ✅ PASS |
| <a id="tc-live-009"></a>LIVE-009 | Token palsu/kedaluwarsa ditolak | Security | Authorization: Bearer token.palsu.e2e ke GET /auth/profile & /admin/stats | 401/403, tidak 200/500 | Sesuai expected | ✅ PASS |
| <a id="tc-live-010"></a>LIVE-010 | Toggle slot jadwal wajib autentikasi & kepemilikan | Security | PATCH /consultants/schedules/999999999/toggle {status_tersedia:false} TANPA token (ID tidak ada → tidak mengubah data) | 401/403 — endpoint mengubah data harus terautentikasi | HTTP 200 {"data":[],"count":null} — query UPDATE tetap dieksekusi tanpa auth (pada ID nyata akan mengubah slot milik konsultan mana pun). _(assert: Expected value: 200 · Received array: [401, 403])_ | ❌ FAIL (known defect) [BUG-03](#bug-03) |
| <a id="tc-live-011"></a>LIVE-011 | CORS hanya mengizinkan origin terdaftar | Security | Preflight OPTIONS /api/v1/consultants/ dengan Origin http://localhost:3000 dan https://evil.example | localhost:3000 mendapat Access-Control-Allow-Origin; evil.example tidak | Sesuai expected | ✅ PASS |
| <a id="tc-live-012"></a>LIVE-012 | Webhook Midtrans menolak notifikasi palsu | Security | POST /payments/notification {order_id:'E2E-FAKE-ORDER', transaction_status:'settlement', signature_key:'palsu'} | 4xx 'Verifikasi notifikasi gagal' — status pembayaran tidak dapat dipalsukan | Sesuai expected — HTTP 400 {"detail":"Verifikasi notifikasi gagal"} | ✅ PASS |
| <a id="tc-live-013"></a>LIVE-013 | Body JSON rusak ditangani dengan 4xx | Negative | POST /auth/login-password dengan body '{rusak' (Content-Type JSON) | 422/400, bukan 500 | Sesuai expected | ✅ PASS |
| <a id="tc-live-020"></a>LIVE-020 | Client login & hanya bisa mengakses resource miliknya | E2E | Login akun client uji → GET /auth/profile, /consultations/, /admin/stats, /cases/ | profile.role='client'; /consultations/ 200 array; /admin/stats 403; /cases/ 403 | Tidak dijalankan: E2E_CLIENT_EMAIL/PASSWORD tidak diset di .env.e2e | ⏭️ SKIP |
| <a id="tc-live-021"></a>LIVE-021 | Konsultan login & dapat melihat bursa serta statistiknya | E2E | Login akun konsultan uji → GET /cases/, /consultants/me/dashboard-stats, /admin/stats | /cases/ 200; stats 200 {total_income,total_klien,total_klien_aktif}; /admin/stats 403 | Tidak dijalankan: E2E_CONSULTANT_EMAIL/PASSWORD tidak diset di .env.e2e | ⏭️ SKIP |

## 8. Batasan Pengujian

- **Akun uji sungguhan tidak tersedia** (`.env.e2e` belum diisi): alur login/booking/pembayaran end-to-end terhadap Supabase asli tidak dijalankan; test LIVE-020/021 dilewati. Alur tersebut diuji penuh terhadap backend yang di-mock dengan kontrak response asli.
- **Eksploitasi destruktif tidak dilakukan** pada database bersama (BUG-01 & BUG-04 diverifikasi via code review; BUG-03 diverifikasi live memakai ID yang tidak ada).
- Pembayaran Midtrans memakai stub Snap (sukses/pending/gagal); integrasi sandbox Midtrans nyata, pengiriman email OTP, dan kualitas jawaban AI (RAG) berada di luar cakupan.
- Hanya engine Chromium yang terpasang; Firefox/WebKit (project lama `playwright.config.js`) belum dijalankan.
- Pada mesin Windows ini, lebih dari 2 worker paralel membuat aset `/_next/static` menggantung pada navigasi pertama (masalah environment, bukan aplikasi) sehingga workers dibatasi 2.

## 9. Rekomendasi Prioritas

1. **Segera (sebelum rilis):** BUG-01 (whitelist role & larang eskalasi admin), BUG-03 (auth pada toggle jadwal), BUG-04 (state machine status konsultasi), BUG-02 (create password).
2. **Sprint berikutnya:** BUG-05/06 (role guard terpusat), BUG-07 (validasi `next`), BUG-08, BUG-09, BUG-10, BUG-11, BUG-12, BUG-13, BUG-15, BUG-16, BUG-20, BUG-22.
3. **Backlog perbaikan kualitas:** seluruh temuan Low (UX, konsistensi validasi, aksesibilitas, performa aset).
4. Jalankan `npm run test:regression` di CI (GitHub Actions) pada setiap PR; isi `.env.e2e` dengan akun uji khusus agar suite live terautentikasi ikut berjalan.

## 10. Cara Menjalankan Ulang

```bash
cd frontend
npm install && npx playwright install chromium
npm run build                      # suite memakai build produksi (next start :3100)
npm run test:regression            # E2E + regression UI (desktop + mobile)
npm run test:regression:smoke      # subset @smoke
# backend: cd backend && python -m uvicorn main:app --port 8000
npm run test:live-api              # uji live API non-destruktif
npm run test:all                   # semua project
npm run test:regression:report     # regenerasi laporan ini
npm run test:regression:html       # laporan HTML Playwright (trace & screenshot)
# E2E_STRICT=1 → nonaktifkan penanda known defect (lihat kegagalan apa adanya)
```

Artefak: `E2E_REGRESSION_REPORT.html` (versi interaktif laporan ini), `frontend/tests/e2e/results/regression-html/` (HTML report Playwright + trace/screenshot kegagalan), `frontend/tests/e2e/results/regression-results.json`.

---
_Laporan dibuat otomatis oleh `tests/e2e/regression/support/generate-report.js` dari hasil eksekusi Playwright._