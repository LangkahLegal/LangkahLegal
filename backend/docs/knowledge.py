"""
Knowledge Base Router (Publik, read-only)
==========================================
Endpoint untuk user membuka sumber dokumen peraturan yang dipakai chatbot
(daftar "Sumber dokumen" di bawah jawaban AI).

  - GET /pasal/{id_dokumen}          → Isi 1 pasal + metadata dokumennya
  - GET /documents/detail?frbr_uri=  → Metadata dokumen + total pasal
  - GET /documents/pasal?frbr_uri=   → Daftar pasal 1 dokumen (paginasi + search)

Prefix: /api/v1/knowledge
frbr_uri dikirim via query param karena mengandung "/" (konsisten dengan admin_docs).
"""

GET_PASAL = {
    "summary": "Isi 1 pasal beserta metadata dokumennya",
    "description": """
Dipanggil saat user mengklik chip pasal pada daftar "Sumber dokumen" di bawah jawaban chatbot.
Mengembalikan 404 jika pasal sudah tidak ada (misal dokumen di-replace admin setelah jawaban dibuat).
    """,
}

GET_DOCUMENT_DETAIL = {
    "summary": "Metadata 1 dokumen peraturan + total pasal",
}

LIST_DOCUMENT_PASAL = {
    "summary": "Daftar pasal dari 1 dokumen (paginasi + pencarian)",
    "description": """
Dipakai untuk membaca dokumen utuh dari chatbot ("Lihat semua pasal").
Urutan mengikuti urutan pasal saat dokumen diproses. Field `search` mencari di nomor pasal dan isi teks.
    """,
}
