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

**Mode jawaban:** setiap pesan diklasifikasikan dulu, lalu AI menjawab dalam salah satu mode:
- *Informasi* — menjelaskan aturan yang relevan (pasal muncul di `pasal_referensi`)
- *Mengarahkan ke konsultasi* — pengguna meminta nasihat hukum; AI tidak memilihkan jalur,
  tetapi menyiapkan draft pengajuan (`type: consultation_draft`)
- *Rekomendasi konsultan* — pengguna meminta dicarikan advokat (`type: consultant_list`,
  atau `consultation_draft` bila kasusnya sudah diceritakan)
- *Penutup*, *di luar topik*, dan *krisis* — tanpa pencarian pasal

`draft_konsultasi.deskripsi_kasus` siap dipakai untuk mengisi deskripsi kasus di form pengajuan.
""",
}
