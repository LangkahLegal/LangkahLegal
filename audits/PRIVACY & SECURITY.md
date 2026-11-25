# Analisis Privacy, Security, URL Slug, Verifikasi Konsultan, dan Refinement Flow LangkahLegal

**Tanggal analisis:** 5 November 2026  
**Cakupan:** backend, frontend, konfigurasi, integrasi eksternal, database yang dapat diinferensikan dari source code, dokumentasi internal, dan QA  
**Metode:** static code review; tidak ada source code aplikasi, database, atau konfigurasi runtime yang diubah  

> [!IMPORTANT]
> Repository tidak memuat migration/DDL, RLS policy, trigger, storage policy, view, dan definisi RPC Supabase. Constraint dan perlindungan database tidak dapat dibuktikan dari source code. Dokumen ini memakai asumsi konservatif: kontrol database belum terjamin sampai DDL production diekspor dan diverifikasi.

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Arsitektur dan Kondisi Codebase](#2-arsitektur-dan-kondisi-codebase)
3. [Review Privacy dan Security](#3-review-privacy-dan-security)
4. [Rancangan Perubahan URL Slug](#4-rancangan-perubahan-url-slug)
5. [Rancangan Registrasi dan Verifikasi Konsultan](#5-rancangan-registrasi-dan-verifikasi-konsultan)
6. [Refinement Pengajuan, Jadwal, dan Status](#6-refinement-pengajuan-jadwal-dan-status)
7. [Refinement Pembayaran](#7-refinement-pembayaran)
8. [Refinement Dokumen](#8-refinement-dokumen)
9. [Refinement Notifikasi dan Reminder](#9-refinement-notifikasi-dan-reminder)
10. [Rating, Penyelesaian Sesi, dan Sengketa](#10-rating-penyelesaian-sesi-dan-sengketa)
11. [Audit Trail](#11-audit-trail)
12. [Deployment, Database, dan Testing](#12-deployment-database-dan-testing)
13. [Prioritas Backlog](#13-prioritas-backlog)
14. [Roadmap Implementasi](#14-roadmap-implementasi)
15. [Acceptance Criteria](#15-acceptance-criteria)
16. [Kesimpulan](#16-kesimpulan)

---

# 1. Ringkasan Eksekutif

## 1.1 Stack utama

| Area | Teknologi |
|---|---|
| Frontend | Next.js 15, React 19, Axios, Zustand, TanStack Query |
| Backend | FastAPI, Pydantic, Uvicorn |
| Database/Auth/Storage | Supabase/PostgreSQL/PostgREST |
| AI/RAG | Gemini, Voyage AI, pgvector/RPC Supabase |
| Pembayaran | Midtrans |
| Email | Brevo |
| QA | Playwright BDD terhadap sistem nyata |

Backend sudah memakai pola yang cukup sehat:

```text
router → service → repository/helper → Supabase/provider eksternal
```

Tidak perlu migrasi framework atau pemecahan menjadi microservices. Perubahan paling penting berada pada keamanan, transaction boundary, constraint database, lifecycle domain, dan reproducibility deployment.

## 1.2 Risiko terbesar

1. Secret produksi ditemukan dalam `backend/.env`.
2. Access dan refresh token disimpan dalam `localStorage`.
3. Dokumen perkara memperoleh public URL.
4. Schema, migration, RLS, trigger, dan RPC Supabase tidak version-controlled.
5. Booking jadwal dan claim bursa rentan race condition.
6. Update pembayaran dan konsultasi tidak atomic.
7. Status konsultasi, reservasi, dan pembayaran tercampur.
8. Rate limit endpoint auth belum lengkap dan masih memory-only.
9. Data hukum sensitif dikirim ke provider AI tanpa lapisan redaksi PII yang terlihat.
10. Email/notifikasi tidak memiliki outbox, retry, deduplikasi, atau delivery tracking.
11. Tidak ada scheduler bisnis untuk reminder, expiry, reconciliation, dan cleanup.
12. Role konsultan dapat berubah tanpa lifecycle onboarding profesional yang kuat.

## 1.3 Jawaban inti perubahan URL

Perubahan URL **tidak memerlukan rombak besar** jika memakai pola berikut:

- integer primary key dan foreign key tetap dipertahankan;
- konsultan mendapat `slug` manusia;
- konsultasi dan kasus mendapat `public_id` opaque;
- URL integer lama tetap aktif selama masa transisi;
- slug lama disimpan dalam history;
- URL lama diarahkan ke canonical URL baru.

Contoh:

```text
Sebelum:
/explore/131
/consultation/847

Sesudah:
/konsultan/budi-santoso
/konsultasi/550e8400-e29b-41d4-a716-446655440000
```

## 1.4 Jawaban inti verifikasi konsultan

- Konsultan baru dibuat sebagai `pending`, `is_active = false`.
- Konsultan wajib menyelesaikan onboarding lalu mengirim verifikasi.
- Hanya konsultan verified, aktif, lengkap, dan tidak suspended yang boleh direkomendasikan AI.
- Konsultan lama tidak perlu mengulang verifikasi.
- Data lama diberi `verification_source = legacy`.
- Popup dipakai sebagai pengingat, tetapi banner persisten tetap wajib tersedia di dashboard.

---

# 2. Arsitektur dan Kondisi Codebase

## 2.1 Backend

Struktur aktual:

```text
backend/
├── routers/       # HTTP parsing, dependency auth/role, response wiring
├── services/      # aturan bisnis dan orchestration
├── repositories/  # query Supabase/PostgREST
├── helpers/       # validasi dan transformasi domain
├── schemas/       # kontrak request/response
├── middleware/    # session, authorization, rate limit
├── core/          # config, constants, exceptions, database client
└── docs/          # dokumentasi API dan review historis
```

Contoh alur konsultasi:

1. `backend/routers/consultations.py` menerima request dan memeriksa role.
2. `backend/services/consultation_service.py` menjalankan business rule.
3. `backend/repositories/consultation_repository.py` mengakses Supabase.
4. `backend/helpers/schedule.py` memvalidasi waktu dan slot.

Status domain dipusatkan di:

```text
backend/core/constants.py
```

### Penilaian

Kekuatan:

- router relatif tipis;
- business rule mayoritas berada di service;
- repository mengisolasi PostgREST;
- role dependency tersedia;
- QA end-to-end cukup luas.

Kelemahan:

- transaction boundary penting belum berada di database;
- schema DB tidak berada dalam repository;
- beberapa kontrak HTTP masih memakai string longgar;
- test pyramid terbalik: SIT besar, unit/contract test minim atau tidak ada.

## 2.2 Frontend

Frontend memakai Next.js App Router. Browser mengakses FastAPI secara langsung melalui Axios.

Temuan:

- `frontend/src/middleware.js` tidak melakukan proteksi auth/role nyata.
- `frontend/src/lib/authStorage.js` menyimpan token dan role dalam `localStorage`.
- `frontend/src/lib/axios.js` menambahkan bearer token dan melakukan refresh.
- Beberapa akses chatbot melewati service layer:
  - `frontend/src/app/ai/page.js`
  - `frontend/src/stores/useChatStore.js`
- `frontend/src/services/admin.service.js` masih memiliki call endpoint transaksi admin yang tidak terlihat pada backend aktual.

Backend tetap harus menjadi sumber authorization. Middleware frontend hanya boleh meningkatkan UX, bukan menggantikan pemeriksaan server.

## 2.3 Database yang dapat diinferensikan

Tabel utama:

```text
users
konsultan
jadwal_ketersediaan
pengajuan_konsultasi
dokumen_pendukung
bursa_kasus
transaksi
rating_ulasan
chat_sessions
chat_messages
dokumen_hukum
```

Objek database lain yang dirujuk:

```text
dokumen_hukum_summary
admin_transaction_stats
match_dokumen_hukum
search_consultants_by_category
```

Risiko:

- FK dan cascade tidak dapat diverifikasi;
- unique constraint tidak dapat diverifikasi;
- RLS tidak dapat diverifikasi;
- storage policy tidak dapat diverifikasi;
- function/RPC contract tidak dapat direproduksi;
- local environment tidak dapat membangun DB yang sama dengan production;
- kemungkinan terdapat trigger tersembunyi untuk membuat profil konsultan.

## 2.4 Deployment dan CI

Ditemukan beberapa sinyal deployment:

- root `Dockerfile` menjalankan backend;
- frontend memiliki URL fallback Railway;
- backend memiliki `vercel.json`;
- workflow CD mencari Dockerfile pada lokasi yang berbeda dari root.

Risiko: pipeline terlihat hijau, tetapi build/push backend dapat tidak berjalan.

CI backend juga belum terlihat menjalankan behavior tests. Workflow yang ada lebih dekat ke install dependency dan Ruff lint.

---

# 3. Review Privacy dan Security

## 3.1 Matriks temuan

| Prioritas | Temuan | Dampak utama |
|---|---|---|
| P0 | Secret produksi dalam `.env` | Akses penuh provider/DB, biaya, impersonation |
| P0 | Dokumen perkara memakai public URL | Kebocoran bukti, identitas, dokumen hukum |
| P0 | Refresh token di `localStorage` | Session takeover melalui XSS |
| P0/P1 | Auth rate limit tidak lengkap | Brute force, OTP guessing, abuse |
| P1 | Service-role Supabase global | RLS dilewati, IDOR berdampak besar |
| P1 | CORS terlalu luas | Preview deployment dapat mengakses credentialed API |
| P1 | CSRF defense tidak eksplisit | State-changing request lintas situs |
| P1 | Data sensitif dikirim ke AI | Privacy/vendor data leakage |
| P1 | Logging data sensitif | Query hukum dan payload payment masuk log |
| P1 | Upload validation lemah | Polyglot, malware, stored content abuse |
| P1 | Redirect OAuth/reset bebas | Open redirect/phishing |
| P1 | Draft kasus di `localStorage` | Kebocoran pada perangkat bersama/XSS |
| P2 | Security headers tidak terlihat | Dampak XSS/clickjacking lebih besar |
| P2 | Dependency AI tidak dipin penuh | Build tidak reproducible |

## 3.2 Secret produksi dalam workspace

Bukti:

```text
backend/.env
```

Kategori credential yang ditemukan:

- Supabase service-role;
- Supabase JWT secret;
- Google/Gemini;
- Voyage;
- Brevo;
- Cloudinary;
- ImgBB;
- API hukum pihak ketiga.

Nilai secret tidak dicantumkan dalam dokumen ini.

### Dampak

- service-role dapat melewati RLS;
- database dan storage dapat dibaca/diubah/dihapus;
- JWT berpotensi dipalsukan bila secret aktif;
- email phishing dapat dikirim melalui akun provider;
- API AI/storage dapat disalahgunakan dan menimbulkan biaya;
- aset dapat dimodifikasi atau dihapus.

### Rekomendasi

1. Rotasi seluruh secret.
2. Audit log semua provider.
3. Pindahkan secret ke secret manager deployment.
4. Pastikan `.env` tidak pernah masuk Git atau artefak CI.
5. Tambahkan Gitleaks/TruffleHog pada pre-commit dan CI.
6. Bersihkan Git history jika pernah ter-commit, setelah seluruh secret dirotasi.
7. Dokumentasikan owner, expiry, scope, dan prosedur rotasi tiap secret.

> [!WARNING]
> Menghapus file `.env` saja tidak mencabut credential. Rotasi provider wajib dilakukan lebih dahulu.

## 3.3 Token dalam `localStorage`

Bukti:

```text
frontend/src/lib/authStorage.js
frontend/src/lib/axios.js
backend/helpers/cookies.py
```

Frontend menyimpan access token dan refresh token dalam `localStorage`. Backend sudah memiliki helper cookie `HttpOnly`, tetapi frontend belum memakai model tersebut sebagai sumber tunggal sesi.

### Risiko

- XSS dapat mengambil refresh token;
- dependency frontend berbahaya dapat membaca token;
- browser extension dapat membaca token;
- sesi admin dan konsultan dapat bertahan lama setelah token dicuri.

### Target desain

```text
Refresh token:
- HttpOnly
- Secure
- SameSite=Lax bila memungkinkan
- rotation setiap refresh
- family/reuse detection

Access token:
- memory-only
- umur pendek
- tidak disimpan permanen di browser
```

Jika cookie digunakan untuk request state-changing:

- verifikasi `Origin`;
- terapkan CSRF token;
- gunakan exact CORS allowlist;
- jangan mengembalikan refresh token kepada JavaScript.

## 3.4 Dokumen perkara memakai public URL

Bukti:

```text
backend/services/storage_service.py:43-52
backend/services/storage_service.py:123-167
```

Dokumen konsultasi diunggah lalu mendapat public URL.

### Risiko

Dokumen dapat memuat:

- KTP;
- alamat;
- surat medis;
- bukti kekerasan;
- kontrak;
- tanda tangan;
- nomor rekening;
- bukti perkara pidana/perdata.

URL dapat bocor melalui log, history, email, screenshot, analytics, referrer, atau database read. UUID pada URL bukan kontrol akses.

### Target desain storage

```text
public-profile
  avatar dan aset profil publik

private-consultation-documents
  dokumen dan bukti perkara

private-consultant-verification
  izin praktik, ijazah, dan identitas profesional
```

Simpan:

```text
bucket
object_path
original_filename
detected_mime
size
sha256
uploaded_by
created_at
```

Jangan simpan public URL permanen. Generate signed URL setelah backend memeriksa akses.

## 3.5 Rate limiting auth

Bukti:

```text
backend/middleware/rate_limit.py
backend/routers/auth.py
```

Limiter memakai `memory://`. Beberapa endpoint sensitif belum memiliki limit efektif.

### Endpoint wajib dilindungi

- signup;
- login password;
- OTP verification;
- resend OTP;
- password reset;
- OAuth exchange;
- token refresh;
- payment create/sync;
- upload dokumen;
- endpoint AI mahal.

### Target desain

Gunakan Redis/KV bersama. Kombinasikan key:

```text
route + IP
route + normalized email
route + account ID
route + device/session
global route bucket
```

Tambahkan progressive backoff dan monitoring credential stuffing.

## 3.6 Service-role Supabase global

Bukti:

```text
backend/core/config.py
backend/core/database.py
```

Service-role menjadi client global. Service-role melewati RLS, sehingga authorization sepenuhnya bergantung pada filter Python.

### Rekomendasi

- gunakan anon/user-scoped client untuk operasi user-facing;
- teruskan JWT user agar RLS aktif;
- batasi service-role pada admin/background module;
- version-control seluruh RLS policy;
- buat integration test lintas tenant.

Contoh test wajib:

```text
User A tidak dapat membaca konsultasi User B.
Konsultan A tidak dapat mengubah jadwal Konsultan B.
Client tidak dapat membaca dokumen konsultasi lain.
Admin-only endpoint menolak role non-admin.
```

## 3.7 CORS dan CSRF

Bukti CORS:

```text
backend/main.py:26-32
```

CORS menerima semua `*.vercel.app`, seluruh subdomain produk, credentials, method, dan header.

### Target

Production exact allowlist:

```text
https://langkahlegal.com
https://www.langkahlegal.com
https://staging.langkahlegal.com
```

Preview deployment harus memakai backend dan database staging terpisah.

Jika cookie memakai `SameSite=None`:

- CSRF token wajib;
- `Origin`/`Referer` state-changing request wajib diverifikasi;
- method/header dibatasi sesuai kebutuhan.

## 3.8 Privacy AI/RAG

Bukti:

```text
backend/services/chat_policy.py
backend/services/rag_service.py
backend/services/doc_processing.py
backend/services/chat_service.py
```

Riwayat chat, pertanyaan hukum, draft konsultasi, konteks, dan preview dokumen dapat dikirim ke provider AI. Tidak terlihat redaksi PII sebelum pengiriman.

### Pipeline yang disarankan

```text
input
→ sensitivity classification
→ PII detection
→ stable placeholder replacement
→ minimization/summarization
→ provider AI
→ output safety/leakage check
→ persistence berdasarkan retention policy
```

Contoh redaksi:

```text
Budi Santoso      → [PERSON_1]
3273xxxxxxxxxxxx  → [NIK_1]
0812xxxx          → [PHONE_1]
Jl. Melati 4      → [ADDRESS_1]
```

### Governance

Dokumentasikan:

- legal basis/consent;
- tujuan pemrosesan;
- provider dan subprocessor;
- region;
- retention;
- training opt-out;
- delete/export;
- fallback non-AI;
- DPA provider.

Tambahkan prompt-injection test dan leakage evaluation.

## 3.9 Logging dan exception leakage

Bukti:

```text
backend/services/rag_service.py
backend/services/payment_service.py
backend/services/chat_service.py
backend/middleware/session.py
backend/services/storage_service.py
```

Masalah:

- query pengguna dicatat;
- webhook Midtrans dicatat utuh;
- beberapa `str(e)` dikembalikan ke client.

### Logging aman

Log:

```text
request_id
actor_id pseudonymous
route
status_code
latency
provider
error_code
event type
```

Jangan log:

```text
chat/query mentah
signature pembayaran
token
signed URL
isi dokumen
exception provider mentah
```

Response error:

```json
{
  "code": "PAYMENT_PROVIDER_ERROR",
  "message": "Pembayaran belum dapat diproses.",
  "request_id": "req_..."
}
```

## 3.10 Upload security

Bukti:

```text
backend/services/storage_service.py
```

Gambar diperiksa melalui ekstensi dan `Content-Type` dari client. PDF sudah memiliki pemeriksaan magic byte.

### Rekomendasi

- deteksi MIME dari byte;
- decode dan re-encode gambar;
- hapus metadata EXIF;
- batasi body size di proxy dan aplikasi;
- stream upload;
- malware scan;
- gunakan `Content-Disposition: attachment` untuk dokumen;
- gunakan `X-Content-Type-Options: nosniff`.

## 3.11 Redirect OAuth/reset

Bukti:

```text
backend/schemas/auth.py
backend/services/auth_service.py
```

`redirectTo` diterima sebagai string bebas.

### Target

Terima path relatif:

```text
/auth/callback
/auth/reset-password
```

Backend menggabungkan path dengan `FRONTEND_URL`. Tolak origin lain, protocol non-HTTPS, fragment, userinfo, wildcard, dan encoded bypass.

## 3.12 Draft perkara dalam browser storage

Bukti:

```text
frontend/src/lib/consultationDraft.js
```

Gunakan `sessionStorage` untuk kebutuhan singkat, atau simpan draft server-side dengan opaque ID. Hapus draft setelah dipakai, logout, dan expiry.

## 3.13 Security headers

Tambahkan dan verifikasi pada deployment nyata:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy
frame-ancestors 'none'
```

## 3.14 Privacy data inventory

| Data | Tujuan | Lokasi | Vendor | Retention | Penghapusan |
|---|---|---|---|---|---|
| Profil user | Operasional akun | Supabase | Supabase | Selama akun aktif | Delete/anonymize |
| Dokumen perkara | Konsultasi | Private Storage | Supabase | Sesuai perkara | Secure delete |
| Chat hukum | AI assistance | DB + AI provider | Google/Voyage | Pendek | Delete/export |
| Pembayaran | Rekonsiliasi | DB + Midtrans | Midtrans | Legal/accounting | Sesuai kewajiban |
| Dokumen verifikasi | Verifikasi konsultan | Private Storage | Supabase | Review + legal need | Restricted delete |

---

# 4. Rancangan Perubahan URL Slug

## 4.1 Prinsip

Jangan mengganti primary key dan foreign key dengan slug.

```text
Internal identifier:
  integer/UUID tetap menjadi PK/FK

Public identifier:
  slug atau public_id untuk URL
```

Manfaat:

- migration kecil;
- relasi database tetap stabil;
- rename URL tidak merusak FK;
- rollback mudah;
- endpoint lama dapat dipertahankan.

## 4.2 Identifier per resource

### Konsultan

Gunakan slug manusia:

```text
/konsultan/budi-santoso
```

### Konsultasi

Gunakan UUID/public ID opaque:

```text
/konsultasi/550e8400-e29b-41d4-a716-446655440000
```

Jangan memasukkan nama atau kategori perkara ke URL. URL dapat masuk browser history, analytics, referrer, log, dan screenshot.

### Bursa kasus

Gunakan opaque public ID:

```text
/kasus/550e8400-e29b-41d4-a716-446655440000
```

## 4.3 Perubahan database konseptual

```sql
alter table konsultan
  add column slug text,
  add column slug_updated_at timestamptz;

create unique index konsultan_slug_unique
  on konsultan (lower(slug))
  where slug is not null;

alter table pengajuan_konsultasi
  add column public_id uuid default gen_random_uuid();

create unique index pengajuan_konsultasi_public_id_unique
  on pengajuan_konsultasi (public_id);

alter table bursa_kasus
  add column public_id uuid default gen_random_uuid();

create unique index bursa_kasus_public_id_unique
  on bursa_kasus (public_id);
```

Urutan aman:

1. Tambah kolom nullable.
2. Backfill.
3. Validasi collision/null.
4. Tambah unique index.
5. Deploy endpoint baru.
6. Deploy link frontend baru.
7. Pantau traffic lama.
8. Baru tambahkan `NOT NULL`.

## 4.4 Slug history

```sql
create table resource_slug_history (
  id bigint generated always as identity primary key,
  resource_type text not null,
  resource_id bigint not null,
  slug text not null,
  created_at timestamptz not null default now(),
  retired_at timestamptz,
  unique (resource_type, slug)
);
```

Lookup:

1. Cari current slug.
2. Jika tidak ditemukan, cari slug history.
3. Jika history ditemukan, ambil current slug resource.
4. Redirect `308 Permanent Redirect` ke canonical URL.
5. Jika tidak ditemukan, return `404`.

## 4.5 Pembuatan slug

Normalisasi:

1. Unicode NFKD.
2. Buang diacritic.
3. Lowercase.
4. Non-alfanumerik menjadi `-`.
5. Collapse dash.
6. Trim dash.
7. Batasi panjang, misalnya 80 karakter.

Collision:

```text
budi-santoso
budi-santoso-2
budi-santoso-3
```

Gunakan unique constraint dan retry. Jangan hanya mengandalkan pre-check karena race condition.

Reserved slug:

```text
me
new
admin
api
search
verify
verification
settings
history
schedules
available-slots
null
undefined
```

## 4.6 Rename policy

Jangan otomatis mengganti slug setiap nama profil berubah.

```text
Registrasi/onboarding:
  generate slug sekali

Edit nama:
  slug tetap

Ubah URL profil:
  aksi eksplisit user/admin
```

Rename transaction:

1. Lock row konsultan.
2. Validasi slug baru.
3. Pastikan tidak dipakai current/history user lain.
4. Simpan slug lama ke history.
5. Update current slug.
6. Commit.

## 4.7 Endpoint backward-compatible

Endpoint lama tetap tersedia:

```text
GET  /api/v1/consultants/{id_konsultan}
GET  /api/v1/consultations/{id_pengajuan}
POST /api/v1/cases/{id_bursa}/claim
```

Endpoint baru:

```text
GET  /api/v1/consultants/by-slug/{slug}
GET  /api/v1/consultations/public/{public_id}
POST /api/v1/cases/public/{public_id}/claim
```

Hindari route polymorphic `/{identifier}` karena angka dapat ambigu dan slug dapat bentrok dengan route statis.

Response transisi:

```json
{
  "id": 131,
  "slug": "budi-santoso",
  "canonical_url": "/konsultan/budi-santoso"
}
```

## 4.8 Redirect URL lama

Contoh:

```text
/explore/131
```

Flow:

1. Resolve ID melalui endpoint lama.
2. Ambil current slug.
3. Redirect ke `/konsultan/budi-santoso`.
4. Endpoint lama tetap aktif untuk bookmark dan email lama.

Private resource harus melalui authorization sebelum memberikan hasil atau redirect.

## 4.9 Scope file saat implementasi

Backend:

```text
backend/repositories/consultant_repository.py
backend/repositories/consultation_repository.py
backend/repositories/case_repository.py
backend/services/consultant_service.py
backend/services/consultation_service.py
backend/services/case_service.py
backend/routers/consultants.py
backend/routers/consultations.py
backend/routers/cases.py
backend/helpers/email_templates.py
```

Frontend:

```text
frontend/src/services/consultant.service.js
frontend/src/services/consultation.service.js
frontend/src/services/case.service.js
frontend/src/components/explore/ConsultantCard.jsx
frontend/src/components/ai/AIConsultantCard.jsx
frontend/src/components/dashboard/ConsultationCard.jsx
frontend/src/app/explore/[id]/page.js
frontend/src/app/consultation/[id]/page.js
frontend/src/app/bursa/page.js
```

Migration:

```text
supabase/migrations/<timestamp>_public_identifiers.sql
```

---

# 5. Rancangan Registrasi dan Verifikasi Konsultan

## 5.1 Kondisi saat ini

Flow password:

```text
pilih role
→ signup
→ OTP
→ create/update users
→ dashboard
```

Flow OAuth:

```text
pilih role
→ simpan pending role
→ OAuth
→ callback
→ create/update users
```

Rujukan:

```text
frontend/src/app/auth/role/page.js
frontend/src/app/auth/signup/page.js
frontend/src/app/auth/verify/page.js
frontend/src/app/auth/callback/page.js
backend/services/auth_service.py
```

Masalah:

- role dapat diubah setelah login;
- perubahan role belum memiliki state machine;
- pembuatan row `konsultan` tidak terlihat eksplisit dalam aplikasi;
- kemungkinan bergantung pada trigger Supabase yang tidak versioned;
- `is_active` dan verification status belum dipisahkan tegas;
- katalog dapat menampilkan profil yang aktif tetapi belum verified;
- CTA booking frontend belum selalu memeriksa eligibility server-side.

## 5.2 Model status

```text
users.role:
  client
  konsultan
  admin
```

```text
konsultan.onboarding_status:
  not_started
  draft
  submitted
  needs_revision
  complete
```

```text
konsultan.status_verifikasi:
  pending
  terverifikasi
  ditolak
  suspended
```

```text
konsultan.is_active:
  true
  false
```

Makna:

- `role`: tipe akun;
- `onboarding_status`: kelengkapan data;
- `status_verifikasi`: hasil pemeriksaan;
- `is_active`: sedang menerima klien atau tidak.

Metadata tambahan:

```text
verification_source: legacy | admin | import
verified_at
verified_by
submitted_at
rejected_at
suspended_at
verification_version
```

## 5.3 Flow konsultan baru

```text
1. User memilih role konsultan.
2. User menyelesaikan auth dan verifikasi email.
3. Backend membuat users.
4. Backend membuat profil konsultan secara eksplisit.
5. Status awal:
   onboarding_status = not_started
   status_verifikasi = pending
   is_active = false
6. User diarahkan ke onboarding profesional.
7. User mengisi data dan menyimpan draft.
8. User submit verifikasi.
9. Profil dikunci sebagian selama review.
10. Admin approve, reject, atau meminta revisi.
11. Approval:
    onboarding_status = complete
    status_verifikasi = terverifikasi
12. Konsultan memilih aktif/tidak aktif.
13. Hanya profil eligible masuk katalog/rekomendasi.
```

Data onboarding:

- nama profesional;
- nomor izin praktik;
- spesialisasi;
- kota praktik;
- pendidikan;
- pengalaman;
- tarif;
- bio;
- dokumen izin;
- dokumen pendidikan;
- foto profil;
- portofolio;
- persetujuan ketentuan.

## 5.4 Endpoint minimum

Konsultan:

```text
GET  /api/v1/consultants/me/onboarding
PUT  /api/v1/consultants/me/onboarding
POST /api/v1/consultants/me/submit-verification
GET  /api/v1/consultants/me/verification
```

Admin:

```text
GET   /api/v1/admin/consultants?verification_status=pending
GET   /api/v1/admin/consultants/{id}/verification
PATCH /api/v1/admin/consultants/{id}/verification
```

Contoh decision request:

```json
{
  "decision": "approved",
  "reason": null,
  "expected_version": 4
}
```

`expected_version` mencegah keputusan dua admin saling menimpa.

## 5.5 Role transition

Endpoint role tidak boleh menjadi switch bebas.

Aturan:

```text
Role awal:
  hanya dapat dipilih sekali saat onboarding akun

Client → konsultan:
  membuat profil konsultan draft
  tidak langsung mendapat akses penuh

Konsultan → client:
  tidak otomatis bila masih ada jadwal/konsultasi/payment aktif

Perubahan ke/dari admin:
  hanya melalui admin operation yang diaudit
```

## 5.6 Backward compatibility data lama

### Legacy verified

```text
status_verifikasi = terverifikasi
onboarding_status = complete
verification_source = legacy
is_active dipertahankan
```

### Legacy pending atau tidak lengkap

Pilihan aman:

```text
- tetap dapat login;
- tetap dapat menyelesaikan konsultasi lama;
- tidak menerima booking baru;
- tidak masuk rekomendasi AI;
- mendapat banner verifikasi.
```

Pilihan masa tenggang:

```text
- tetap muncul pada katalog untuk jangka waktu tertentu;
- tidak masuk AI recommendation;
- wajib menyelesaikan verifikasi sebelum deadline.
```

Rekomendasi: gunakan pilihan aman untuk profil yang belum pernah memiliki bukti verifikasi.

### Role konsultan tanpa row konsultan

Repair migration:

```text
users.role = konsultan
AND konsultan.id_user tidak ditemukan
```

Hasil:

```text
create profile
onboarding_status = not_started
status_verifikasi = pending
is_active = false
verification_source = legacy
```

Jangan menandai verified hanya berdasarkan role.

## 5.7 Popup dan banner

Popup setelah login:

```text
Verifikasi profil profesional

Lengkapi dan verifikasi profil agar dapat direkomendasikan oleh AI
serta menerima konsultasi baru.

[Lanjutkan verifikasi] [Nanti]
```

Popup dapat ditunda. Banner persisten tetap tampil:

| State | Pesan |
|---|---|
| `not_started` | Lengkapi profil profesional Anda. |
| `draft` | Profil belum dikirim untuk pemeriksaan. |
| `submitted/pending` | Verifikasi sedang diperiksa. |
| `needs_revision` | Beberapa data perlu diperbaiki. |
| `ditolak` | Verifikasi ditolak. Lihat alasan. |
| `terverifikasi` | Profil telah terverifikasi. |
| `suspended` | Profil ditangguhkan. Hubungi dukungan. |

Lokasi UI:

```text
frontend/src/app/dashboard/consultant/page.js
frontend/src/app/setting/profile/page.js
```

## 5.8 Eligibility rekomendasi AI

Filter wajib:

```text
status_verifikasi = terverifikasi
is_active = true
onboarding_status = complete
deleted_at IS NULL
suspended_at IS NULL
slug IS NOT NULL
nama_lengkap tidak kosong
spesialisasi valid
tarif valid
```

Pisahkan hasil:

```text
recommended_bookable:
  memiliki slot aktual

recommended_profile_only:
  verified tetapi belum memiliki slot
```

CTA:

```text
Ada slot: Pilih jadwal
Tidak ada slot: Lihat profil
```

Frontend bukan kontrol utama. Endpoint booking tetap wajib menolak konsultan non-eligible.

---

# 6. Refinement Pengajuan, Jadwal, dan Status

## 6.1 Flow saat ini

Konsultasi langsung:

```text
pilih jadwal
→ pengajuan pending
→ konsultan accept/reject
→ menunggu pembayaran
→ payment settlement
→ terjadwal
→ selesai/rating
```

Bursa:

```text
posting kasus open
→ konsultan claim
→ bursa closed
→ konsultasi langsung terjadwal
```

Flow bursa melewati persetujuan dan pembayaran. Kebijakan bisnis perlu diputuskan: bursa gratis atau berbayar.

## 6.2 Masalah status tercampur

Status saat ini:

```text
pending
menunggu_pembayaran
terjadwal
selesai
dibatalkan
ditolak
kedaluwarsa
pembayaran_gagal
```

Status bisnis, payment, dan reservation bercampur. Pisahkan tiga state machine.

## 6.3 Consultation state

```text
draft
  → submitted

submitted
  → accepted
  → rejected
  → cancelled

accepted
  → awaiting_payment
  → scheduled          jika gratis

awaiting_payment
  → scheduled          setelah paid
  → cancelled

scheduled
  → in_progress
  → cancellation_requested
  → no_show_client
  → no_show_consultant

in_progress
  → completed

completed
  → disputed
  → closed
```

Terminal:

```text
rejected
cancelled
no_show_client
no_show_consultant
closed
```

## 6.4 Reservation state

```text
held
  → confirmed
  → expired
  → released
```

Field:

```text
start_at
end_at
held_until
schedule_window_id
status
```

Payment pending memakai `held`. Settlement mengubah ke `confirmed`. Scheduler melepas hold kedaluwarsa.

## 6.5 Bursa state

```text
open
  → claimed
  → expired
  → cancelled

claimed
  → converted_to_consultation
  → released
```

Claim tidak langsung berarti konsultasi terjadwal. Hasil claim mengikuti model bisnis pembayaran.

## 6.6 Race condition claim bursa

Flow sekarang:

```text
GET open
→ UPDATE closed
→ INSERT consultation
→ rollback manual bila gagal
```

Dua konsultan dapat claim kasus sama.

### Target atomic transaction

```sql
update bursa_kasus
set
  status_bursa = 'claimed',
  claimed_by = :consultant_id,
  claimed_at = now()
where id_bursa = :case_id
  and status_bursa = 'open'
returning *;
```

Lanjut hanya jika satu row berubah.

Constraint:

```sql
create unique index one_consultation_per_case
on pengajuan_konsultasi(id_bursa)
where id_bursa is not null;
```

## 6.7 Double booking

Masalah:

```text
cek konflik
→ insert pengajuan
```

Dua request paralel dapat lolos. Konflik juga tidak konsisten menghitung status `pending` dan `menunggu_pembayaran`.

### Target

Semua flow booking memakai reservation transaction yang sama.

PostgreSQL range/exclusion constraint:

```sql
exclude using gist (
  id_konsultan with =,
  consultation_range with &&
)
where (reservation_status in ('held', 'confirmed'));
```

Alternatif lebih sederhana: slot eksplisit 30 menit dengan unique key.

## 6.8 Availability model

Satu availability window sekarang dapat menghasilkan beberapa slot, tetapi satu booking dapat menonaktifkan seluruh window.

Model disarankan:

```text
Availability window:
  09:00–12:00

Reservations:
  09:00–09:30
  10:00–10:30

Available slots:
  availability window minus active reservations
```

Jangan toggle window karena satu booking.

## 6.9 Validasi waktu

Aturan tunggal:

```text
start_at < end_at
start_at > now
durasi kelipatan 30 menit
durasi maksimum ditentukan
slot berada di availability window
timezone eksplisit Asia/Jakarta
tidak overlap reservation held/confirmed
```

Gunakan `timestamptz` di DB. Hindari perbandingan string waktu.

## 6.10 Complete dan rating

Sesi tidak boleh selesai sebelum waktunya.

```text
complete:
  hanya setelah end_at + grace period

rating:
  hanya consultation completed
```

Rating bukan mekanisme menyelesaikan sesi.

---

# 7. Refinement Pembayaran

## 7.1 Payment state

```text
created
  → pending
  → paid
  → failed
  → expired
  → cancelled

paid
  → refund_pending
  → partially_refunded
  → refunded
  → disputed
```

Satu konsultasi dapat memiliki beberapa payment attempt. Hanya satu attempt boleh aktif.

## 7.2 Update payment dan consultation harus atomic

Flow sekarang dapat menghasilkan:

- payment `settlement`, consultation masih awaiting payment;
- consultation scheduled, payment belum tersimpan;
- webhook retry mengulang sebagian side effect.

Target transaction:

```text
record webhook event
→ validate transition
→ update payment attempt
→ update reservation
→ update consultation
→ insert outbox notification
→ commit
```

## 7.3 Late settlement

Kasus:

```text
client cancel
→ settlement datang terlambat
→ konsultasi hidup kembali
```

Aturan:

```text
settlement valid hanya jika:
- consultation = awaiting_payment
- reservation = held
- held_until belum lewat
```

Jika payment tetap paid setelah cancel:

```text
payment = paid
consultation tetap cancelled
exception = refund_required
```

## 7.4 Refund sesudah settlement

Settlement bukan terminal lifecycle. Sistem tetap harus menerima:

```text
refund
partial refund
chargeback
dispute
```

Jangan mengabaikan event hanya karena status sebelumnya `settlement`.

## 7.5 Idempotency

Client mengirim:

```text
Idempotency-Key: UUID
```

Constraint:

```text
unique transaksi.order_id
unique provider event ID
satu active payment attempt per consultation
```

Gunakan UUID untuk `order_id`, bukan timestamp detik.

Flow aman:

```text
create local payment attempt
→ commit
→ call Midtrans
→ attach provider response
→ recover melalui reconciliation bila response hilang
```

## 7.6 Status payable

`cancelled` harus terminal dan tidak payable.

```text
payment failed:
  consultation tetap awaiting_payment selama reservation valid

payment expired:
  reservation dilepas
  consultation kembali accepted atau cancelled sesuai policy

cancelled:
  tidak dapat dibayar ulang
```

## 7.7 Kebijakan pembatalan dan refund

Contoh kebijakan:

```text
>24 jam sebelum sesi:
  full refund

6–24 jam:
  partial refund atau credit

<6 jam:
  no refund, kecuali kondisi khusus

konsultan membatalkan:
  full refund

payment sukses tetapi slot gagal:
  automatic refund
```

Aturan harus diterapkan backend, bukan hanya teks frontend.

## 7.8 Reconciliation

Job berkala membandingkan:

- payment pending lokal dengan status Midtrans;
- provider payment yang tidak memiliki local record;
- consultation scheduled tanpa payment paid;
- payment paid tanpa consultation/reservation valid;
- refund pending terlalu lama.

---

# 8. Refinement Dokumen

## 8.1 Document state

```text
uploading
ready
quarantined
rejected
deleting
deleted
```

Metadata:

```text
id
consultation_id
object_path
original_filename
detected_mime
size
sha256
uploaded_by
uploaded_at
scan_status
version
deleted_at
```

## 8.2 Mutation policy

```text
draft/submitted:
  client boleh upload/delete

accepted/scheduled:
  append-only; dokumen lama tidak hilang

completed/disputed:
  read-only; lampiran sengketa memakai kategori terpisah
```

## 8.3 Storage/DB consistency

Upload sekarang berpotensi:

```text
storage sukses
→ metadata DB gagal
→ orphan file
```

Delete berpotensi:

```text
storage delete gagal
→ row DB hilang
→ orphan file tanpa referensi
```

Target:

- object key stabil/idempotent;
- row status `uploading`;
- finalize menjadi `ready`;
- tombstone saat delete;
- retry deletion;
- cleanup orphan job;
- audit setiap mutation.

## 8.4 Access policy

Akses dokumen hanya untuk:

- client pemilik;
- konsultan yang terkait konsultasi;
- admin berizin dengan audit;
- worker scan terbatas.

Signed URL harus pendek dan tidak dicatat utuh pada log.

---

# 9. Refinement Notifikasi dan Reminder

## 9.1 Masalah saat ini

Email dikirim sinkron setelah perubahan data. Jika gagal, error dilog dan notifikasi hilang. Retry request dapat mengirim email ganda.

## 9.2 Transactional outbox

```text
notification_outbox
- id
- event_type
- aggregate_type
- aggregate_id
- recipient_id
- channel
- payload
- idempotency_key
- status
- attempt_count
- next_attempt_at
- last_error
- created_at
- sent_at
```

Flow:

```text
business transaction
→ insert domain change
→ insert outbox event
→ commit
→ worker mengirim
→ retry dengan backoff
```

Idempotency key:

```text
consultation_accepted:{consultation_id}
payment_paid:{payment_id}
session_reminder_24h:{consultation_id}
```

## 9.3 Event notifikasi

- pengajuan diterima;
- pengajuan ditolak;
- pembayaran menunggu;
- pembayaran berhasil/gagal/expired;
- jadwal berubah;
- reminder H-24;
- reminder H-1;
- pembatalan;
- refund;
- verifikasi submitted/approved/rejected;
- dokumen perlu revisi;
- dispute update.

## 9.4 Scheduler

```text
Setiap 5 menit:
- expire reservation/payment hold
- reconcile payment pending
- proses notification outbox

Setiap jam:
- reminder H-24/H-1
- close case lampau
- detect session completion

Harian:
- retry dead-letter sesuai policy
- cleanup orphan upload
- retention cleanup
- stale onboarding reminder
```

Job harus atomic, idempotent, memakai lease/advisory lock, dan aman untuk multi-instance.

## 9.5 Notification preference

User dapat memilih channel:

```text
email
in-app
WhatsApp/SMS bila ditambahkan kelak
```

Notifikasi keamanan dan transaksi penting tidak boleh seluruhnya dimatikan.

---

# 10. Rating, Penyelesaian Sesi, dan Sengketa

## 10.1 Rating

Constraint:

```sql
unique (id_pengajuan)
```

Flow:

```text
consultation completed
→ client dapat memberikan rating
→ rating tidak mengubah status consultation
```

Jangan memakai pola `SELECT existing → INSERT` tanpa unique constraint.

## 10.2 Completion

Field yang berguna:

```text
client_confirmed_at
consultant_confirmed_at
auto_completed_at
no_show_reason
```

Pilihan policy:

- auto-complete setelah `end_at + grace period`;
- client dan konsultan dapat melaporkan no-show;
- dispute window tersedia setelah completion.

## 10.3 Dispute

```text
completed
→ disputed
→ resolved_client
→ resolved_consultant
→ resolved_refund
→ closed
```

Simpan reason, evidence reference, admin actor, keputusan, dan audit event.

---

# 11. Audit Trail

Log aplikasi bukan audit trail. Tambahkan append-only event table:

```text
domain_events
- id
- aggregate_type
- aggregate_id
- event_type
- from_state
- to_state
- actor_type
- actor_id
- source
- reason
- idempotency_key
- request_id
- metadata
- created_at
```

Event wajib:

```text
consultation_submitted
consultation_accepted
consultation_rejected
consultation_cancelled
schedule_assigned
case_claimed
payment_created
payment_paid
refund_requested
refund_completed
document_uploaded
document_deleted
verification_submitted
verification_approved
verification_rejected
consultant_suspended
```

Jangan menyimpan isi dokumen atau PII berlebihan dalam metadata event.

Admin UI idealnya menampilkan timeline gabungan:

```text
status
payment
reservation
document
notification
verification
audit actor
```

---

# 12. Deployment, Database, dan Testing

## 12.1 Version-control Supabase

Tambahkan:

```text
supabase/
├── config.toml
├── migrations/
└── seed.sql
```

Version-control:

- tables;
- enums/check constraints;
- indexes;
- FK/cascade;
- RLS;
- storage policies;
- RPC;
- views;
- extensions;
- trigger;
- seed minimal tanpa secret.

## 12.2 Deployment source of truth

Target yang disarankan:

```text
Frontend: Vercel
Backend: Railway menggunakan root Dockerfile
Database: Supabase migrations
```

Selaraskan CD agar mencari Dockerfile aktual. Hapus atau dokumentasikan config deployment alternatif yang tidak dipakai.

## 12.3 Test strategy

### Unit/service tests

- state transition;
- schedule validation;
- slug normalization;
- eligibility konsultan;
- payment mapping;
- redaction PII;
- notification idempotency.

### Repository/contract tests

- PostgREST relation names;
- RPC signatures;
- RLS cross-tenant;
- storage policy;
- migration apply/rollback.

### Integration tests

- atomic claim;
- double booking;
- webhook retry;
- late settlement;
- refund after settlement;
- private signed document access;
- slug history redirect.

### End-to-end

Pertahankan QA Playwright untuk critical journey:

```text
signup → verification → onboarding
consultant approval
booking → payment → scheduled
cancel → refund
reminder → session → complete → rating
legacy URL → canonical URL
```

## 12.4 CI gate minimum

```text
Ruff
backend unit tests
migration validation
frontend lint/build
critical QA regression
secret scan
pip-audit
npm audit sesuai severity policy
```

---

# 13. Prioritas Backlog

## 13.1 P0 — Segera

| No. | Backlog | Alasan |
|---:|---|---|
| 1 | Rotasi seluruh secret | Credential production terekspos |
| 2 | Audit log provider dan sesi | Deteksi penyalahgunaan |
| 3 | Private bucket dokumen perkara | Mencegah kebocoran bukti hukum |
| 4 | Hapus refresh token dari `localStorage` | Mencegah session theft jangka panjang |
| 5 | Distributed auth rate limit | Mencegah brute force/OTP abuse |
| 6 | Exact CORS allowlist | Membatasi preview origin |
| 7 | Commit schema/migration Supabase | Reproducibility dan audit |
| 8 | Atomic claim bursa | Mencegah claim ganda |
| 9 | Atomic reserve slot | Mencegah double booking |
| 10 | Atomic/idempotent payment webhook | Mencegah state korup |
| 11 | Perbaiki refund setelah settlement | Menjaga lifecycle dana |
| 12 | Hilangkan cancelled dari payable status | Mencegah konsultasi batal hidup kembali |

## 13.2 P1 — Sprint berikut

| No. | Backlog |
|---:|---|
| 1 | RLS dan user-scoped Supabase client |
| 2 | CSRF protection |
| 3 | Redaksi PII sebelum AI |
| 4 | Sanitized structured logging |
| 5 | Global exception handler |
| 6 | Signed URL privat |
| 7 | Pisahkan consultation/reservation/payment state |
| 8 | Transactional outbox |
| 9 | Scheduler reminder/reconciliation |
| 10 | Lifecycle onboarding/verifikasi konsultan |
| 11 | Batasi role transition |
| 12 | Append-only audit trail |
| 13 | Unique/overlap constraints database |
| 14 | Upload byte validation dan malware scan |

## 13.3 P2 — Stabilitas dan UX

| No. | Backlog |
|---:|---|
| 1 | Slug/public ID backward-compatible |
| 2 | Slug history dan canonical redirect |
| 3 | Normalisasi dokumen bursa |
| 4 | Normalisasi sumber foto profil |
| 5 | CSP dan security headers |
| 6 | Document versioning |
| 7 | Notification center in-app |
| 8 | No-show dan dispute flow |
| 9 | Retention/account deletion workflow |
| 10 | Rapikan frontend service boundary |
| 11 | Hapus dead endpoint/client method |
| 12 | Pin dependency dan SBOM |

---

# 14. Roadmap Implementasi

## Fase 0 — Incident response

```text
1. Rotasi secret.
2. Audit provider.
3. Pastikan .env tidak masuk repository/artefak.
4. Tambahkan secret scanning.
```

## Fase 1 — Fondasi data dan keamanan

```text
1. Export schema Supabase.
2. Commit migrations, RLS, RPC, storage policy.
3. Pindahkan dokumen ke private bucket.
4. Redesign token transport.
5. Perketat CORS/CSRF/rate limit/logging.
```

## Fase 2 — Integritas transaksi

```text
1. Atomic claim.
2. Atomic reservation.
3. Payment idempotency.
4. Conditional webhook transitions.
5. Refund lifecycle.
6. Database constraints.
```

## Fase 3 — Verifikasi konsultan

```text
1. Tambah onboarding_status dan verification metadata.
2. Buat profil konsultan secara eksplisit.
3. Batasi role transition.
4. Buat onboarding endpoints.
5. Buat admin review.
6. Klasifikasi legacy consultant.
7. Tambahkan popup/banner.
8. Terapkan AI eligibility.
```

## Fase 4 — URL publik

```text
1. Tambah slug/public_id nullable.
2. Backfill.
3. Tambah unique index.
4. Tambah endpoint baru.
5. Tambah canonical URL pada response.
6. Ubah link frontend.
7. Ubah link email.
8. Redirect URL lama.
9. Pantau traffic legacy.
10. Enforce NOT NULL setelah aman.
```

## Fase 5 — Reliability

```text
1. Transactional outbox.
2. Reminder jobs.
3. Payment reconciliation.
4. Audit events.
5. Document lifecycle.
6. Unit/contract tests.
7. CI gate.
```

---

# 15. Acceptance Criteria

## 15.1 Security/privacy

- [ ] Tidak ada production secret dalam repository atau artefak CI.
- [ ] Seluruh secret lama sudah dirotasi.
- [ ] Refresh token tidak dapat dibaca JavaScript.
- [ ] Dokumen konsultasi tidak memiliki public URL permanen.
- [ ] User A tidak dapat mengakses resource User B.
- [ ] Origin preview yang tidak diizinkan gagal pada CORS.
- [ ] Endpoint auth memiliki shared rate limit.
- [ ] Log tidak memuat chat mentah, token, signature, atau signed URL.
- [ ] AI input sensitif melalui redaction/minimization.
- [ ] Account deletion dan retention policy terdokumentasi.

## 15.2 URL slug

- [ ] Integer PK/FK tetap dipakai internal.
- [ ] Setiap konsultan memiliki unique current slug.
- [ ] Konsultasi/kasus memiliki opaque public ID.
- [ ] Collision slug aman pada request paralel.
- [ ] Rename menyimpan slug history.
- [ ] Slug lama redirect ke canonical slug.
- [ ] URL integer lama tetap berfungsi selama masa transisi.
- [ ] Link email lama tetap valid.
- [ ] URL konsultasi tidak membocorkan nama/kategori perkara.

## 15.3 Verifikasi konsultan

- [ ] Konsultan baru dibuat sebagai pending dan inactive.
- [ ] Role selection tidak otomatis memberi akses konsultan penuh.
- [ ] Onboarding dapat disimpan sebagai draft.
- [ ] Submit verification menghasilkan audit event.
- [ ] Admin dapat approve/reject/request revision.
- [ ] Konsultan legacy verified tidak diminta verifikasi ulang.
- [ ] Konsultan non-verified tidak direkomendasikan AI.
- [ ] Backend menolak booking terhadap konsultan non-eligible.
- [ ] Popup dapat ditunda, banner status tetap terlihat.

## 15.4 Jadwal dan pembayaran

- [ ] Dua request paralel tidak dapat memesan slot sama.
- [ ] Dua konsultan tidak dapat claim kasus sama.
- [ ] Webhook retry tidak menggandakan efek.
- [ ] Late settlement tidak menghidupkan konsultasi cancelled.
- [ ] Refund setelah settlement diproses.
- [ ] Hanya satu active payment attempt per consultation.
- [ ] Reservation expired dilepas otomatis.
- [ ] Payment dan consultation state tidak dapat drift tanpa terdeteksi.

## 15.5 Notifikasi dan dokumen

- [ ] Notifikasi gagal dapat di-retry.
- [ ] Event yang sama tidak mengirim notifikasi ganda.
- [ ] Reminder H-24 dan H-1 idempotent.
- [ ] Upload orphan dibersihkan.
- [ ] Dokumen memiliki MIME hasil deteksi dan hash.
- [ ] Delete dokumen menyimpan audit trail.

---

# 16. Kesimpulan

Codebase tidak memerlukan rombak framework besar. Struktur backend sudah cukup untuk dikembangkan sebagai modular monolith. Perubahan utama harus berfokus pada keamanan, integritas database, state machine, transaction boundary, dan operasional.

Keputusan arsitektur yang disarankan:

1. Pertahankan primary key dan foreign key internal.
2. Tambahkan slug konsultan dan opaque public ID untuk resource sensitif.
3. Pertahankan endpoint lama dan gunakan canonical redirect.
4. Jadikan verifikasi konsultan lifecycle eksplisit.
5. Tandai konsultan lama dengan `verification_source = legacy` tanpa verifikasi ulang.
6. Gunakan filter keras untuk AI recommendation.
7. Pisahkan consultation, reservation, dan payment state.
8. Pindahkan claim, reservation, dan payment update ke transaction/RPC database.
9. Jadikan dokumen private dan akses melalui signed URL.
10. Gunakan transactional outbox, scheduler idempotent, dan append-only audit trail.
11. Version-control seluruh schema Supabase.
12. Tambahkan unit, contract, migration, dan cross-tenant tests ke CI.

Risiko yang harus ditangani paling dahulu:

> **Secret exposure, public legal documents, refresh token dalam browser storage, schema Supabase tak terversi, double booking, claim race, dan payment state inconsistency.**
