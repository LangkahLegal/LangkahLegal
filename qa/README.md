# QA LangkahLegal — SIT

Satu jenis pengujian: **SIT** (System Integration Test). Skenario ditulis dengan Gherkin, dijalankan
Playwright lewat `playwright-bdd`, terhadap frontend, backend FastAPI, dan Supabase sungguhan.

**Regression** adalah skenario SIT bertag `@critical`.

**Audit keamanan** (pemindaian statis dependensi, kode, dan riwayat git) ada di `security/`; lihat `security/README.md`.

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
npm run audit:security            # npm audit, pip-audit, bandit, semgrep, gitleaks
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
| `security/` | Skrip audit keamanan, daftar kerentanan (`VULNERABILITIES.md`), allowlist gitleaks |

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

## Selector: hanya `data-testid`

Page Object hanya boleh mencari elemen lewat `page.getByTestId(...)`. Class Tailwind, teks tombol,
dan struktur DOM sering berubah saat desain diperbarui; `data-testid` adalah kontrak antara frontend
dan SIT yang tidak ikut berubah.

- Setiap elemen interaktif baru (tombol, input, dropdown, opsi, kartu, tab, modal) wajib diberi
  `data-testid` di frontend.
- Nama: bahasa Inggris kebab-case `<area>-<elemen>[-<jenis>]`, mis. `login-submit-btn`,
  `explore-search-input`, `consultant-card`. Jenis: `-btn`, `-input`, `-card`, `-item`, `-tab`,
  `-modal`, `-message`, `-empty`, `-error`.
- Item berulang memakai satu id yang sama, lalu dipilih dengan `.filter({ hasText })`.
- Komponen yang dipakai ulang menerima prop `testId`. `Dropdown`, `SelectDropdown`, dan
  `PillDropdown` memberi pemicunya `data-testid={testId}` dan tiap opsinya `${testId}-option`.
- Pengecualian: `page.locator("html")` untuk memeriksa tema.
- Jangan mengganti nama `data-testid` yang sudah ada tanpa memperbarui POM yang memakainya.

`npm run lint:selectors` memeriksa aturan ini dan dijalankan di CI.

## Notifikasi dan konfirmasi

Aplikasi tidak memakai `alert()` atau `confirm()` (dilarang aturan ESLint `no-alert`). Notifikasi
tampil sebagai toast (`data-testid="toast"`, atribut `data-variant` = `success`/`error`/`info`) dan
konfirmasi sebagai dialog aplikasi (`confirm-dialog`, `confirm-dialog-accept`,
`confirm-dialog-cancel`), keduanya dari `useToast()`/`useConfirm()` di
`frontend/src/providers/FeedbackProvider.js`.

Fixture `dialogs` (`support/dialogs.js`) merekam setiap toast dan dialog yang muncul, termasuk yang
sudah hilang sendiri:

| Pemakaian | Arti |
|---|---|
| `muncul pemberitahuan "<teks>"` | Toast berisi teks itu pernah muncul |
| `tidak ada dialog yang muncul` | Tidak ada toast, dialog konfirmasi, maupun dialog browser |
| `dialogs.accept(teks)` / `dialogs.dismiss(teks)` | Menjawab dialog konfirmasi |

## CI

| Workflow | Kapan | Isi |
|---|---|---|
| `ci.yml` | Push ke `main`/`dev`, setiap PR | Frontend: lint + build. Backend: ruff + aplikasi bisa dimuat. QA: `bddgen` + `lint:selectors`. Job hanya berjalan untuk folder yang berubah |
| `security.yml` | PR ke `main`/`dev`, push ke `main`, tiap Senin | `npm run audit:security`; gagal bila ada temuan critical/high |
| `regression.yml` | PR ke `main`, manual (pilih `regression` atau `sit`) | SIT terhadap database dev; tidak pernah berjalan bersamaan |
| `codeql.yml` | Push, PR, tiap Senin | Analisis CodeQL JavaScript dan Python |

`regression.yml` butuh secret repositori `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_JWT_SECRET`, dan `SIT_ACCOUNT_PASSWORD` (opsional: `SUPABASE_ANON_KEY`,
`MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `GOOGLE_API_KEY`, `VOYAGE_API_KEY`). Tanpa secret itu
job dilewati dengan catatan di ringkasan run.

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
