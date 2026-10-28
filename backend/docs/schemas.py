VERIFY_CONSULTANT_PAYLOAD = "Payload untuk approve/reject konsultan."

KATEGORI_HUKUM = "Enum sesuai kategori_hukum_enum di database Supabase."

UPDATE_CHUNK_REQUEST = "Payload untuk update 1 chunk/pasal (fix typo / kategori)."

CHUNK_RESPONSE = "Response untuk 1 chunk/pasal (tanpa embedding)."

PAGINATED_RESPONSE = "Wrapper response dengan pagination."

JOB_STATUS_RESPONSE = "Response untuk status background job (upload/replace PDF)."

SUMBER_DOKUMEN = "1 dokumen peraturan (group by frbr_uri) yang ditampilkan di bawah jawaban AI."

DRAFT_KONSULTASI = (
    "Ringkasan kasus dari percakapan dengan AI, dipakai untuk mengisi otomatis form pengajuan konsultasi."
)

PREFERENSI_KONSULTASI = "Jawaban klien atas pertanyaan AI soal kategori, budget per sesi, dan jadwal konsultasi."

FORM_PREFERENSI = (
    "Form yang ditampilkan di bawah pertanyaan AI saat type='tanya_preferensi'. Jawabannya dikirim lagi ke "
    "/chatbot/triage lewat field preferensi."
)

KNOWLEDGE_DOCUMENT = "Metadata 1 dokumen peraturan (tanpa embedding / field admin)."
