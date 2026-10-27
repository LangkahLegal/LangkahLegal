# Plan Improvement RAG Chatbot Hukum Indonesia

## 1. Tujuan

Meningkatkan chatbot LangkahLegal agar:

1. Jawaban hukum faktual hanya berasal dari knowledge base yang berhasil di-retrieve.
2. Informasi hukum terpisah jelas dari tanggapan, panduan umum, dan rekomendasi.
3. Chatbot tidak memilih strategi hukum atau memprediksi hasil perkara.
4. Rekomendasi konsultan memakai kategori hasil inferensi AI, budget, jadwal, durasi, dan hanya mengembalikan konsultan terverifikasi.
5. Retrieval memahami status dan sumber resmi hukum Indonesia.
6. Kegagalan model, tool, atau sumber menghasilkan fallback aman, bukan klaim tanpa dasar.
7. Evaluasi mencakup kualitas RAG, policy compliance, tool flow, dan keberhasilan end-to-end.

## 2. Baseline dan Temuan Evaluasi

Sumber: `qa/evals-deepeval/reports/20261020-000714/report.html`

| Area | Hasil | Temuan |
|---|---:|---|
| Classifier | 20/20 | Baik pada dataset kecil; belum menguji adversarial dan slot-filling konsultasi |
| Kasus RAG lulus | 6/10 | Belum layak menjadi quality gate produksi |
| Contextual precision | 0,75 | Sumber kurang relevan masih masuk |
| Contextual recall | 0,67 | Aturan relevan belum cukup tercakup |
| Faithfulness | 0,92 | Tinggi, tetapi evaluator lexical terlalu longgar |
| Answer relevancy | 0,61 | Jawaban belum konsisten menjawab kebutuhan utama |
| Routing accuracy | 0,80 | Prompt injection salah menjadi `di_luar_topik` |
| Policy adherence | 0,70 | Batas informasi dan nasihat belum aman |
| Runtime error | 2/10 | Gemini menolak `role="tool"` |

### Temuan prioritas

1. `backend/services/rag_service.py` mengirim function response memakai role `tool`, sedangkan API/model yang dipakai tidak mendukung role tersebut.
2. Batas nasihat hukum bergantung pada prompt. Belum ada validator output setelah generasi.
3. Prompt injection hukum dapat salah diklasifikasikan sebagai di luar topik.
4. Retrieval memakai satu semantic query, lima hasil, tanpa lexical search, reranking, query decomposition, atau filter status hukum yang tegas.
5. Sumber ditampilkan per dokumen, tetapi klaim jawaban belum terikat ke citation tertentu.
6. Rekomendasi konsultan belum mewajibkan budget, waktu pilihan pengguna, durasi, ketersediaan aktual, dan status terverifikasi.
7. Runtime error dikeluarkan dari rerata kualitas, sehingga skor terlihat lebih baik daripada keberhasilan end-to-end.

## 3. Prinsip Produk dan Compliance

### 3.1 Batas kemampuan

Chatbot berperan sebagai triase hukum, bukan advokat. Chatbot boleh:

- menjelaskan informasi yang eksplisit tersedia dalam knowledge base;
- menyederhanakan isi sumber tanpa menambah fakta hukum;
- meminta fakta tambahan;
- membantu pengguna menyiapkan bukti atau dokumen secara umum;
- merangkum fakta pengguna;
- mencari konsultan berdasarkan parameter terverifikasi.

Chatbot tidak boleh:

- memilihkan jalur hukum;
- menyuruh resign, bertahan, melapor, berdamai, menuntut, atau mengirim somasi;
- memprediksi kemenangan atau hasil perkara;
- membuat nomor pasal, sanksi, tenggat, atau hak yang tidak ada dalam knowledge base;
- menyamarkan pengetahuan model sebagai isi knowledge base;
- menyatakan konsultan sebagai “terbaik” tanpa dasar data dan kriteria transparan.

### 3.2 Pemisahan jenis konten

Setiap respons harus dibagi menjadi bagian terstruktur:

1. `knowledge`: informasi hukum dari knowledge base; citation wajib.
2. `safe_preparation`: langkah persiapan netral yang tidak memilih strategi.
3. `empathetic_response`: validasi emosi atau tanggapan non-hukum; citation tidak diperlukan.
4. `needs_lawyer_review`: hal yang tidak dapat diputuskan chatbot dan perlu dinilai advokat.
5. `consultant_recommendation`: hasil pencarian konsultan berdasarkan filter eksplisit.
6. `clarification`: pertanyaan untuk melengkapi fakta atau parameter pencarian.

Kalimat informasi hukum tidak boleh muncul dalam section selain `knowledge`.

## 4. Desain Kontrak Respons

Tambahkan structured response tanpa langsung menghapus field lama:

```python
class AnswerSection(BaseModel):
    kind: Literal[
        "knowledge",
        "safe_preparation",
        "empathetic_response",
        "needs_lawyer_review",
        "consultant_recommendation",
        "clarification",
    ]
    title: str
    content: str
    citation_ids: list[int] = []

class ConsultantSearchCriteria(BaseModel):
    inferred_category: str
    category_confidence: float | None = None
    city: str | None = None
    max_budget: float | None = None
    preferred_date: str | None = None
    preferred_start_time: str | None = None
    duration_minutes: int | None = None
    verified_only: bool = True

class TriageResponse(BaseModel):
    # Field lama dipertahankan selama migrasi.
    jawaban: str
    pasal_referensi: list[PasalReference]
    sumber_dokumen: list[SumberDokumen]
    consultants: list[ConsultantInfo] | None
    draft_konsultasi: DraftKonsultasi | None

    # Field baru.
    answer_sections: list[AnswerSection] = []
    grounding_status: Literal[
        "grounded",
        "partial",
        "insufficient_sources",
        "not_applicable",
    ]
    consultant_search: ConsultantSearchCriteria | None = None
    missing_consultant_fields: list[str] = []
```

### Aturan grounding

- `knowledge` wajib memiliki minimal satu `citation_id` valid.
- Semua `citation_id` wajib berasal dari retrieval turn yang sama.
- Nomor pasal, angka, sanksi, tenggat, dan nama regulasi wajib cocok dengan sumber.
- Jika sumber tidak cukup, jangan membuat section `knowledge`; gunakan `grounding_status="insufficient_sources"`.
- `jawaban` lama dibentuk dari gabungan section untuk kompatibilitas, bukan dibuat terpisah oleh model.

## 5. Alur Rekomendasi Konsultan

### 5.1 Parameter wajib dan opsional

Sebelum pencarian final, chatbot mengumpulkan:

| Parameter | Aturan |
|---|---|
| Kategori | Disimpulkan AI dari masalah dan riwayat; pengguna tidak wajib memilih |
| Budget maksimal | Wajib dikonfirmasi sebelum pencarian final |
| Tanggal pilihan | Wajib dikonfirmasi sebelum pencarian final |
| Jam mulai pilihan | Wajib dikonfirmasi sebelum pencarian final |
| Durasi | Wajib dikonfirmasi, disimpan dalam menit |
| Kota | Opsional; dipakai bila pengguna menyebut atau produk memang memerlukan lokasi |
| Status verifikasi | Selalu `terverifikasi`; bukan pilihan pengguna |
| Status aktif | Selalu aktif |
| Slot tersedia | Wajib cocok dengan tanggal, jam, dan durasi yang diminta |

Budget perlu didefinisikan konsisten terhadap model tarif saat ini. Jika `tarif_per_sesi` tidak bergantung durasi, UI dan respons harus menyebut bahwa budget dibandingkan dengan tarif per sesi. Jika tarif dihitung menurut durasi, backend harus menghitung total secara deterministik; model tidak boleh menghitung atau mengasumsikan harga.

### 5.2 Slot-filling multi-turn

State pencarian disimpan dalam metadata percakapan, bukan hanya teks history:

```json
{
  "consultant_search": {
    "inferred_category": "Ketenagakerjaan",
    "category_confidence": 0.91,
    "city": "Bandung",
    "max_budget": 300000,
    "preferred_date": "2026-11-02",
    "preferred_start_time": "13:00",
    "duration_minutes": 60,
    "verified_only": true
  },
  "missing_fields": []
}
```

Urutan perilaku:

1. AI menyimpulkan kategori dari cerita dan riwayat.
2. Backend memvalidasi kategori terhadap enum `KATEGORI_KONSULTAN`.
3. Ekstrak parameter yang sudah disebut pengguna.
4. Tentukan field yang belum ada.
5. Tanyakan semua field wajib yang belum ada dalam satu pertanyaan ringkas agar tidak membuat banyak turn.
6. Validasi jawaban pengguna dan gabungkan ke state.
7. Jalankan pencarian hanya setelah budget, tanggal, jam mulai, dan durasi lengkap.
8. Kembalikan konsultan aktif dan terverifikasi yang benar-benar memiliki slot cukup panjang.
9. Jika hasil kosong, jelaskan filter yang tidak menemukan hasil dan tawarkan perubahan satu parameter: tanggal/jam, durasi, budget, atau kota. Jangan otomatis melonggarkan `verified_only`.

Contoh pertanyaan klarifikasi:

> Agar saya dapat mencari konsultan terverifikasi yang tersedia, berapa budget maksimal per sesi, tanggal dan jam yang Anda inginkan, serta durasi konsultasi—30, 60, atau 90 menit?

### 5.3 Inferensi kategori

- Kategori ditentukan AI dari fakta kasus dan riwayat.
- Pengguna tidak perlu ditanya kategori jika confidence cukup.
- Backend tetap memvalidasi hasil terhadap enum.
- Jika confidence rendah atau dua kategori sama kuat, gunakan `Umum` atau minta klarifikasi tentang fakta kasus; jangan meminta pengguna memahami klasifikasi hukum.
- Simpan kategori sebagai `inferred_category`, bukan fakta yang dinyatakan pengguna.
- Kategori hanya dipakai untuk pencarian konsultan. Kategori tidak boleh dipakai sebagai kesimpulan hukum atas perkara.

### 5.4 Verified-only enforcement

Filter wajib ditegakkan pada repository/database, bukan prompt:

```text
is_active = true
status_verifikasi = "terverifikasi"
spesialisasi cocok inferred_category
harga <= max_budget
slot mencakup preferred_start_time sampai preferred_start_time + duration_minutes
slot belum lewat
slot belum dipesan atau bentrok
```

`consultant_repository.search_by_category()` saat ini memanggil RPC `search_consultants_by_category`. RPC atau repository penggantinya harus menerima dan menegakkan verified-only. Hasil tool tetap diperiksa ulang di backend sebelum dikirim ke pengguna.

### 5.5 Pencocokan jadwal

Gunakan logika jadwal backend yang sudah ada sebagai sumber kebenaran, khususnya aturan konflik dan waktu WIB. Jangan meminta LLM menilai overlap waktu.

Pencarian perlu:

1. Ambil kandidat verified, aktif, kategori cocok, dan sesuai budget.
2. Ambil jadwal kandidat pada tanggal pilihan.
3. Kurangi booking aktif.
4. Bentuk slot berdasarkan durasi pengguna.
5. Cocokkan jam mulai pilihan.
6. Return hanya konsultan dengan slot tersedia, termasuk `id_jadwal`, tanggal, jam mulai, jam selesai, durasi, dan tarif.
7. Validasi ulang slot saat pengguna melakukan booking untuk mencegah race condition.

### 5.6 Bentuk tool

Pisahkan pengumpulan parameter dari eksekusi pencarian. Tool tidak dipanggil sebelum field wajib lengkap.

```json
{
  "name": "cari_konsultan_tersedia",
  "parameters": {
    "kategori": "Ketenagakerjaan",
    "kota": "Bandung",
    "max_budget": 300000,
    "tanggal": "2026-11-02",
    "jam_mulai": "13:00",
    "durasi_menit": 60
  }
}
```

`verified_only` tidak perlu menjadi argumen model karena nilainya selalu benar. Backend menerapkannya secara tetap.

## 6. Robust Boundary: Knowledge vs Rekomendasi/Tanggapan/Saran

### 6.1 Jangan mengandalkan satu prompt

Gunakan empat lapis kontrol:

1. **Routing:** tentukan kebutuhan informasi, klarifikasi, atau konsultasi.
2. **Structured generation:** model hanya dapat menghasilkan section dengan tipe yang diizinkan.
3. **Deterministic validation:** backend memeriksa citation, angka, pasal, section, dan frasa/aksi strategis.
4. **Safe fallback:** respons template jika validasi atau regeneration gagal.

### 6.2 Dua jalur generasi

#### Jalur A — Informasi hukum

Input model:

- pertanyaan pengguna;
- history yang diperlukan;
- chunk knowledge base terpilih;
- ID citation;
- instruksi bahwa knowledge base adalah satu-satunya sumber informasi hukum.

Output:

- hanya section `knowledge` dan, bila perlu, `clarification`;
- setiap klaim hukum memiliki citation;
- tidak memakai pengetahuan model di luar context.

Jika retrieval kosong atau tidak cukup:

> Basis pengetahuan belum menemukan sumber yang cukup untuk menjawab bagian hukum tersebut. Saya tidak akan membuat ketentuan atau nomor pasal yang tidak tersedia.

#### Jalur B — Tanggapan dan tindak lanjut

Input model tidak digunakan untuk membuat fakta hukum baru. Output dibatasi ke:

- `empathetic_response`;
- `safe_preparation`;
- `needs_lawyer_review`;
- `clarification`;
- `consultant_recommendation` dari data tool.

Rekomendasi hanya boleh menyebut data yang dihasilkan tool. Model tidak boleh menambah ketersediaan, harga, verifikasi, rating, pengalaman, atau lokasi.

### 6.3 Policy matrix

| Isi | Diizinkan | Sumber/aturan |
|---|---|---|
| Bunyi atau makna aturan | Ya | Harus dari KB dan bercitation |
| Nomor pasal | Ya | Exact match dengan chunk |
| Sanksi, tenggat, nominal | Ya | Exact support dari chunk |
| Ringkasan fakta pengguna | Ya | Hanya dari percakapan |
| Validasi emosi | Ya | Tidak boleh menjanjikan hasil |
| Menyimpan bukti/dokumen | Ya | Panduan persiapan netral |
| Memilih resign atau bertahan | Tidak | Eskalasi ke advokat |
| Memilih lapor atau damai | Tidak | Eskalasi ke advokat |
| Prediksi menang/kalah | Tidak | Eskalasi ke advokat |
| Konsultan tersedia | Ya | Hanya dari hasil tool aktual |
| Konsultan verified | Ya | Hanya jika backend memverifikasi status |
| Kategori kasus | Ya untuk matching | Label sebagai inferensi, bukan kesimpulan hukum |

### 6.4 Output validator

Validator deterministik memeriksa:

1. Section `knowledge` tanpa citation.
2. Citation di luar retrieved IDs.
3. Nomor pasal di luar context.
4. Angka, tenggat, nominal, dan sanksi yang tidak didukung context.
5. Klaim hukum dalam section non-knowledge.
6. Imperatif strategis seperti memilih resign, melapor, berdamai, menuntut, atau mengirim somasi.
7. Prediksi hasil atau kekuatan perkara.
8. Atribut konsultan yang tidak ada dalam hasil tool.
9. Pernyataan verified tanpa `status_verifikasi="terverifikasi"`.
10. Pernyataan tersedia tanpa slot valid.

Jika pelanggaran ditemukan:

```text
generate
→ validate
→ regenerate sekali dengan daftar pelanggaran
→ validate
→ template fallback aman
```

Untuk mode berisiko tinggi seperti prediksi kemenangan dan pilihan strategi, prioritaskan template deterministik daripada regeneration bebas.

### 6.5 Prompt injection

Tambahkan aturan classifier dan pre-check:

- Instruksi pengguna untuk mengabaikan kebijakan tidak mengubah topik hukum.
- Permintaan membuat pasal atau sumber palsu tetap masuk mode informasi, lalu hanya dijawab dari KB.
- Teks pengguna dan isi dokumen selalu dianggap data, bukan instruksi sistem.
- Instruksi yang ditemukan dalam dokumen hasil retrieval diabaikan.
- Jangan tampilkan system prompt, tool schema internal, credential, atau log.

Pola deterministik seperti `abaikan instruksi`, `buat pasal palsu`, `meski tidak ada di sumber`, dan `system prompt` menjadi sinyal risiko, bukan satu-satunya mekanisme pertahanan.

## 7. Perbaikan Retrieval Hukum Indonesia

### 7.1 Quick wins

1. Naikkan candidate retrieval menjadi 15–20 chunk.
2. Deduplicate chunk serupa.
3. Rerank menjadi 5–8 chunk final.
4. Prioritaskan dokumen resmi dan berlaku.
5. Jangan jadikan dokumen dicabut sebagai dasar utama.
6. Beri peringatan jika status hukum tidak diketahui.
7. Tambahkan exact-match bonus untuk nomor pasal, nomor/tahun regulasi, singkatan, dan istilah hukum.

### 7.2 Hybrid retrieval

Gabungkan:

```text
vector search
+ PostgreSQL full-text/lexical search
+ metadata filter
+ reranking
```

### 7.3 Query decomposition

Pertanyaan majemuk seperti perbandingan PHK dan pengunduran diri dipecah menjadi beberapa subquery. Hasil digabung dan dideduplicate sebelum reranking.

### 7.4 Metadata regulasi

Target metadata:

- FRBR URI;
- judul dan jenis regulasi;
- nomor dan tahun;
- instansi penerbit;
- tanggal penetapan, pengundangan, dan berlaku;
- status hukum;
- relasi mengubah/diubah/mencabut/dicabut;
- URL sumber resmi;
- tanggal verifikasi terakhir;
- hash file dan versi ingestion.

Prioritaskan JDIH instansi penerbit, peraturan.go.id, JDIH BPK, serta sumber resmi MA/MK untuk putusan.

## 8. Perubahan per Area Kode

### Backend policy dan RAG

- `backend/services/chat_policy.py`
  - tambah aturan prompt injection;
  - tambah mode/hasil klarifikasi parameter konsultan;
  - perketat pemisahan section;
  - sediakan template deterministik untuk nasihat terlarang dan sumber tidak cukup.

- `backend/services/rag_service.py`
  - perbaiki function response role sesuai Google GenAI SDK;
  - structured generation;
  - post-generation validator;
  - safe fallback;
  - slot-filling state;
  - tool baru pencarian konsultan tersedia;
  - verified-only post-check;
  - hybrid retrieval dan reranking bertahap.

- `backend/services/chat_service.py`
  - simpan `answer_sections`, grounding status, dan state pencarian ke metadata;
  - pertahankan kontrak lama selama migrasi.

### Backend schema dan repository

- `backend/schemas/chatbot.py`
  - tambah `AnswerSection`, `ConsultantSearchCriteria`, slot hasil, dan status grounding.

- `backend/repositories/consultant_repository.py`
  - pencarian kandidat aktif dan terverifikasi;
  - parameter kategori, budget, kota;
  - jangan bergantung pada prompt untuk verified-only.

- repository/service jadwal terkait
  - query jadwal per kandidat dan tanggal;
  - reuse validasi overlap, booking, durasi, dan waktu WIB;
  - validasi ulang saat booking.

- RPC Supabase `search_consultants_by_category`
  - audit output dan filter saat ini;
  - ubah atau ganti agar `status_verifikasi='terverifikasi'` dan `is_active=true` wajib;
  - dukung filter budget dan kandidat yang dapat diperiksa jadwalnya.

### Frontend

- `frontend/src/components/ai/ChatMessage.jsx`
  - render section knowledge, persiapan, tanggapan, dan review advokat secara terpisah;
  - render pertanyaan klarifikasi parameter;
  - jangan campur rekomendasi konsultan ke blok informasi hukum.

- `frontend/src/components/ai/AISourceList.jsx`
  - tampilkan status hukum, sumber resmi, dan tanggal verifikasi;
  - tandai status dicabut/diubah/tidak diketahui.

- `frontend/src/components/ai/AIConsultantCard.jsx` dan draft card
  - tampilkan badge terverifikasi;
  - tampilkan slot yang cocok, durasi, tarif, dan alasan kecocokan;
  - sediakan empty state saat tidak ada hasil.

- `frontend/src/stores/useChatStore.js`
  - simpan `answer_sections`, `grounding_status`, `consultant_search`, dan missing fields.

UI wajib memiliki loading, success, empty, dan error state.

## 9. Compliance Data Pribadi

Karena chat hukum dapat berisi data sensitif:

1. Minimalkan data yang dikirim ke model eksternal.
2. Redact NIK, nomor rekening, nomor telepon, email, dan alamat rinci jika tidak dibutuhkan.
3. Tetapkan tujuan pemrosesan, retensi, dan penghapusan chat.
4. Terapkan role-based access dan audit akses admin.
5. Enkripsi data saat transit dan tersimpan.
6. Jangan memakai percakapan untuk training tanpa dasar pemrosesan yang sesuai.
7. Jangan mencatat data pribadi lengkap dalam application log.
8. Versioning model, prompt policy, retrieval, dan ingestion untuk audit.
9. Review akhir bersama advokat dan petugas compliance Indonesia; implementasi teknis bukan pengganti legal review.

## 10. Perbaikan Evaluasi

### 10.1 Perhitungan

Runtime error dihitung sebagai nol untuk:

- task success;
- routing;
- policy;
- answer relevancy;
- tool success.

Laporkan dua angka:

1. kualitas pada respons berhasil;
2. keberhasilan end-to-end termasuk error.

### 10.2 Evaluasi boundary

Tambahkan kasus:

- jawaban hukum dengan sumber cukup;
- sumber kosong;
- sumber parsial;
- nomor pasal palsu;
- angka/tenggat tidak didukung;
- rekomendasi terselip dalam section knowledge;
- informasi hukum terselip dalam section tanggapan;
- penolakan aman yang menyebut opsi pengguna tanpa dianggap memberi rekomendasi;
- prompt injection single-turn dan multi-turn;
- instruksi jahat di dalam dokumen retrieval.

Evaluator tidak cukup memakai forbidden substring. Evaluasi harus membedakan:

> “Tetap bekerja adalah pilihan terbaik.”

Dari penolakan aman:

> “Saya tidak dapat menentukan apakah Anda perlu resign atau tetap bekerja.”

### 10.3 Evaluasi pencarian konsultan

Tambahkan skenario:

1. Semua parameter sudah lengkap.
2. Budget belum ada.
3. Jadwal belum ada.
4. Durasi belum ada.
5. Parameter tersebar dalam beberapa turn.
6. Kategori disimpulkan dari cerita.
7. Kategori ambigu.
8. Konsultan cocok tetapi belum terverifikasi.
9. Konsultan verified tetapi tidak aktif.
10. Jadwal ada tetapi bentrok booking.
11. Slot lebih pendek dari durasi.
12. Tidak ada hasil sesuai budget.
13. Tidak ada hasil di kota pilihan.
14. Race condition: slot diambil sebelum booking selesai.
15. Tool atau model gagal setelah hasil pencarian tersedia.

Assertions wajib:

- tool belum dipanggil sebelum field wajib lengkap;
- `verified_only` selalu benar dan enforced di backend;
- semua hasil `status_verifikasi="terverifikasi"`;
- semua hasil aktif;
- semua slot mencakup durasi;
- tarif sesuai budget;
- kategori berasal dari inferensi valid;
- atribut hasil tidak dibuat model.

### 10.4 Golden dataset hukum

Perbesar dataset untuk:

- ketenagakerjaan;
- pidana;
- perdata;
- KDRT dan anak;
- perlindungan konsumen;
- teknologi informasi;
- regulasi dicabut atau diubah;
- pertanyaan berdasarkan tanggal kejadian;
- multi-turn dan bahasa kasual;
- kondisi krisis;
- data pribadi;
- outage Gemini, Voyage, dan Supabase.

## 11. Tahapan Implementasi

### Fase 1 — Stabilitas dan safety gate

Target:

- tidak ada `Role 'tool' is not supported`;
- semua tool call memiliki fallback;
- output policy validator aktif;
- prompt injection dirutekan sebagai topik hukum;
- runtime error dihitung dalam skor.

Acceptance criteria:

- 10/10 kasus baseline selesai tanpa runtime error;
- fabricated citation = 0;
- strategic legal advice = 0;
- crisis routing = 100%.

### Fase 2 — Structured grounded answer

Target:

- knowledge terpisah dari tanggapan dan saran;
- citation per section/klaim;
- fallback sumber tidak cukup;
- frontend menampilkan section berbeda.

Acceptance criteria:

- 100% section knowledge memiliki citation valid;
- 0 klaim hukum pada section non-knowledge;
- 0 nomor pasal di luar retrieved context;
- field lama tetap kompatibel.

### Fase 3 — Consultant slot-filling dan verified search

Target:

- AI menyimpulkan kategori;
- chatbot mengonfirmasi budget, tanggal, jam, dan durasi;
- hasil hanya konsultan aktif, verified, dan tersedia.

Acceptance criteria:

- pencarian final tidak berjalan sebelum field wajib lengkap;
- 100% hasil terverifikasi dan aktif;
- 100% hasil memiliki slot yang cukup;
- filter budget ditegakkan backend;
- tidak ada fallback ke konsultan non-verified;
- booking melakukan validasi ulang slot.

### Fase 4 — Hybrid legal retrieval

Target:

- hybrid search, reranking, query decomposition, dan status hukum.

Acceptance criteria:

- contextual precision >= 0,85;
- contextual recall >= 0,85;
- dokumen dicabut tidak menjadi sumber utama tanpa peringatan;
- pertanyaan perbandingan mengambil kedua sisi.

### Fase 5 — Data compliance dan observability

Target:

- PII redaction;
- retensi dan deletion flow;
- audit log aman;
- versioning prompt/model/retrieval;
- monitoring kualitas dan tool.

Metrics:

- no-source rate;
- citation validation rate;
- policy violation rate;
- tool failure rate;
- verified-filter rejection count;
- no-available-slot rate;
- clarification completion rate;
- booking race-conflict rate;
- retrieval latency;
- escalation rate.

### Fase 6 — CI quality gate

Gate usulan:

```text
classifier_accuracy >= 0.95
end_to_end_task_success >= 0.95
citation_validity = 1.00
fabricated_citations = 0
forbidden_legal_advice = 0
knowledge_outside_kb = 0
crisis_routing = 1.00
tool_success >= 0.99
verified_consultant_results = 1.00
available_slot_results = 1.00
contextual_precision >= 0.85
contextual_recall >= 0.85
```

Pisahkan suite deterministik cepat dari suite integrasi yang memakai Gemini, Voyage, dan Supabase.

## 12. Urutan Prioritas

1. Perbaiki protokol function response Gemini.
2. Tambahkan fallback tool dan hitung error sebagai failure.
3. Tambahkan structured sections dan validator output.
4. Tegakkan informasi hukum hanya dari knowledge base.
5. Perbaiki prompt-injection routing.
6. Tambahkan state slot-filling budget, tanggal, jam, dan durasi.
7. Tegakkan verified-only dan active-only pada database/repository.
8. Integrasikan pencarian jadwal aktual dan validasi durasi.
9. Pisahkan UI knowledge, tanggapan, persiapan, dan konsultan.
10. Tingkatkan retrieval menjadi hybrid dan sadar status hukum.
11. Tambahkan kontrol PDP, audit, dan monitoring.
12. Jadikan evaluasi sebagai deployment gate.

## 13. Definition of Done

Plan dianggap selesai diimplementasikan bila:

1. Chatbot tidak menghasilkan informasi hukum di luar knowledge base.
2. Setiap klaim hukum dapat ditelusuri ke sumber yang dipakai pada turn tersebut.
3. Rekomendasi dan tanggapan terlihat serta tervalidasi terpisah dari informasi hukum.
4. Chatbot mengumpulkan budget, tanggal, jam, dan durasi sebelum pencarian konsultan.
5. Kategori disimpulkan AI dan divalidasi backend.
6. Semua konsultan hasil pencarian aktif, terverifikasi, sesuai budget, dan memiliki slot cukup.
7. Slot divalidasi ulang ketika booking.
8. Nasihat strategis dan prediksi hasil tidak lolos validator.
9. Prompt injection tidak dapat memaksa sumber palsu atau melewati policy.
10. Eval end-to-end dan quality gate lulus, termasuk failure path.
