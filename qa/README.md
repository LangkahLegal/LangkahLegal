# QA LangkahLegal — SIT

Satu jenis pengujian: **SIT** (System Integration Test). Skenario ditulis dengan Gherkin, dijalankan
Playwright lewat `playwright-bdd`, terhadap frontend, backend FastAPI, dan Supabase sungguhan.

**Regression** adalah skenario SIT bertag `@critical`.

## Menjalankan

```bash
cd qa
npm install
npx playwright install chromium
cp .env.sit.example .env.sit      # isi SIT_ACCOUNT_PASSWORD
npm run build:frontend            # sekali, atau setiap frontend berubah

npm run sit                       # semua skenario
npm run sit:headed                # semua skenario, browser terlihat
npm run regression                # hanya @critical
npm run regression:headed
npm run report                    # buka laporan HTML terakhir
```

Satu halaman atau satu skenario:

```bash
npm run sit -- --grep @login
npm run sit:headed -- --grep @AUTH-005
```

Backend (port 8000) dan frontend (port 3000) dinyalakan otomatis bila belum berjalan. Backend hanya
menerima origin `http://localhost:3000`, jadi port frontend tidak bisa diganti.

Isi `SIT_SLOWMO=300` di `.env.sit` untuk memperlambat aksi pada mode headed.

## Struktur

| Folder | Isi |
|---|---|
| `features/<halaman>/` | Skenario Gherkin, satu folder per halaman |
| `specs/<halaman>/` | Step definition, satu blok per skenario mengikuti urutan di feature |
| `specs/umum/` | Langkah yang dipakai lintas halaman (navigasi, jaringan, data awal) |
| `pages/<halaman>/` | Page Object Model |
| `test_data/` | Akun uji, isian formulir, berkas contoh |
| `hooks/` | Fixture dan hook |
| `support/` | Akses database, sesi, pengamat jaringan, data awal |

File spec Playwright dibangkitkan otomatis ke `.features-gen/` oleh `bddgen`; jangan disunting.

## Gaya penulisan skenario

Langkah menyebut maksud bisnisnya, bukan klik dan isian. Nilai konkret ada di `test_data`.

```gherkin
Scenario: Kata sandi dengan format tidak valid ditolak
  Given pengguna berada di halaman buat kata sandi
  When pengguna membuat kata sandi dengan format tidak valid
  Then setiap kata sandi itu ditolak dengan pesan yang sesuai
```

Tabel `Examples` tidak dipakai; kumpulan kasus ditaruh di `test_data` dan diputar oleh step.

## Hooks

| File | Kapan berjalan |
|---|---|
| `before-all.hooks.js` / `after-all.hooks.js` | Sekali per worker |
| `before.hooks.js` / `after.hooks.js` | Tiap skenario |
| `before-step.hooks.js` / `after-step.hooks.js` | Tiap langkah |
| `continue.hooks.js` | Tag `@continue` |
| `precondition.hooks.js` | Tag `@precondition:<nama>` |
| `critical.hooks.js` | Tag `@critical` |

## Tag

| Tag | Arti |
|---|---|
| `@critical` | Masuk regression |
| `@mobile` | Dijalankan juga pada viewport ponsel |
| `@khusus-mobile` | Hanya pada viewport ponsel |
| `@precondition:<nama>` | Prasyarat disiapkan hook, mis. `login-klien` |
| `@continue` | Meneruskan sesi browser dari skenario tepat sebelumnya |
| `@stub` | Satu layanan disimulasikan (email, Midtrans, Google, proses dokumen) |
| `@fail @BUG-nn` | Bug yang sudah diketahui; skenario diharapkan gagal sampai bug diperbaiki |
| `@layanan-eksternal` | Butuh kunci API pihak ketiga yang sah (Voyage, Gemini) |

## Data uji

Lima akun `sit.*@example.com` dibuat otomatis di Supabase saat suite dijalankan. Skenario menulis
ke database sungguhan lalu membersihkan datanya sendiri; pengguna sementara berawalan
`sit.sementara.` dihapus kembali setelah dipakai.

Akun `sit.konsultan` berstatus terverifikasi dan aktif, jadi terlihat di katalog publik.
