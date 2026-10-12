# 02 — Database Schema and API Surface

> **Note (2026-10-12):** This review describes the backend before the layered refactor. The logic has since moved out of `backend/routers/*.py` into `backend/services/`, `backend/repositories/`, `backend/helpers/`, `backend/core/` and `backend/docs/`, so the file and line links below point to the old locations. Findings still open should be re-located by function name.

## Important caveat on the schema section

**There are no migration files, no ORM model classes, and no SQL DDL committed anywhere in this repository.** The database is a hosted Supabase (Postgres) project, accessed exclusively through the PostgREST-based `supabase-py` client (`db.table("...").select("...")`). The table/column list below was reconstructed by reading every `.table(...)`, `.select(...)`, `.insert(...)`, and `.update(...)` call across `backend/routers/*.py`, `backend/rag_service.py`, and `backend/services/*.py`, plus the Pydantic response schemas in `backend/schemas/*.py`.

This means:
- **Column types are inferred**, not read from a schema — marked "inferred" below. Actual Postgres types (e.g. `varchar` vs `text`, `numeric` vs `int4`, nullability, defaults) are **unclear from codebase** and should be confirmed against the live Supabase project (Table Editor or `pg_dump`).
- **Constraints (foreign keys, unique, check) are inferred from query patterns** (e.g. `.eq("id_user", ...)` joins), not from an actual constraint definition. Whether they're enforced at the DB level or only assumed by application code is **unclear from codebase**.
- **Indexes cannot be assessed at all** from this repo — see `03-technical-debt.md` for the database-concerns section, which treats index coverage as a known gap rather than guessing.
- Two Postgres **views** (`dokumen_hukum_summary`, `admin_transaction_stats`) and two Postgres **RPC functions** (`match_dokumen_hukum`, `search_consultants_by_category`) are called from the backend but their definitions live only in Supabase, not in this repo.

## 1. Table inventory

### `users`
Core identity table, linked 1:1 to Supabase Auth via `auth_user_id`.

| Column | Inferred type | Notes |
|---|---|---|
| `id_user` | int, PK | Referenced as FK from nearly every other table |
| `auth_user_id` | uuid/text | Supabase Auth user id; self-healed by email lookup if out of sync ([dependencies.py:112-130](../../backend/dependencies.py#L112-L130), [auth.py:431-446](../../backend/routers/auth.py#L431-L446)) |
| `email` | text | |
| `nama` | text | |
| `role` | text (`client` \| `konsultan` \| `admin`) | No DB-level enum confirmed — role string is compared with plain `==` everywhere in app code |
| `foto_profil` | text (URL) | **Duplicated** — see `konsultan.foto_profil` below and the mismatch note in §4 |
| `created_at` | timestamp | Selected in [admin.py:175](../../backend/routers/admin.py#L175) |

### `konsultan`
Professional profile for users with `role = "konsultan"`.

| Column | Inferred type | Notes |
|---|---|---|
| `id_konsultan` | int, PK | |
| `id_user` | int, FK → `users.id_user` | |
| `nama_lengkap` | text | |
| `spesialisasi` | text | Free text, filtered with `ilike` (not a fixed enum at query time, though `rag_service.py`'s tool schema constrains the chatbot's search to a 6-value enum — see `04-chatbot-integration.md`) |
| `is_active` | bool | Publicly-visible toggle ([consultants.py:511-527](../../backend/routers/consultants.py#L511-L527)) |
| `status_verifikasi` | text (`pending` \| `terverifikasi` \| `ditolak`) | Admin-controlled ([admin.py:211-271](../../backend/routers/admin.py#L211-L271)) |
| `tarif_per_sesi` | numeric | Session rate, used directly in payment `gross_amount` calc |
| `bio_singkat`, `deskripsi_lengkap` | text | |
| `nomor_izin_praktik`, `gelar_akademik`, `pendidikan_terakhir` | text | |
| `kota_praktik` | text | |
| `pengalaman_tahun` | int | |
| `linkedin` | text | |
| `portofolio` | text (URL to PDF) | |
| `foto_profil` | text (URL) | **Appears to duplicate `users.foto_profil`** — read directly off `konsultan` in [consultations.py:265-266,270,312,314](../../backend/routers/consultations.py#L265-L314), but profile updates only ever write `users.foto_profil` ([users.py:125-129](../../backend/routers/users.py#L125-L129)). See mismatch in §4. |
| `alasan_penolakan` | text, nullable | Rejection reason, cleared on approval ([admin.py:252-256](../../backend/routers/admin.py#L252-L256)) |
| `created_at`, `updated_at` | timestamp | |

### `jadwal_ketersediaan`
Consultant availability slots.

| Column | Inferred type | Notes |
|---|---|---|
| `id_jadwal` | int, PK | |
| `id_konsultan` | int, FK → `konsultan.id_konsultan` | |
| `tanggal` | date | |
| `jam_mulai`, `jam_selesai` | time (stored/compared as string, e.g. `"09:00"`) | See input-validation risk in `03-technical-debt.md` — comparisons are done as plain string comparison, not real time parsing, in several places (e.g. [cases.py:210](../../backend/routers/cases.py#L210), [consultations.py:493](../../backend/routers/consultations.py#L493)) |
| `status_tersedia` | bool | `true` = bookable |

### `pengajuan_konsultasi`
The central consultation-request entity; rows are created either from a direct booking (`consultations.py: buat_pengajuan_konsultasi`) or from a claimed bursa case (`cases.py: klaim_kasus`).

| Column | Inferred type | Notes |
|---|---|---|
| `id_pengajuan` | int, PK | |
| `id_user` | int, FK → `users.id_user` (client) | |
| `id_konsultan` | int, FK → `konsultan.id_konsultan` | |
| `id_jadwal` | int, FK → `jadwal_ketersediaan.id_jadwal`, **nullable** | Null when the request originated from a bursa claim (no slot picked up front) |
| `id_bursa` | int, FK → `bursa_kasus.id_bursa`, **nullable** | Null for direct bookings |
| `deskripsi_kasus` | text | |
| `status_pengajuan` | text, **no enforced enum** | Observed values across the codebase: `pending`, `menunggu_pembayaran`, `terjadwal`, `selesai`, `dibatalkan`, `ditolak`, `kedaluwarsa`, `pembayaran_gagal`, `cancel`/`cancelled` (inconsistent Indonesian/English mix — see `03-technical-debt.md`) |
| `tanggal_pengajuan` | date | |
| `jam_mulai`, `jam_selesai` | time-as-string | |
| `link_zoom` | text, nullable | |
| `link_dokumen` | text, nullable | Referenced at [consultations.py:385](../../backend/routers/consultations.py#L385) but no writer for this field was found in the reviewed routers — **unclear from codebase** how it gets populated (possibly set directly in Supabase or a removed endpoint) |
| `created_at`, `updated_at` | timestamp | |

### `dokumen_pendukung`
Supporting documents attached to a `pengajuan_konsultasi`.

| Column | Inferred type | Notes |
|---|---|---|
| `id_dokumen` | int, PK | |
| `id_pengajuan` | int, FK → `pengajuan_konsultasi.id_pengajuan` | |
| `nama_dokumen` | text | Original filename, unsanitized ([services/__init__.py:216](../../backend/services/__init__.py#L216)) |
| `file_url` | text | Public Supabase Storage URL |
| `tipe_file` | text (`pdf` \| `image`) | |
| `ukuran_kb` | int | |
| `created_at`, `updated_at` | timestamp | |

### `bursa_kasus`
Anonymous case marketplace ("Bursa Kasus").

| Column | Inferred type | Notes |
|---|---|---|
| `id_bursa` | int, PK | |
| `id_user` | int, FK → `users.id_user` | |
| `kategori_hukum` | text | Lowercased/stripped before insert ([cases.py:55](../../backend/routers/cases.py#L55)) |
| `deskripsi_kasus_awam` | text | |
| `dokumen_bukti` | text | **Comma-separated list of URLs stored as a single text field** rather than a proper child table — see `03-technical-debt.md` |
| `tanggal_konsultasi` | date | |
| `jam_mulai`, `jam_selesai` | time-as-string | |
| `status_bursa` | text (`open` \| `closed`) | |

### `transaksi`
Payment transactions (Midtrans).

| Column | Inferred type | Notes |
|---|---|---|
| `id_transaksi` | int, PK | From `schemas/payments.py: PaymentStatusResponse` |
| `id_pengajuan` | int, FK → `pengajuan_konsultasi.id_pengajuan` | One-to-many: a single `id_pengajuan` can have multiple `transaksi` rows over time (retries) |
| `order_id` | text, unique (assumed) | Format `LL-{id_pengajuan}-{unix_ts}` ([payments.py:163](../../backend/routers/payments.py#L163)) |
| `gross_amount` | numeric | |
| `nominal_konsultan` | numeric | 90% of gross (10% platform commission hardcoded, [payments.py:160-161](../../backend/routers/payments.py#L160-L161)) |
| `komisi_platform` | numeric | 10% of gross |
| `status_pembayaran` | text (`pending`, `settlement`, `cancel`, `expire`, `refund`, `deny`) | |
| `metode_pembayaran` | text, nullable | |
| `snap_token`, `snap_redirect_url` | text | |
| `waktu_bayar` | timestamp, nullable | |
| `created_at`, `updated_at` | timestamp | |

### `rating_ulasan`
Post-consultation ratings.

| Column | Inferred type | Notes |
|---|---|---|
| `id_rating` | int, PK | |
| `id_pengajuan` | int, FK → `pengajuan_konsultasi.id_pengajuan` | App code checks for an existing rating per `id_pengajuan` before insert ([consultations.py:916-918](../../backend/routers/consultations.py#L916-L918)) but this is **not enforced by a DB unique constraint that this review could confirm** — a race condition (two rapid submits) could produce duplicates |
| `id_konsultan` | int, FK → `konsultan.id_konsultan` | Denormalized for read convenience |
| `skor_rating` | int, 1–5 (enforced only at the Pydantic layer, [schemas/consultations.py:21-22](../../backend/schemas/consultations.py#L21-L22)) | |
| `ulasan_teks` | text, nullable | |
| `created_at` | timestamp | |

### `chat_sessions`
Chatbot conversation sessions.

| Column | Inferred type | Notes |
|---|---|---|
| `id` | text/uuid, PK | |
| `user_id` | int, FK → `users.id_user` | |
| `title` | text | Default `"Sesi Konsultasi Baru"`, auto-renamed by Gemini after first message ([chatbot.py:88-114](../../backend/routers/chatbot.py#L88-L114)) |
| `created_at`, `updated_at` | timestamp | |

### `chat_messages`
Individual chat turns.

| Column | Inferred type | Notes |
|---|---|---|
| `id` | text/uuid, PK | |
| `session_id` | text/uuid, FK → `chat_sessions.id` | No `ON DELETE CASCADE` confirmed in this repo — `delete_session` in `chatbot.py` deletes only the `chat_sessions` row and relies on the DB cascading to `chat_messages` ([chatbot.py:208](../../backend/routers/chatbot.py#L208)); the router's own docstring calls this "cascade delete" ([chatbot.py:193](../../backend/routers/chatbot.py#L193)) but **whether a cascade FK actually exists is unclear from codebase** — if not, this is an orphaned-row bug |
| `role` | text (`user` \| `ai`) | |
| `content` | text | Full chatbot answer text — see PII/retention discussion in `04-chatbot-integration.md` |
| `metadata` | jsonb, nullable | Stores `{type, pasal_referensi, disclaimer, consultants?}` |
| `created_at` | timestamp | |

### `dokumen_hukum`
RAG knowledge base — one row per legal-article ("pasal") chunk, with a vector embedding.

| Column | Inferred type | Notes |
|---|---|---|
| `id_dokumen` | int, PK | |
| `frbr_uri` | text | Groups chunks belonging to the same law/document |
| `node_id` | text | Pasal number, e.g. `"5"`, `"5A"` |
| `node_type` | text (`pasal` \| `chunk`) | |
| `kategori` | text, enum-constrained at the Pydantic layer (`schemas/admin_docs.py: KategoriHukum`, 18 values) — **DB-level enum not confirmed** | |
| `nama_uu`, `nomor_uu`, `tahun_uu`, `status_hukum`, `sumber_undang_undang` | text/int | |
| `pasal_bagian` | text | e.g. `"Pasal 5"` |
| `judul_bab` | text, nullable | |
| `isi_teks` | text | Full chunk content, min length 10 chars enforced at Pydantic layer for edits |
| `embedding` | vector(1024) (pgvector, inferred from `EMBEDDING_DIM = 1024` and the `match_dokumen_hukum` RPC call) | **This assumes the `pgvector` extension is enabled on the Supabase project — unclear from codebase, cannot be confirmed without DB access** |
| `created_at`, `updated_at` | timestamp | |

### Views / RPCs (not tables, defined only in Supabase — **not in this repo**)

| Name | Kind | Used by | Purpose (inferred from usage) |
|---|---|---|---|
| `dokumen_hukum_summary` | View | [admin_docs.py:249](../../backend/routers/admin_docs.py#L249) | Pre-aggregated `dokumen_hukum` grouped by `frbr_uri` with a `total_chunks` count, for the admin document list page |
| `admin_transaction_stats` | View | [admin.py:74](../../backend/routers/admin.py#L74) | Pre-aggregated transaction totals; code has a fallback full-table-scan if this view is missing/empty ([admin.py:82-94](../../backend/routers/admin.py#L82-L94)) |
| `match_dokumen_hukum(query_embedding, match_threshold, match_count, filter_kategori?)` | RPC function | [rag_service.py:217](../../backend/rag_service.py#L217) | Vector similarity search over `dokumen_hukum.embedding` |
| `search_consultants_by_category(p_spesialisasi, p_max_budget?)` | RPC function | [rag_service.py:269](../../backend/rag_service.py#L269) | Returns consultants matching a category/budget for the chatbot's `search_consultants` tool |

**Recommendation**: ask the previous team for a `pg_dump --schema-only` or export the Supabase migration history (Database → Migrations in the dashboard, or `supabase db diff`) and commit it to this repo. Without it, every claim about constraints, indexes, and the views/RPC bodies above is unverifiable from source control alone.

## 2. Tables that look unused or under-used

- No table in the reconstructed list appears completely unreferenced — all 12 base tables have at least one read and one write path in the code.
- `pengajuan_konsultasi.link_dokumen` (a column, not a table) has a reader but no confirmed writer in the backend — see note above.
- `dokumen_pendukung` duplicates the file-list functionality that `bursa_kasus.dokumen_bukti` implements as a comma-separated string on the same conceptual entity (supporting documents for a case/consultation) — two different storage patterns for the same kind of data across two tables. See `03-technical-debt.md`.

## 3. API endpoint inventory

All paths below are relative to `/api/v1` (mounted in [main.py:75-83](../../backend/main.py#L75-L83)). "Auth" = the `get_current_user` dependency; "Role" = additional in-handler role check.

### Auth (`/auth`, [routers/auth.py](../../backend/routers/auth.py)) — no `get_current_user` on any of these; several proxy directly to Supabase Auth's REST API

| Method | Path | Auth | Request | Response | Frontend caller |
|---|---|---|---|---|---|
| POST | `/auth/signup` | none | `SignUpPayload` (email, password, name, role, emailRedirectTo?) | `{data:{session, user}}` | `authService.signUpWithPassword` ([auth.service.js:12](../../frontend/src/services/auth.service.js#L12)) |
| POST | `/auth/login-otp` | none, rate-limited 3/min | `OtpLoginPayload` | `{data:{sent:true}}` | `authService.sendOtpLogin` |
| POST | `/auth/resend-signup-otp` | none, rate-limited 3/min | `ResendOtpPayload` | `{data:{sent:true}}` | `authService.resendSignupOtp` |
| POST | `/auth/verify-otp` | none | `VerifyOtpPayload` | `{data:{session, user}}` | `authService.verifyOtp` |
| POST | `/auth/login-password` | none, **not rate-limited** | `PasswordLoginPayload` | `{data:{session, user}}` | `authService.loginWithPassword` |
| POST | `/auth/oauth/google` | none | `OAuthPayload` (redirectTo) | `{data:{url, code_verifier}}` | `authService.signInWithGoogle` |
| POST | `/auth/exchange-code` | none | raw dict `{code, code_verifier?}` | `{data:{session, user}}` | `authService.exchangeCode` |
| POST | `/auth/refresh` | none (cookie or body) | optional `{refresh_token}` | `{data:{session, user}}` | `authService.refreshSession`, also called from the axios 401 interceptor ([lib/axios.js:65](../../frontend/src/lib/axios.js#L65)) |
| GET | `/auth/profile` | bearer/cookie token (not `get_current_user`, uses local `_get_auth_user`) | — | `{data: profile\|null}` | `authService.getProfile` |
| POST | `/auth/role` | bearer/cookie token | `RolePayload` | `{data: profile}` | `authService.updateRole` |
| POST | `/auth/logout` | bearer/cookie token | — | `{data:{logout:true}}` | `authService.logout` |
| POST | `/auth/forgot-password` | none, rate-limited 3/min | `ForgotPasswordPayload` | `{data:{sent:true}}` | `authService.forgotPassword` |
| POST | `/auth/reset-password` | bearer/cookie token | `ResetPasswordPayload` | `{data:{updated:true}}` | `authService.resetPassword` |

### Consultants directory (`/consultants`, [routers/consultants.py](../../backend/routers/consultants.py))

| Method | Path | Auth | Role | Response shape | Frontend caller |
|---|---|---|---|---|---|
| GET | `/consultants/` | none | — | `{message, data:[{id,name,spec,rating,reviews,status,foto_profil,...}]}` | `consultationService.getConsultantCatalog` |
| GET | `/consultants/me/schedules` | required | any | `list[{id_jadwal,...,nama_klien}]` | `consultantService.getMySchedules`, `scheduleService.getMySchedules` (called from two service files) |
| GET | `/consultants/me/dashboard-stats` | required | `konsultan` | `{total_income, total_klien, total_klien_aktif}` | `consultantService.getDashboardStats` |
| GET | `/consultants/me/requests/pending` | required | `konsultan` | `list[pengajuan]` | `consultantService.getPendingRequests` |
| GET | `/consultants/me/requests/active` | required | `konsultan` | `list[pengajuan]` | `consultantService.getActiveRequests` |
| GET | `/consultants/{id_konsultan}` | none | — | `{message, data: profile+jadwal_ketersediaan}` | `consultantService.getConsultantDetail` |
| GET | `/consultants/{id_konsultan}/schedules` | none | — | `{status, id_konsultan, data:[slots]}` | `consultantService.getConsultantSchedules` |
| POST | `/consultants/schedules` | required | `konsultan` | `{message, data}` | `scheduleService.addSchedule` |
| DELETE | `/consultants/schedules/{id_jadwal}` | required | `konsultan` | `{message}` | `scheduleService.deleteSchedule` |
| PUT | `/consultants/schedules/{id_jadwal}` | required | `konsultan` | `{message, data}` | `scheduleService.updateSchedule` |
| PATCH | `/consultants/schedules/{id_jadwal}/toggle` | **none — no `get_current_user` dependency at all** | — | raw Supabase response | `scheduleService.toggleScheduleSlot` — **see high-severity auth finding in `03-technical-debt.md`** |
| PATCH | `/consultants/me/active-status` | required | **no role check** | raw Supabase response | `scheduleService.toggleGlobalActive` |
| GET | `/consultants/me/clients` | required | `konsultan` | `{total_klien_aktif, data}` | `consultantService.getClientList` |
| GET | `/consultants/me/history` | required | `konsultan` | `{total_sesi_selesai, data}` | `consultantService.getHistory` |

### Bursa Kasus (`/cases`, [routers/cases.py](../../backend/routers/cases.py))

| Method | Path | Auth | Role | Frontend caller |
|---|---|---|---|---|
| POST | `/cases/` | required | `client` | `caseService.createCase` |
| GET | `/cases/` | required | `konsultan` | `caseService.listOpenCases` |
| POST | `/cases/{id_bursa}/claim` | required | `konsultan` | `caseService.claimCase` |

### Consultations (`/consultations`, [routers/consultations.py](../../backend/routers/consultations.py))

| Method | Path | Auth | Role | Frontend caller |
|---|---|---|---|---|
| POST | `/consultations/` | required | `client` | `consultationService.createConsultation` |
| PUT | `/consultations/{id_pengajuan}/status` | required | `client` (only `dibatalkan`) or `konsultan` (any value — no server-side enum check, see `03-technical-debt.md`) | `consultationService.updateStatus` |
| GET | `/consultations/` | required | any (filtered by role) | `consultationService.getConsultations` |
| GET | `/consultations/{id_pengajuan}` | required | client (own) / konsultan (own) | `consultationService.getConsultationDetail` |
| PUT | `/consultations/{id_pengajuan}/assign-schedule` | required | `konsultan` | `consultationService.assignSchedule` |
| PUT | `/consultations/{id_pengajuan}/zoom-link` | required | `konsultan` | `consultationService.updateZoomLink` |
| PUT | `/consultations/{id_pengajuan}/complete` | required | `client` | `consultationService.markConsultationComplete` |
| GET | `/consultations/{id_konsultan}/booked-slots` | none | — | `consultationService.getBookedSlots` |
| GET | `/consultations/{id_pengajuan}/documents` | required | client/konsultan (own) | `consultationService.getDocuments` |
| POST | `/consultations/{id_pengajuan}/documents` | required | `client` (own) | `consultationService.uploadDocuments` |
| DELETE | `/consultations/{id_pengajuan}/documents/{id_dokumen}` | required | `client` (own) | `consultationService.deleteDocument` |
| POST | `/consultations/{id_pengajuan}/rating` | required | `client` (own) | `consultationService.submitRating` |

**Mismatch**: `consultationService.respondToConsultation` ([consultation.service.js:52-57](../../frontend/src/services/consultation.service.js#L52-L57)) calls `PUT /consultations/{id}/respond` — **this route does not exist in `routers/consultations.py`**. Calling it would currently return 404/405. Grep of `frontend/src` found **no component that calls `respondToConsultation`**, so this appears to be dead frontend code rather than an active broken feature, but it should be either wired up or deleted. The matching `ConsultationRespond` Pydantic schema is imported into the router but never used (see `01-architecture.md` §6), reinforcing that this was a removed/renamed endpoint (superseded by `PUT /{id}/status`).

### Payments (`/payments`, [routers/payments.py](../../backend/routers/payments.py))

| Method | Path | Auth | Role | Frontend caller |
|---|---|---|---|---|
| POST | `/payments/create-transaction` | required | `client` | `paymentService.createTransaction` |
| POST | `/payments/notification` | **none by design** (Midtrans server-to-server webhook, verified via `midtransclient`'s signature check) | — | Midtrans server (not the frontend) |
| GET | `/payments/status/{id_pengajuan}` | required | client/konsultan (own) | `paymentService.getPaymentStatus` |
| POST | `/payments/sync/{id_pengajuan}` | required | `client` | `paymentService.syncPaymentStatus` |

### Users (`/users`, [routers/users.py](../../backend/routers/users.py))

| Method | Path | Auth | Frontend caller |
|---|---|---|---|
| GET | `/users/me/settings` | required | `userService.getSettings` |
| GET | `/users/me/profile/full` | required | `userService.getFullProfile` |
| PUT | `/users/me/profile/update` | required | `userService.updateProfile` |

### Admin dashboard (`/admin`, [routers/admin.py](../../backend/routers/admin.py))

| Method | Path | Auth | Role | Frontend caller |
|---|---|---|---|---|
| GET | `/admin/stats` | required | `admin` | `getAdminStats` |
| GET | `/admin/consultants` | required | `admin` | `getConsultants` |
| GET | `/admin/consultants/{id_konsultan}` | required | `admin` | `getConsultantDetail` (admin.service.js) |
| PATCH | `/admin/consultants/{id_konsultan}/verify` | required | `admin` | `verifyConsultant` |

**Mismatch**: `frontend/src/services/admin.service.js` also exports `getTransactions()` (`GET /admin/transactions`) and `getTransactionSummary()` (`GET /admin/transactions/summary`) — **neither route exists in `routers/admin.py`**. The router file has an explicit comment marking this section as removed: `"MONITORING KOMISI / TRANSAKSI (History dihapus sesuai permintaan)"` ([admin.py:275](../../backend/routers/admin.py#L275), "history removed per request"). Grep of `frontend/src` found no caller of either function, so — like `respondToConsultation` — this is unused/dead frontend code referencing a backend feature that was intentionally removed, not an active bug. Recommend deleting both functions or restoring the endpoints, whichever matches product intent.

### Admin — RAG knowledge base (`/admin/documents`, [routers/admin_docs.py](../../backend/routers/admin_docs.py))

| Method | Path | Auth | Role | Frontend caller |
|---|---|---|---|---|
| POST | `/admin/documents/upload` | required | `admin` | `uploadDocumentPdf` |
| GET | `/admin/documents/jobs/{job_id}` | required | `admin` | `getJobStatus` |
| GET | `/admin/documents/` | required | `admin` | `getAdminDocuments` |
| GET | `/admin/documents/chunks` | required | `admin` | `getDocumentChunks` |
| GET | `/admin/documents/chunks/{id_dokumen}` | required | `admin` | `getChunkDetail` |
| PATCH | `/admin/documents/chunks/{id_dokumen}` | required | `admin` | `updateChunk` |
| PUT | `/admin/documents/replace` | required | `admin` | `replaceDocumentPdf` |
| DELETE | `/admin/documents/by-uri` | required | `admin` | `deleteFullDocumentByUri` |

### Chatbot (`/chatbot`, [routers/chatbot.py](../../backend/routers/chatbot.py)) — see `04-chatbot-integration.md` for full pipeline detail

| Method | Path | Auth | Frontend caller |
|---|---|---|---|
| POST | `/chatbot/sessions` | required | `useChatStore.createSession` |
| GET | `/chatbot/sessions` | required | `useChatStore.fetchSessions` |
| DELETE | `/chatbot/sessions/{session_id}` | required | `useChatStore.deleteSession` |
| GET | `/chatbot/sessions/{session_id}/messages` | required | `useChatStore.setActiveSession` |
| POST | `/chatbot/triage` | required, rate-limited 3/min | called directly with `api.post("/chatbot/triage", ...)` in [app/ai/page.js:121](../../frontend/src/app/ai/page.js#L121) — **not** wrapped in a `services/` file, unlike every other feature (inconsistent with the project's own `AGENTS.md` rule: *"Komunikasi API melalui service layer di src/services, bukan fetch acak di banyak komponen"*) |

### System

| Method | Path | Auth | Frontend caller |
|---|---|---|---|
| GET | `/health` | none | No caller found in `frontend/src` (grep for `/health` found none) despite the endpoint's own docstring suggesting the frontend should call it on startup ([main.py:64-65](../../backend/main.py#L64-L65)) |

## 4. Endpoints with no frontend caller

Besides the two already-noted mismatches (`/consultations/{id}/respond`, `/admin/transactions*` — which don't exist server-side, so they're frontend-side dead code, not unused backend endpoints), every backend endpoint that **does** exist has at least one frontend caller, except:

- `POST /payments/notification` — expected, this is a Midtrans server webhook, not meant to be called by the frontend.
- `GET /health` — expected to be used by uptime monitoring/infra rather than the SPA, but currently has zero known caller of any kind.

## 5. Schema/code mismatches found

| Mismatch | Detail |
|---|---|
| `foto_profil` duplicated across `users` and `konsultan` | Profile photo updates write only `users.foto_profil` ([users.py:125-129](../../backend/routers/users.py#L125-L129)), but several consultation/schedule queries read `foto_profil` directly off the joined `konsultan` row instead of `users` (e.g. [consultations.py:265-266](../../backend/routers/consultations.py#L265-L266)). If both columns exist as real, separate columns (required for PostgREST not to error), they can silently drift out of sync. |
| `status_pengajuan` has no enforced value set | Values are freeform strings written from many call sites with inconsistent vocabulary (`dibatalkan` vs `cancelled`/`cancel` appear both in [consultants.py:647](../../backend/routers/consultants.py#L647) and [payments.py:293](../../backend/routers/payments.py#L293)). `PUT /consultations/{id}/status` accepts **any** string from a konsultan caller with no allow-list validation ([consultations.py:152-182](../../backend/routers/consultations.py#L152-L182)). |
| `CaseCreate` / `ConsultationCreate` / `ConsultationRespond` Pydantic schemas unused | See `01-architecture.md` §6 — these describe a contract that the actual endpoints don't enforce, so trusting the schema files as documentation of what the API accepts would be misleading. |
| `dokumen_bukti` (bursa_kasus) vs `dokumen_pendukung` table | Same conceptual data (supporting files for a case) modeled two different ways depending on whether the case originated from the bursa or a direct booking — `GET /consultations/{id}` has to special-case bursa-origin document retrieval ([consultations.py:402-420](../../backend/routers/consultations.py#L402-L420)) to paper over this. |
