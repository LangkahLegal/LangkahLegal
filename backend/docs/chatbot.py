"""
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
"""

CREATE_SESSION = {
    "summary": "Buat sesi konsultasi baru",
    "description": "Membuat sesi chat baru untuk user yang sedang login.",
}

LIST_SESSIONS = {
    "summary": "Daftar sesi konsultasi user",
    "description": "Mengambil daftar sesi chat milik user, diurutkan dari yang terbaru.",
}

DELETE_SESSION = {
    "summary": "Hapus sesi konsultasi",
    "description": "Menghapus sesi chat beserta semua pesannya (cascade delete).",
}

GET_SESSION_MESSAGES = {
    "summary": "Riwayat chat dalam satu sesi",
    "description": "Mengambil seluruh pesan dalam satu sesi, diurutkan dari yang terlama.",
}

CHATBOT_TRIAGE = {
    "summary": "Chatbot RAG Triage",
    "description": """
Endpoint utama chatbot LangkahLegal. Menerima pertanyaan hukum dari pengguna,
mencari pasal-pasal yang relevan, dan menghasilkan jawaban AI.

**Perubahan dari versi sebelumnya:**
- Backend TIDAK lagi menerima `chat_history` dari frontend
- Backend mengambil riwayat chat dari database berdasarkan `session_id`
- Setelah AI menjawab, pesan user + AI otomatis tersimpan ke database
- Jika `session_id` kosong, backend membuat sesi baru secara otomatis
""",
}
