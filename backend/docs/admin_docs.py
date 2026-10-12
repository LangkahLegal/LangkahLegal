"""
Admin Document Management Router
=================================
CRUD endpoints untuk mengelola dokumen hukum (basis pengetahuan RAG).

Flow utama:
  - CREATE: Upload PDF → Background Task (OCR → AI Metadata → Chunk → Embed → Insert)
  - READ:   List dokumen (grouped) & list chunks per dokumen
  - UPDATE: Patch 1 chunk (re-embed jika teks berubah) ATAU replace full via PDF
  - DELETE: Hapus 1 dokumen penuh (semua chunk by frbr_uri)

Prefix: /api/v1/admin/documents
"""

UPLOAD_DOCUMENT = {
    "summary": "Upload PDF dokumen hukum baru (async background)",
    "description": """
API ini menerima upload file PDF dokumen hukum secara utuh. File PDF akan diproses di background task agar tidak memblokir respon HTTP, mengingat pemrosesan dokumen memakan waktu yang cukup lama.

**Proses Background (Service doc_processing):**
1. **OCR & Text Extraction**: Menggunakan PyMuPDF untuk mengambil seluruh teks dari PDF, dikurangi noise seperti watermark atau text-header.
2. **Metadata Extraction (AI)**: Memanfaatkan Google Gemini AI untuk mengidentifikasi judul UU, nomor, tahun, kategori hukum, status hukum, dan menghasilkan identifier unik `frbr_uri`.
3. **Chunking**: Memecah dokumen panjang menjadi potongan-potongan kecil berdasarkan pasal.
4. **Vector Embedding**: Mengonversi setiap potongan teks ke dalam representasi vektor 1024-dimensi menggunakan Voyage AI (model `voyage-law-2`), lengkap dengan mekanisme antrean batch rate-limit untuk menghindari error 429.
5. **Database Upsert**: Menyimpan potongan-potongan tersebut secara massal (bulk insert) ke dalam database Supabase.

Endpoint ini langsung mereturn HTTP 202 Accepted beserta `job_id` yang bisa dipolling di endpoint `/jobs/{job_id}` untuk melihat status terkini.
    """,
}

GET_JOB_STATUS = {
    "summary": "Cek status background job (upload/replace)",
    "description": """
API ini digunakan untuk memantau status pemrosesan PDF yang berjalan di background. 
Frontend harus memanggil endpoint ini secara berkala (polling) menggunakan `job_id` yang didapatkan dari endpoint `/upload` atau `/replace`.

**Status yang mungkin dikembalikan:**
- `queued`: Menunggu dalam antrean untuk diproses.
- `processing`: Sedang dalam tahap OCR, chunking, atau embedding.
- `completed`: Pemrosesan berhasil sepenuhnya dan data sudah masuk ke database.
- `failed`: Terjadi kesalahan saat memproses (misalnya gagal OCR atau API limit terlampaui). Detail error akan diberikan pada field message.
    """,
}

LIST_DOCUMENTS = {
    "summary": "List semua dokumen hukum (grouped per UU)",
    "description": """
API ini menampilkan daftar seluruh dokumen hukum yang ada di database.
Karena di database setiap baris merepresentasikan 1 pasal (chunk), endpoint ini akan mengelompokkan baris-baris tersebut berdasarkan `frbr_uri` sehingga mengembalikan daftar **dokumen utuh** beserta total pasalnya.

Admin dapat memfilter berdasarkan `kategori` hukum dan mencari berdasarkan `nama_uu`. Data dikembalikan dalam format paginasi.
    """,
}

LIST_CHUNKS = {
    "summary": "List pasal/chunks dari 1 dokumen (by frbr_uri)",
    "description": """
API ini mengambil semua pasal/potongan teks (chunks) dari satu dokumen hukum spesifik yang dicari menggunakan `frbr_uri`.

Biasanya digunakan oleh admin saat mereka mengklik satu dokumen dari daftar dokumen, lalu ingin melihat atau mengaudit rincian teks per pasalnya. Endpoint mendukung paginasi agar performa tetap cepat meskipun suatu UU memiliki ratusan pasal.
    """,
}

GET_CHUNK = {
    "summary": "Detail satu chunk/pasal",
    "description": """
API ini mengembalikan detail spesifik dari **satu baris data (satu pasal)** berdasarkan Primary Key `id_dokumen`.
Digunakan untuk pre-fill form di sisi frontend jika admin ingin mengedit isi teks atau kategori dari pasal tertentu.
    """,
}

UPDATE_CHUNK = {
    "summary": "Update 1 chunk/pasal (auto re-embed jika teks berubah)",
    "description": """
API ini digunakan oleh admin untuk memperbaiki kesalahan secara manual pada 1 pasal spesifik (misal: membenarkan typo dari hasil OCR atau mengubah kategori).

**Fitur Cerdas (Auto Re-Embed):**
Jika field `isi_teks` diubah, endpoint ini akan otomatis memanggil API Voyage AI secara synchronous untuk membuat ulang vector embedding teks tersebut. Hal ini memastikan bahwa perubahan teks tidak membuat pencarian pencarian vektor RAG menjadi usang atau tidak akurat.
    """,
}

REPLACE_DOCUMENT = {
    "summary": "Replace 1 dokumen penuh dengan PDF baru (async)",
    "description": """
API ini memungkinkan admin menimpa/mengganti (replace) keseluruhan dokumen yang sudah ada dengan PDF versi terbaru (misalnya karena PDF sebelumnya buram atau memiliki revisi minor).

**Alur Kerja:**
1. Endpoint menerima `frbr_uri` dari dokumen lama beserta file PDF baru.
2. Endpoint memberikan respons 202 Accepted seketika dan membuat `job_id`.
3. Di background, Service akan melakukan penghapusan paksa (cascade-like) pada seluruh chunk/pasal dokumen lama berdasarkan URI tersebut.
4. Setelah bersih, service mengekstrak, meng-chunk, men-generate embedding, dan menyimpan pasal-pasal dari PDF baru.
    """,
}

DELETE_DOCUMENT = {
    "summary": "Hapus seluruh chunk dari 1 dokumen (by frbr_uri)",
    "description": """
API ini melayani penghapusan penuh dari satu dokumen hukum.
Penting: Sistem ini melarang penghapusan satu baris chunk saja untuk menjaga keutuhan dokumen pada sistem RAG. Sebagai gantinya, admin harus menghapus dokumen secara keseluruhan dengan mem-passing `frbr_uri`-nya. Endpoint ini akan mencari semua baris pasal dengan URI tersebut dan menghapusnya dari database sekaligus.
    """,
}
