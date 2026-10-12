# Backend API Tests

Dokumen ini menjelaskan alur kerja dan cakupan pengujian pada folder `backend/tests`.

## Ringkas

- Pengujian menggunakan `pytest` + `fastapi.testclient.TestClient`.
- Semua akses ke Supabase dan layanan eksternal dimock; tidak ada jaringan asli.
- Perilaku otentikasi/otorisasi diuji via dependency override dan mock auth.

## Struktur Berkas

- `conftest.py`: fixture global, mock Supabase, dan helper client.
- `test_admin.py`: endpoint admin (statistik, konsultan, verifikasi).
- `test_admin_docs.py`: job proses PDF dokumen hukum, upload, dan replace.
- `test_auth.py`: signup, login, role update, profile, logout.
- `test_cases.py`: posting kasus ke bursa, daftar bursa, dan klaim kasus.
- `test_chatbot.py`: sesi chatbot, pesan, triage.
- `test_consultants.py`: daftar/detail konsultan, jadwal, dashboard, request.
- `test_consultations.py`: pengajuan konsultasi, detail, status, dokumen.
- `test_payments.py`: transaksi Midtrans, notifikasi, status, sinkronisasi.
- `test_users.py`: settings dan profil pengguna.

## Alur Kerja Testing

1. **Setup environment & path**
   - `conftest.py` menyetel `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` ke nilai dummy.
   - Menambahkan folder `backend` ke `sys.path` agar `main.py` dapat diimport.

2. **Mock Supabase**
   - `MockSupabase` mensimulasikan `supabase.table("...")`.
   - `MockTable` memiliki chain method (`select`, `eq`, `insert`, `update`, dll.) dan `execute()`.
   - `execute()` mengambil data dari `TableQueue` (urutan respons yang Anda siapkan).

3. **Fixture `app_client`**
   - `app_client()` mengembalikan `TestClient` + objek `MockSupabase`.
   - Dependency override dilakukan pada:
     - `get_supabase_client` (selalu mock)
     - `get_current_user` (optional, untuk role-based access)

4. **Menjalankan endpoint**
   - Setiap test membuat client dengan data mock, melakukan request HTTP, lalu melakukan assert.

5. **Mocking layanan eksternal**
   - `monkeypatch` dipakai untuk mengganti fungsi/klien eksternal. Logic berada di layer service,
     jadi patch diarahkan ke modul service, bukan router:
     - Supabase auth: `services.auth_service._post_auth`
     - Midtrans: `services.payment_service._get_snap_client`, `_get_core_api_client`
     - Upload dokumen: `services.storage_service.upload_supporting_document_to_supabase`,
       `services.user_service.upload_portfolio_pdf_to_supabase`
     - AI triage: `services.chat_service.triage`, `_auto_generate_title`
     - Proses PDF admin: `services.admin_doc_service.process_pdf_job`, `process_pdf_to_records`,
       `generate_embeddings`

## Skema `table_responses`

`table_responses` adalah `dict` berisi nama tabel Supabase sebagai key dan list respons berurutan sebagai value.
Setiap pemanggilan `execute()` akan mengambil item berikutnya dari list.

Contoh:

```python
table_responses = {
    "pengajuan_konsultasi": [
        [{"id_pengajuan": 1}],
        [],
    ],
    "transaksi": [
        ([{"id_transaksi": 10}], 1),
    ],
}
```

Catatan:
- Jika item berbentuk tuple `(data, count)`, maka `count` diset di `MockResponse`.
- Jika item berbentuk list biasa, hanya `data` yang diisi.

## Simulasi Auth & Role

- `current_user` pada `app_client` mensimulasikan hasil `get_current_user`. Test cukup mengirim `dict`
  (`{"id_user": 1, "role": "client"}`); fixture mengubahnya menjadi objek `CurrentUser`.
- `auth_user` dan `auth_error` mensimulasikan respons `supabase.auth.get_user`.
  - `auth_error` biasanya menghasilkan HTTP 401.

## Ringkasan Cakupan per File

### `test_admin.py`

- Statistik admin (total user, konsultan, transaksi, fallback revenue).
- Listing & detail konsultan.
- Verifikasi konsultan (validasi action, not found, success).

### `test_auth.py`

- Signup/login dengan mock `_post_auth`.
- Validasi request yang salah (422/400).
- Profile & role update via mock auth.
- Logout via mock `httpx.AsyncClient`.

### `test_chatbot.py`

- CRUD sesi chatbot dan list pesan.
- Triage: validasi payload, session baru, session existing, session not found.

### `test_consultants.py`

- List & detail konsultan, jadwal, dan rating.
- Dashboard stats konsultan.
- CRUD jadwal dan toggle status.
- Request pending untuk konsultan.

### `test_consultations.py`

- Pengajuan konsultasi (validasi field, role, waktu).
- Detail konsultasi dan perhitungan harga.
- Update status dan slot ter-booked.
- Dokumen pendukung (list, upload, delete, otorisasi).

### `test_payments.py`

- Create transaction (normal, invalid status, existing pending).
- Midtrans notification (invalid JSON, order not found, update status).
- Payment status dan sync status.

### `test_users.py`

- Settings dan profil penuh (client vs konsultan).
- Update profil JSON dan upload portofolio file.

## Menjalankan Test

Dari root repo:

```bash
python -m pip install -r backend/requirements-dev.txt
python -m ruff check backend
python -m ruff format --check backend
python -m pytest backend/tests
```

Dari folder `backend`:

```bash
python -m pytest
```