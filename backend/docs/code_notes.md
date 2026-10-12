# Catatan Kode Backend

Penjelasan fungsi dan modul yang sebelumnya ditulis sebagai docstring di dalam kode.
Kode backend sengaja tidak memuat docstring; catatan untuk developer dikumpulkan di sini,
dikelompokkan per file.

## `core/exceptions.py`

### Ringkasan modul

Exception domain untuk layer service.

Service me-raise exception di bawah ini, bukan `HTTPException` secara langsung.
Semua kelas mewarisi `HTTPException` sehingga FastAPI tetap mengubahnya menjadi
response `{"detail": ...}` dengan status code yang sesuai tanpa handler tambahan.

## `docs/admin.py`

### Ringkasan modul

Router untuk Admin Dashboard.

Endpoints (admin-only):
- Verifikasi Konsultan: list, detail, approve/reject
- Monitoring Komisi: list transaksi, summary
- Dashboard Stats: ringkasan platform

## `docs/admin_docs.py`

### Ringkasan modul

Admin Document Management Router
=================================
CRUD endpoints untuk mengelola dokumen hukum (basis pengetahuan RAG).

Flow utama:
  - CREATE: Upload PDF → Background Task (OCR → AI Metadata → Chunk → Embed → Insert)
  - READ:   List dokumen (grouped) & list chunks per dokumen
  - UPDATE: Patch 1 chunk (re-embed jika teks berubah) ATAU replace full via PDF
  - DELETE: Hapus 1 dokumen penuh (semua chunk by frbr_uri)

Prefix: /api/v1/admin/documents

## `docs/chatbot.py`

### Ringkasan modul

LangkahLegal Chatbot Router
============================
Endpoints untuk chatbot AI berbasis RAG + Persistensi History.

CRUD Sesi & Pesan:
  - POST   /sessions              → Buat sesi baru
  - GET    /sessions              → Daftar sesi milik user
  - DELETE /sessions/{session_id} → Hapus sesi
  - GET    /sessions/{session_id}/messages → Riwayat chat

RAG Pipeline:
  - POST   /triage                → Kirim pesan + generate jawaban AI

## `docs/knowledge.py`

### Ringkasan modul

Knowledge Base Router (Publik, read-only)
==========================================
Endpoint untuk user membuka sumber dokumen peraturan yang dipakai chatbot
(daftar "Sumber dokumen" di bawah jawaban AI).

  - GET /pasal/{id_dokumen}          → Isi 1 pasal + metadata dokumennya
  - GET /documents/detail?frbr_uri=  → Metadata dokumen + total pasal
  - GET /documents/pasal?frbr_uri=   → Daftar pasal 1 dokumen (paginasi + search)

Prefix: /api/v1/knowledge
frbr_uri dikirim via query param karena mengandung "/" (konsisten dengan admin_docs).

## `helpers/profile.py`

### `find_profile`

Cari profil lokal milik akun Supabase Auth. Jika belum tertaut tetapi ada
profil dengan email yang sama, tautkan lalu kembalikan profil tersebut.

## `schemas/admin.py`

### Ringkasan modul

Pydantic schemas untuk Admin Dashboard endpoints.

## `schemas/admin_docs.py`

### Ringkasan modul

Pydantic schemas untuk Admin Document Management endpoints.

## `schemas/knowledge.py`

### Ringkasan modul

Pydantic schemas untuk endpoint Knowledge Base publik (read-only, untuk user).

## `services/chat_service.py`

### `_resolve_session`

Kembalikan (session_id, is_new_session); buat sesi baru jika belum ada.

## `services/consultant_service.py`

### `_format_upcoming_client`

Baris daftar klien; None jika jadwalnya sudah lewat atau tanggalnya tidak diketahui.

## `services/consultation_service.py`

### `_detail_scope`

Filter kepemilikan (id_user, id_konsultan) untuk detail pengajuan sesuai role.

## `services/notification_service.py`

### `_best_effort`

Notifikasi tidak boleh menggagalkan request utama: error hanya dicatat.

## `services/payment_service.py`

### `_map_midtrans_status`

Ubah status Midtrans menjadi (status_pembayaran, status_pengajuan) internal.

### `_reuse_pending_transaction`

Kembalikan token Snap lama jika transaksi pending sebelumnya masih berlaku.

## `services/rag_service.py`

### Ringkasan modul

RAG + Agentic pipeline untuk chatbot LangkahLegal.

Flow:
  1. Rewrite query user (bahasa awam → istilah hukum)
  2. Embed via Voyage AI (voyage-law-2)
  3. Retrieve pasal relevan dari Supabase RPC
  4. Bangun multi-turn contents + panggil Gemini dengan Tool
  5. Jika Gemini minta tool call → eksekusi → kirim FunctionResponse balik
  6. Return jawaban final (text biasa ATAU consultant_list)

### `rewrite_query`

Terjemahkan query awam → query hukum presisi, dengan konteks history.

### `embed_query`

Embed query pakai Voyage AI (input_type=query).

### `retrieve_pasals`

Panggil RPC match_dokumen_hukum untuk ambil pasal relevan.

### `_build_context`

Rangkai teks konteks pasal untuk disisipkan ke prompt.

### `_build_references`

Bangun list referensi pasal untuk response frontend.

### `_build_source_documents`

Kelompokkan pasal hasil retrieval per dokumen (frbr_uri) untuk ditampilkan
sebagai daftar sumber yang bisa dibuka user. Pasal tanpa id_dokumen/frbr_uri
di-skip karena tidak bisa di-resolve ke dokumen.

### `_attach_document_status`

Lengkapi status_hukum tiap sumber dari view dokumen_hukum_summary
(RPC match_dokumen_hukum tidak mengembalikan kolom ini).
Gagal lookup tidak boleh menggagalkan jawaban — status dibiarkan None.

### `_execute_tool`

Eksekusi tool call dari Gemini, return dict untuk FunctionResponse.

### `_summarize_consultants`

Bikin ringkasan singkat daftar konsultan untuk konteks history.

### `_build_contents`

Konversi chat history dari DB + query terbaru → list[types.Content]
yang siap dikirim ke Gemini.

Setiap pesan jadi Content terpisah dengan role user/model.
Pesan AI yang punya metadata consultant_list ditambahkan ringkasan
agar Gemini tau "oh, saya sudah pernah kasih rekomendasi konsultan."

### `_smart_truncate`

Potong pesan history dari AWAL (oldest-first) kalau total karakter
melebihi batas. Pesan terakhir (query user terbaru) TIDAK pernah dipotong.

### `agentic_generate`

Panggil Gemini dengan Tool support. Kalau Gemini minta tool call,
eksekusi fungsinya lalu kirim FunctionResponse balik ke Gemini
(true agentic loop). Gemini yang merangkai jawaban final.

Return dict:
  - {"type": "text", "jawaban": "..."}
  - {"type": "consultant_list", "jawaban": "...", "consultants": [...]}

### `triage`

Pipeline utama RAG + Agentic.
  1. Rewrite query
  2. Embed
  3. Retrieve pasal (threshold 0.5 only, no fallback)
  4. Agentic generate
  5. Return structured response

## `services/storage_service.py`

### `upload_supporting_documents`

Upload banyak dokumen pendukung. Tiap file yang berhasil diteruskan ke
`on_uploaded(doc_meta)` dan hasilnya dikumpulkan; file yang gagal dicatat
beserta alasannya tanpa menghentikan file lain.

## `services/user_service.py`

### `_professional_fields`

Field profil konsultan yang benar-benar diisi (nilai None dilewati).

## `tests/conftest.py`

### `MockSupabase.inserted`

Semua payload yang di-insert ke tabel `name`, sesuai urutan.

## `tests/test_rag_sources.py`

### `_FakeSummaryTable`

Meniru supabase.table("dokumen_hukum_summary").select().in_().execute().

### `_FakeSupabase`

RPC match_dokumen_hukum + view dokumen_hukum_summary dalam satu fake client.
