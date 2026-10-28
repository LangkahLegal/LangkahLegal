# Sprint 5

Catatan perubahan yang saya kerjakan selama Sprint 5. Setiap perubahan ditulis apa yang diubah, kenapa, file mana saja, dan bagaimana ngetesnya. Entri terbaru ditaruh paling bawah.

---

## 1. Perbaikan error 400 tool call dan retry Gemini yang boros

**Tanggal:** 27 Oktober 2026
**Status:** belum di-commit

### Masalah

1. Di eval chatbot tanggal 20 Oktober, kasus "prediksi kemenangan perkara" dan "cari pengacara berdasarkan kota" error dengan pesan `400 INVALID_ARGUMENT: Role 'tool' is not supported`.
2. Kuota Gemini cepat banget habis, apalagi waktu eval dijalankan.

### Penyebab

1. **Error 400 bukan karena model tidak support tool call.** Yang ditolak adalah role pesan waktu hasil tool dikirim balik ke Gemini. Di `rag_service.py` kita pakai `role="tool"`, padahal SDK `google-genai` sendiri pakai `role="user"` untuk function response. Penolakannya tidak selalu terjadi. Di eval yang sama, kasus "pilih polisi atau damai" berhasil memanggil tool, jadi tergantung server Google mana yang melayani request-nya.
2. **Retry kita sendiri yang melipatgandakan request.** Kalau model error, kode mencoba 2 model × 3 putaran dengan jeda 2 dan 4 detik. Untuk error 429 (kuota habis) ini percuma karena kuota tidak pulih dalam beberapa detik. Satu pesan yang gagal bisa jadi sekitar 15 request. Selain itu log error dipotong 150 karakter, jadi kita tidak tahu limit mana yang habis, per menit atau per hari.

Yang saya cek dan ternyata bukan penyebab:
- Token thinking. Model `gemini-3.1-flash-lite` dan `gemini-3.5-flash-lite` tidak menghasilkan token thinking sama sekali (`thoughts_token_count` kosong).
- Retry bawaan SDK. SDK `google-genai` hanya retry kalau `retry_options` diset, dan di project ini tidak diset.

### Perubahan

1. `role="tool"` diganti `role="user"` di `_tool_response_content`.
2. Kalau semua model gagal karena 429, retry langsung berhenti setelah satu putaran (2 request, bukan 6). Retry dengan jeda tetap jalan untuk 503 karena server sibuk biasanya cepat pulih.
3. Log error Gemini sekarang menampilkan `quotaId` dari respons 429, misalnya `GenerateRequestsPerDayPerProjectPerModel-FreeTier`. Jadi kelihatan limit mana yang habis.

### File

| File | Perubahan |
|---|---|
| `backend/helpers/gemini_errors.py` | Baru. `is_quota_error()` untuk membedakan 429 dari 503, dan `describe()` untuk ringkasan error plus `quotaId`. |
| `backend/services/rag_service.py` | Role function response jadi `user`. `_generate_with_first_available_model` sekarang juga mengembalikan apakah semua kegagalan karena kuota. `_generate_with_retry` berhenti lebih awal kalau iya. |
| `backend/services/chat_policy.py` | Log error classifier pakai `gemini_errors.describe()`. |

### Pengujian

1. Tes offline dengan client Gemini palsu yang menghitung jumlah request, 11 cek, semua lolos:
   - semua model 429: berhenti setelah 2 request
   - semua model 503: tetap retry, total 6 request
   - campuran 429 dan 503: tetap retry
   - model pertama 429: fallback ke model kedua dan berhasil
   - `quotaId` muncul di log
   - role function response `user`
2. Tes ke Gemini sungguhan: `triage("Tolong carikan pengacara ketenagakerjaan di Bandung.")`. Tool `siapkan_konsultasi` terpanggil, model pertama kena 503 lalu pindah ke model kedua, dan jawaban keluar normal.
3. `ruff check` bersih dan `import main` OK.

### Catatan

- `backend/evals/chatbot_policy_eval.py` dari commit `ae3a81f` belum diformat ruff, jadi `ruff format --check` di workflow Backend Lint akan gagal. Perlu dijalankan `ruff format evals/`.
- Saran yang belum dikerjakan:
  - pakai API key terpisah untuk eval
  - judul sesi dibuat dari potongan pesan pertama tanpa Gemini, hemat 1 request per sesi
  - kalau `quotaId` menunjukkan limit harian yang habis, solusinya billing atau pindah provider

---

## 2. Penghematan token Gemini

**Tanggal:** 27 Oktober 2026
**Status:** belum di-commit

### Masalah

Setiap pesan ke Kia memakai token yang cukup banyak. Di percakapan panjang, satu pesan bisa sampai ±13.700 token masuk. Ini bikin jatah token per menit cepat habis, jawaban lebih lambat, dan nanti lebih mahal kalau billing diaktifkan.

### Penyebab

Gemini tidak menyimpan percakapan. Jadi setiap kali user mengirim pesan, semua instruksi, riwayat chat, dan pasal dikirim ulang dari awal. Saya ukur pakai `count_tokens` dan ketemu beberapa sumber boros:

1. **Riwayat chat** dikirim sampai 30 pesan atau 60.000 huruf. Ini bagian terbesar di percakapan panjang.
2. **Pasal** dikirim 5 buah tanpa batas panjang. Ada pasal yang panjangnya 7.372 huruf (±2.000 token).
3. **Cari pengacara** memanggil Gemini 2 kali. Panggilan kedua cuma untuk menulis 1-3 kalimat, tapi tetap mengirim ulang seluruh riwayat.
4. **Deklarasi tool** (±350 token) ikut dikirim di semua pesan mode informasi, padahal permintaan advokat sudah ditangkap classifier.
5. **Batas panjang jawaban** sama untuk semua mode (2.048 token), termasuk untuk jawaban "sama-sama".
6. **Instruksi classifier** (767 token) dikirim di setiap pesan dan masih bisa dipadatkan.

### Perubahan

1. Riwayat yang dikirim dibatasi 10 pesan terakhir dan maksimal 12.000 huruf. Riwayat juga selalu diawali pesan user supaya urutan gilirannya tetap benar.
2. Pasal yang dikirim jadi 3 teratas, dan pasal yang lebih dari 2.000 huruf dipotong dengan penanda "(dipotong)". Batas kemiripan tetap 0,5. Saya sempat mau menaikkan ke 0,6, tapi setelah dicek ke data asli, kemiripan pasal biasanya cuma 0,56-0,63. Pertanyaan "pencemaran nama baik" nilai tertingginya 0,598, jadi dengan batas 0,6 Kia tidak dapat pasal sama sekali.
3. Mode rekomendasi konsultan cukup 1 panggilan Gemini (untuk mengisi data pencarian). Jawabannya dibuat dari template berdasarkan hasil pencarian: ada konsultan, konsultan dari kota lain, tidak ada konsultan (diarahkan ke LBH/Posbakum), atau error. Template ada versi formal dan kasual.
4. Deklarasi tool hanya dikirim di mode arahkan konsultasi dan rekomendasi konsultan. Mode tool `OTOMATIS` dihapus.
5. Batas panjang jawaban per mode: informasi 1.024, arahkan konsultasi 768, rekomendasi 512, penutup dan di luar topik 256. Kalau jawaban terpotong karena batas ini, ada warning di log.
6. Instruksi classifier dipadatkan dari 767 jadi 597 token. Aturannya tetap sama, cuma kalimatnya diringkas.

### File

| File | Perubahan |
|---|---|
| `backend/services/rag_service.py` | `MAX_HISTORY_MESSAGES`, `MAX_HISTORY_CHARS`, `MAX_PASAL_KONTEKS`, `MAX_CHARS_PER_PASAL`. `_smart_truncate` dibatasi jumlah pesan. `_potong` untuk pasal panjang. `agentic_generate` menerima `mode` dan `gaya`, dan berhenti setelah tool di mode rekomendasi. `_generate_config` menerima batas output. `_execute_tool` ikut mengembalikan `kategori`. |
| `backend/services/chat_policy.py` | `MAX_OUTPUT_TOKENS` per mode, `tool_mode(mode)` tanpa `OTOMATIS`, `rekomendasi_response()` dengan template formal dan kasual, prompt mode rekomendasi diringkas, `CLASSIFIER_PROMPT` dipadatkan. |

### Pengujian

1. **Pengukuran token** pakai `count_tokens`, dengan pasal asli dari database seukuran hasil pencarian "upah tidak dibayar":

   | Skenario | Sebelum | Sesudah | Hemat |
   |---|---|---|---|
   | Informasi, pesan ke-1 | 4.286 | 2.296 | 46% |
   | Informasi, pesan ke-5 | 6.099 | 4.109 | 33% |
   | Informasi, pesan ke-15 | 9.869 | 4.486 | 55% |
   | Minta nasihat, pesan ke-15 | 13.696 | 6.740 | 51% |
   | Cari pengacara, pesan ke-15 | 13.716 | 3.737 | 73% |
   | Penutup, pesan ke-15 | 6.948 | 3.385 | 51% |

2. **Tes offline**, 33 cek, semua lolos:
   - batas riwayat dan urutan giliran
   - pemotongan pasal
   - tool tidak dikirim di mode informasi
   - batas output per mode
   - semua cabang template rekomendasi
   - mode rekomendasi cukup 1 panggilan, mode arahkan tetap 2

   Tes retry dari entri 1 juga masih lolos.
3. **Tes ke Gemini sungguhan:**
   - informasi dengan riwayat 14 pesan: 4 pesan lama tidak dikirim, 3 pasal dipakai, jawaban tidak terpotong
   - cari pengacara: 1 panggilan dan jawaban dari template
   - minta nasihat: 2 panggilan, jawaban personal, tidak memilihkan jalur
4. **Eval classifier** (`python -m evals.chatbot_policy_eval --hanya-classifier`): 20/20 dengan prompt lama dan 20/20 dengan prompt yang dipadatkan.
5. Ruff 0.17.0 `check` dan `format --check` bersih, `import main` OK.

### Catatan

- Yang dikorbankan: Kia tidak lagi ingat detail yang diceritakan lebih dari 5 giliran sebelumnya, kecuali yang sudah masuk draft konsultasi. Kalau nanti terasa kurang, bisa ditambah ringkasan kasus yang diperbarui classifier.
- Jawaban mode rekomendasi sekarang selalu kalimat yang sama, tidak lagi ditulis bebas oleh Gemini.
- **Temuan lain di luar Gemini:** Voyage (layanan embedding untuk mencari pasal) masih dibatasi **3 request per menit** karena belum ada metode pembayaran di akun Voyage. Kalau lebih dari 3 user bertanya soal aturan dalam semenit, pencarian pasal akan gagal. Ini belum diperbaiki. Solusinya menambahkan metode pembayaran di dashboard Voyage; token gratisnya tetap berlaku.

---

## 3. Enhancement RAG: pencarian pasal, kebersihan data, dan cara mengukurnya

**Tanggal:** 27 Oktober 2026
**Status:** belum di-commit. Script pembersihan data belum dijalankan (lihat Catatan).

### Masalah

Saya cek isi knowledge base dan cara pencarian pasalnya. Ternyata masalah terbesarnya ada di data, bukan cuma di cara mencari:

1. 2.844 chunk (22%) isinya cuma "Pasal 40 Cukup jelas." Ini bagian Penjelasan UU yang ikut dipotong seolah-olah pasal.
2. Penjelasan yang ada isinya disimpan dengan label yang sama dengan bunyi pasalnya ("Pasal 13" muncul dua kali), jadi bisa dikutip Kia seolah-olah bunyi pasal.
3. Versi aturan bercampur. UU 13/2003 Pasal 78 bilang lembur maksimal 3 jam, versi Cipta Kerja bilang 4 jam, dan keduanya punya label yang sama.
4. Ada dokumen yang isinya dokumen lain. "UU SJSN" isinya Peraturan Bupati Pandeglang, dan "UU Penyandang Disabilitas" isinya keputusan Universitas Hasanuddin. UU 16/2019 (usia menikah 19 tahun) cuma berisi Preambule, sehingga Kia bisa menjawab pakai aturan lama (wanita 16 tahun).
5. Ada dokumen kembar (UU PDP, PP 17/2025, UU 1/2024, dan UU Pokok Agraria tiga kali) dan metadata rusak ("UU No. 0 Tahun 0", UU Pokok Agraria berkategori kekayaan intelektual).
6. Pencarian cuma pakai vektor. Nilai kemiripannya berdempetan (0,56-0,63), jadi susah membedakan pasal yang tepat. Pertanyaan "Pasal 156 UU Ketenagakerjaan" malah tidak dapat hasil sama sekali, dan KUHPerdata hampir tidak pernah ketemu karena bahasanya lama ("persetujuan" untuk perjanjian).
7. Belum ada cara mengukur kualitas pencarian, jadi tidak bisa membuktikan perubahan membuat hasil lebih baik.

### Perubahan

**Pengukuran (dikerjakan pertama):**
1. Test set 36 pertanyaan beserta pasal yang benar (`evals/retrieval_cases.json`). Semua pasal di test set saya cek satu per satu ada di database.
2. Script eval `evals/retrieval_eval.py`. Metriknya hit@1, hit@3, MRR, versi terbaru ikut terambil, porsi penjelasan, dan duplikat. Query dibuat sekali oleh classifier lalu disimpan, dan embedding query di-cache (satu request Voyage untuk semua query), jadi eval ini tidak makan kuota Gemini.

**Pencarian pasal baru (`services/retrieval_service.py`):**
1. **Pasal yang disebut langsung** ("Pasal 1365 KUHPerdata", "Pasal 27 UU ITE") diambil langsung dari database lewat daftar nama populer peraturan.
2. **Hybrid search:** hasil vektor digabung dengan pencarian kata kunci BM25 memakai Reciprocal Rank Fusion. BM25 dijalankan di backend dari korpus teks yang dimuat sekali per proses. Saya pilih cara ini karena backend tidak punya akses untuk membuat index atau fungsi SQL di Supabase, dan cara ini bisa langsung diukur.
3. Pemotong imbuhan sederhana ("mencuri", "pencurian", "dicuri" jadi "curi") dan sinonim kecil untuk bahasa hukum lama (perjanjian dan persetujuan, melawan dan melanggar, gaji dan upah).
4. **Penyaringan:**
   - chunk "Cukup jelas" tidak pernah dipakai
   - Preambule dan Pasal 1 (definisi) diturunkan peringkatnya, kecuali user memang tanya definisi
   - penjelasan diturunkan dan diganti bunyi pasalnya kalau keduanya terambil
   - isi kembar dibuang
   - panduan internal maksimal satu
5. **Versi terbaru diutamakan** lewat `data/perubahan_peraturan.json`. Kalau pasal dari UU lama terambil dan UU yang mengubahnya punya pasal bernomor sama dengan isi mirip, versi baru dimasukkan duluan. Versi lama diberi catatan "Versi lama". KUHP 1946, KUHAP 1981, dan UU Rumah Sakit diberi catatan "kemungkinan sudah tidak berlaku" dan statusnya ditandai perlu dikonfirmasi tim.
6. **Jujur kalau tidak ketemu:** kalau tidak ada pasal, konteksnya bilang "tidak ditemukan pasal yang relevan". Pasal yang lemah ditandai "kecocokan rendah". Prompt mode informasi menyuruh Kia bilang terus terang dan tidak menyebut nomor pasal.
7. **Cek kutipan:** setelah Gemini menjawab, nomor pasal di jawaban dicek. Kalau tidak ada di konteks, pertanyaan, atau riwayat, nomornya dicatat di `metadata.klasifikasi.kutipan_tanpa_sumber` dan disclaimer ditambah peringatan.
8. Korpus dimuat paralel (8 halaman sekaligus) dan hasil potong imbuhan di-cache. Waktu muat turun dari ±20 detik jadi ±4 detik. Pemuatannya juga dimulai di background bersamaan dengan classifier, jadi tidak terasa. Kalau korpus gagal dimuat, pencarian tetap jalan pakai vektor saja.

**Data dan pemotong dokumen:**
1. `helpers/penjelasan.py` mengenali bagian Penjelasan dengan dua cara: judul "PENJELASAN ATAS" (huruf kapital), atau nomor pasal kembali ke awal dan isinya berciri penjelasan. Cara ini akurat di 40+ dokumen yang saya cek.
2. `doc_processing.py` sekarang membuang "Cukup jelas", memberi label "Penjelasan Pasal N", dan mengenali "Pasal 1602a." (bertitik). Admin upload berikutnya otomatis ikut. Setiap admin mengubah dokumen, korpus pencarian dimuat ulang.
3. `tools/ingest_ulang_dokumen.py` mengisi ulang dokumen dari PDF resmi JDIH BPK. Sudah dijalankan:
   - UU 40/2004 SJSN: 20 chunk salah isi jadi 81 chunk
   - UU 8/2016 Disabilitas: 1 jadi 183 chunk
   - UU 16/2019: 1 jadi 5 chunk, Pasal 7 sekarang "19 tahun"

   PDF resmi UU SJSN dan UU Disabilitas juga sudah diupload ke Cloudinary (kecocokan isi 0,936 dan 0,916). Sekarang 76 dari 77 dokumen punya PDF.
4. `tools/bersihkan_dokumen_hukum.py` membackup seluruh tabel (dengan embedding), lalu menghapus 2.810 chunk "Cukup jelas" dan 212 chunk dokumen kembar, memberi label ulang 1.818 penjelasan, dan memperbaiki metadata. Ada mode `--dry-run` dan `--pulihkan`. **Belum dijalankan**, lihat Catatan.

### File

| File | Perubahan |
|---|---|
| `backend/services/retrieval_service.py` | Baru. Pencarian langsung, BM25, penggabungan, penyaringan, versi terbaru, korpus di memori. |
| `backend/helpers/penjelasan.py` | Baru. Deteksi bagian Penjelasan dan "Cukup jelas". |
| `backend/data/perubahan_peraturan.json` | Baru. Relasi UU lama ke UU yang mengubah atau menggantinya. |
| `backend/services/rag_service.py` | Pakai `cari_pasal`, konteks diberi tanda penjelasan, versi lama, dan kecocokan rendah, cek kutipan pasal, disclaimer menyebut pasal tanpa sumber, sumber mengikuti urutan pencarian. |
| `backend/services/chat_policy.py` | Prompt mode informasi: utamakan versi terbaru, bedakan penjelasan, jujur kalau tidak ketemu. |
| `backend/services/doc_processing.py` | Pemotong mengenali Penjelasan, membuang "Cukup jelas", dan menerima nomor pasal bertitik. |
| `backend/services/admin_doc_service.py` | Korpus pencarian dimuat ulang setiap upload, ubah, atau hapus dokumen. |
| `backend/repositories/legal_document_repository.py` | `list_all` mengambil seluruh chunk secara paralel. |
| `backend/tools/bersihkan_dokumen_hukum.py`, `backend/tools/ingest_ulang_dokumen.py` | Baru. Pembersihan data dan pengisian ulang dokumen. |
| `backend/evals/retrieval_eval.py`, `backend/evals/retrieval_cases.json`, `backend/evals/reports/retrieval-*.json` | Baru. Eval pencarian dan hasil sebelum/sesudah. |
| `backend/.gitignore` | Abaikan `evals/.cache/`. |

### Pengujian

1. **Eval pencarian** (36 pertanyaan, dijalankan pada data yang belum dibersihkan):

   | Metrik | Sebelum | Sesudah |
   |---|---|---|
   | hit@1 (pasal benar di urutan 1) | 41,7% | 72,2% |
   | hit@3 (pasal benar di 3 hasil) | 55,6% | 94,4% |
   | MRR | 0,486 | 0,829 |
   | Versi terbaru ikut terambil | 50,0% | 83,3% |
   | Porsi hasil yang ternyata penjelasan | 16,5% | 3,7% |
   | Hasil kembar | 4 | 0 |
   | Huruf dikirim per pertanyaan | 3.087 | 2.559 |

   Catatan jujur: daftar pasal relevan di 4 kasus saya perluas setelah dicek manual (hak korban TPKS Pasal 69-70, pencurian Pasal 479, penganiayaan ringan Pasal 471, kewajiban pengendali data Pasal 36 dan 47). Angka "sebelum" sudah saya hitung ulang dengan daftar yang sama, hasilnya tetap 55,6%. Sinonim dan aturan pemotong imbuhan juga disusun sambil melihat kasus yang meleset, jadi angka ini bisa sedikit lebih bagus daripada pertanyaan yang benar-benar baru. Yang masih meleset: hak pesangon PHK dan kerahasiaan rekam medis.
2. **Tes offline**, 38 cek, semua lolos: pemotong imbuhan, deteksi penjelasan, pemotong dokumen, pencarian dengan korpus buatan (pasal langsung, sinonim, Preambule turun, versi terbaru di atas versi lama), tanda di konteks, urutan sumber, cek kutipan, disclaimer. Tes token (33) dan retry (11) dari entri sebelumnya juga masih lolos.
3. **Tes ke Gemini sungguhan:**
   - "usia minimal menikah": dijawab 19 tahun dari UU 16/2019
   - "maksimal lembur": dijawab 4 jam dari Cipta Kerja
   - "bunyi Pasal 1365 KUHPerdata": dikutip persis
   - tidak ada pasal yang disebut tanpa sumber
4. Ruff 0.17.0 `check` dan `format --check` bersih, `import main` OK.

### Catatan

- **Script pembersihan belum dijalankan.** Pengaman otomatis di Claude Code menolak penghapusan massal di database, dan memang sebaiknya tim tahu dulu karena database ini dipakai bersama. Pencarian baru sudah aman walaupun data belum dibersihkan, karena chunk "Cukup jelas" dan penjelasan dideteksi saat korpus dimuat. Tapi halaman Basis Pengetahuan dan panel sumber masih menampilkan label lama. Cara menjalankannya dari folder `backend`:
  ```
  python tools/bersihkan_dokumen_hukum.py --dry-run
  python tools/bersihkan_dokumen_hukum.py --backup-dir "C:/Users/Danish/Documents/LangkahLegal_backup"
  ```
  Kalau ada yang salah: `python tools/bersihkan_dokumen_hukum.py --pulihkan <file backup>`.
- **Hybrid search versi database (SQL) tidak saya buat**, karena tidak bisa dites dari sini. BM25 di backend cukup untuk ±10 ribu chunk (2 ms per pencarian, 40 MB memori). Kalau data nanti jauh lebih besar, baru perlu dipindah ke full-text search Postgres.
- Di Vercel, korpus dimuat per instance. Instance baru menambah ±4 detik di pesan pertama (sebagian tertutup waktu classifier), dan perubahan dokumen dari admin terbaca instance lain paling lambat 30 menit kemudian.
- Status KUHP 1946, KUHAP 1981, dan UU Rumah Sakit di `perubahan_peraturan.json` ditandai `perlu_konfirmasi`. Mohon dicek teman yang paham hukum sebelum dianggap pasti.
- Masih ada 9 dokumen yang cuma berisi Preambule (misalnya PP 36/2021 Pengupahan, UU 31/2014 Perlindungan Saksi dan Korban, KHI). Bisa diisi dengan `tools/ingest_ulang_dokumen.py`, tapi tiap dokumen butuh beberapa menit karena limit Voyage.

---

## 4. Seeding konsultan demo untuk menguji rekomendasi konsultan

**Tanggal:** 28 Oktober 2026
**Status:** script belum di-commit, tetapi data sudah masuk ke database.

### Masalah

Untuk mengerjakan rencana rekomendasi konsultan (kategori diasumsikan AI, hanya konsultan terverifikasi, tanya budget dan jadwal), datanya belum memadai untuk dites:

1. Hanya 5 dari 28 konsultan yang terverifikasi, dan sebagian besar akun uji atau profil kosong (tarif dan kota kosong).
2. Kategori Ketenagakerjaan, Teknologi Informasi, dan HAM tidak punya konsultan sama sekali.
3. Tidak ada satu pun konsultan terverifikasi yang punya jadwal ke depan, jadi pencocokan jadwal tidak bisa diuji.

### Perubahan

`backend/tools/seed_konsultan_demo.py` membuat 14 konsultan demo lengkap: akun Supabase Auth, baris `users` (role konsultan), profil `konsultan` (gelar, pendidikan, kota, pengalaman, tarif, bio, deskripsi), dan jadwal berulang mingguan selama 6 minggu ke depan. Profilnya fiktif, bukan data orang sungguhan, dan nomor izin praktiknya berawalan `DEMO-`. Email akun berawalan `demo.konsultan.` supaya gampang dikenali dan dihapus.

Variasinya disusun untuk menguji AI:

| Konsultan | Kategori | Kota | Tarif | Pola jadwal |
|---|---|---|---|---|
| Rina Kartikasari | Ketenagakerjaan | Bandung | Rp150.000 | Senin-Jumat malam 19.00-21.00 |
| Bayu Prasetyo Nugroho | Ketenagakerjaan | Jakarta Selatan | Rp250.000 | Sabtu-Minggu 09.00-15.00 |
| Dr. Hendra Wirawan Siregar | Ketenagakerjaan | Jakarta Pusat | Rp750.000 | Selasa dan Kamis pagi saja |
| Dimas Aryo Wicaksono | Pidana | Surabaya | Rp200.000 | Senin-Jumat 09.00-16.00 |
| Natalia Simanjuntak | Pidana | Jakarta Barat | Rp500.000 | Senin dan Rabu malam, Sabtu pagi |
| Sri Wahyuningsih | Perdata | Yogyakarta | Rp175.000 | Senin, Rabu, Jumat pagi |
| Fajar Nugraha Putra | Perdata | Bandung | Rp350.000 | Senin-Sabtu siang 13.00-17.00 |
| Ayu Lestari Paramita | HAM | Bandung | Rp75.000 | Hari kerja 10.00-14.00, Sabtu pagi |
| Maria Goretti Tambunan | HAM | Jakarta Timur | Rp300.000 | Selasa dan Kamis malam, Minggu siang |
| Kevin Hartanto | Teknologi Informasi | Jakarta Selatan | Rp450.000 | Hari kerja malam 20.00-22.00 |
| Muhammad Rizky Harahap | Umum | Medan | Rp125.000 | Senin-Sabtu pagi dan siang (dua blok) |
| Andi Fitriani Rahman | Umum | Makassar | Rp250.000 | Tanpa jadwal (uji label "belum ada jadwal") |
| Yoga Pratama Saputra | Ketenagakerjaan | Bandung | Rp50.000 | Akun kontrol: **pending**, jadwal penuh |
| Lukas Adiwijaya | Pidana | Bandung | Rp100.000 | Akun kontrol: terverifikasi tapi **nonaktif** |

Dua akun kontrol sengaja dibuat paling menggoda (paling murah, jadwal paling lengkap). Kalau salah satunya muncul di rekomendasi AI, berarti filter verifikasi atau `is_active` tidak bekerja.

### Pengujian

1. `--dry-run` dulu untuk mengecek profil dan jumlah slot, lalu dijalankan: 14 konsultan (id 131-144) dan 384 slot jadwal masuk.
2. RPC `search_consultants_by_category` sekarang mengembalikan konsultan di semua 6 kategori. Kedua akun kontrol tidak pernah muncul.
3. Endpoint production `GET /consultants/131/available-slots?tanggal=2026-11-02&durasi=60` mengembalikan slot 19.00-21.00 berstatus `available`.
4. Script dijalankan ulang dan menambah 0 jadwal, jadi aman dipakai untuk memperpanjang jadwal.

### Catatan

- **Database lokal sama dengan production.** Katalog di `langkah-legal-t87u.vercel.app` menampilkan konsultan dengan id yang sama. Konsultan demo ini tampil di katalog publik dan bisa dipesan. Dijalankan tanpa penanda "[Akun demo]" di bio, sesuai keputusan Danish. Midtrans di `.env` lokal masih sandbox, tetapi setting di Vercel belum dicek.
- Menghapus semua akun demo: `python tools/seed_konsultan_demo.py --hapus`.
- Jadwal berlaku 6 minggu dari 28 Oktober 2026. Untuk memperpanjang, jalankan ulang script-nya.
- Kategori Ketenagakerjaan, Teknologi Informasi, dan HAM belum ada di dropdown spesialisasi frontend (yang ada baru Umum, Pidana, Perdata). Ini masuk tahap 2 rencana rekomendasi konsultan. (Sudah dikerjakan di entri 5.)

---

## 5. Rekomendasi konsultan: kategori diasumsikan AI, hanya yang terverifikasi, tanya budget dan jadwal

**Tanggal:** 28 Oktober 2026
**Status:** belum di-commit

### Masalah

1. AI memang memilih kategori lewat tool, tetapi tidak pernah memberi tahu user, dan tidak ada cadangan kalau kategori itu kosong.
2. Pencarian konsultan memakai RPC Supabase `search_consultants_by_category`. Aturan "hanya yang terverifikasi" ada di dalam RPC itu, tidak kelihatan di kode dan tidak bisa dites.
3. AI tidak pernah menanyakan budget dan jadwal. Budget cuma dipakai kalau user kebetulan menyebutnya, dan jadwal konsultan sama sekali tidak dipakai.
4. Ketemu dua bug jadwal waktu mengerjakan ini:
   - endpoint slot (`get_available_slots`) cuma membaca blok jadwal pertama per tanggal (`limit(1)`), jadi blok siang untuk konsultan yang punya blok pagi dan siang tidak pernah tampil
   - saat memesan, halaman konsultan memakai baris jadwal pertama di tanggal itu, jadi pemesanan di blok kedua ditolak backend dengan "Jam di luar rentang operasional"
5. Frontend cuma mengenal 3 spesialisasi (Umum, Pidana, Perdata), padahal AI memakai 6.

### Keputusan (dari Danish)

1. AI bertanya budget dan jadwal dulu, baru menampilkan kartu konsultan. Ada tombol "Lewati".
2. Berlaku untuk "carikan pengacara" dan juga "minta nasihat" (yang membuat draft kasus).
3. Budget diisi sendiri oleh user lewat input minimal dan maksimal, bukan tombol rentang.
4. Konsultan tanpa jadwal tetap ditampilkan dengan label "Belum ada jadwal".

### Perubahan

**Backend:**
1. `consultant_repository.list_recommendable` menggantikan RPC. Syaratnya ditulis jelas di kode: `status_verifikasi = 'terverifikasi'` dan `is_active = true`. Fungsi RPC lama (`search_by_category`) dihapus dari repository.
2. `services/konsultan_matching.py` memilih maksimal 3 konsultan berdasarkan kategori, budget, kota, dan slot jadwal nyata (14 hari ke depan, booking aktif ikut diperhitungkan). Kalau tidak ada yang cocok, syaratnya dilonggarkan bertahap dan setiap pelonggaran ditandai:
   - kategori kosong: pakai konsultan Umum
   - tidak ada tarif dalam budget: tampilkan tarif paling dekat
   - tidak ada slot di waktu yang diminta: tampilkan slot terdekat
   - tidak punya jadwal: tetap tampil dengan status `belum_ada`

   Slot yang ditampilkan paling banyak satu per tanggal, supaya pilihannya tersebar di hari yang berbeda. Penulisan spesialisasi yang belum seragam ("Hukum Pidana", "Pidana") dinormalisasi.
3. `helpers/preferensi.py` mengubah pilihan hari (besok, sabtu, akhir pekan, minggu depan, dan seterusnya) jadi tanggal nyata dan waktu (pagi 06-12, siang 12-15, sore 15-18, malam 18-22) jadi rentang jam. Dikerjakan oleh kode, bukan Gemini, supaya tanggalnya tidak salah.
4. Classifier sekarang juga mengisi `budget_min`, `budget_max`, `hari`, dan `waktu` kalau user menyebutnya. Ada aturan bahwa jumlah uang dalam cerita kasus (gaji, utang) bukan budget, dan jawaban user setelah Kia bertanya dianggap lanjutan permintaan konsultan.
5. Alur di `rag_service.triage`:
   - mode rekomendasi atau arahkan, dan belum ada preferensi di sesi: tool tetap dipanggil untuk menentukan kategori, kota, dan draft kasus, tetapi konsultan belum dicari. Kia menjawab dengan tipe baru `tanya_preferensi` beserta `form_preferensi` (kategori asumsi dan pilihan hari/waktu). Untuk mode rekomendasi pertanyaannya dari template, jadi tidak ada panggilan Gemini kedua. Untuk mode arahkan, penjelasan dari Gemini tetap ada lalu pertanyaannya ditambahkan di belakang.
   - user mengirim form (field `preferensi` di request): langsung mencari konsultan memakai kategori, kota, dan draft yang disimpan di pesan Kia sebelumnya. Tidak ada panggilan Gemini sama sekali.
   - preferensi disimpan di metadata pesan user, jadi Kia tidak bertanya lagi di sesi yang sama. Kalau user menyebut preferensi baru, preferensi lama ditimpa per kelompok (budget, atau hari dan waktu). "Yang bisa malam" setelah "sabtu pagi" berarti malam hari apa saja, bukan Sabtu malam.
6. Jawaban rekomendasi tetap dari template, tetapi sekarang menjelaskan setiap pelonggaran (kategori, budget, kota, jadwal) dengan versi formal dan kasual.
7. Endpoint slot membaca semua blok jadwal per tanggal.

**Frontend:**
1. `AIPreferenceForm.jsx`: dropdown kategori (terisi asumsi Kia), input budget minimal dan maksimal (validasi minimal ≤ maksimal), tombol pilihan hari dan waktu, tombol "Cari konsultan" dan "Lewati". Isiannya dikirim sebagai `preferensi` plus satu kalimat ringkasan, supaya riwayat chat tetap terbaca. Form hanya aktif di pesan terakhir.
2. `AIConsultantCard.jsx` menampilkan "Jadwal yang cocok", "Jadwal terdekat", "Jadwal tersedia", atau "Belum ada jadwal", beserta tombol slot. Klik slot membuka halaman konsultan dengan `?tanggal=&mulai=&selesai=`.
3. Halaman konsultan (`explore/[id]`) memilih tanggal dan jam dari URL secara otomatis, dan saat memesan memakai blok jadwal yang memuat jam yang dipilih.
4. Dropdown spesialisasi di profil konsultan dan filter katalog sekarang berisi 6 kategori yang sama dengan AI.

### Pengujian

1. **Tes offline** (Gemini dan database palsu), 70 cek, semua lolos:
   - konversi hari ke tanggal
   - normalisasi kategori
   - filter budget dan semua jenis pelonggaran
   - satu slot per tanggal
   - template jawaban
   - penggabungan preferensi
   - alur tanya → form → hasil (form tidak memanggil Gemini, tidak bertanya ulang di sesi yang sama, preferensi di pesan pertama langsung dipakai, mode nasihat tetap dengan penjelasan dan draft)

   Tes token, retry, dan retrieval dari entri sebelumnya juga masih lolos.
2. **Eval ekstraksi preferensi** (`python -m evals.preferensi_eval`): 11/11, termasuk "gaji 5 juta" dan "utang 20 juta" yang tidak dianggap budget. Eval classifier lama tetap 20/20.
3. **Ujung ke ujung ke Gemini dan database sungguhan** dengan konsultan demo:
   - cerita gaji lalu "carikan pengacara": Kia bertanya dengan asumsi ketenagakerjaan dan menyiapkan draft
   - form Rp100-300rb, Sabtu pagi: selesai dalam 2,1 detik tanpa Gemini, Bayu (Sabtu pagi) di atas dan Rina diberi jadwal terdekat
   - "minta nasihat" menghasilkan penjelasan plus pertanyaan, lalu "Lewati" menampilkan konsultan pidana
   - akun kontrol (pending dan nonaktif) tidak pernah muncul
4. **Endpoint slot**: konsultan dua blok (Rizky) sekarang menampilkan blok pagi dan siang.
5. **SIT Tanya AI**: 18 dari 19 lolos, termasuk 3 skenario baru:
   - AI-016: form → preferensi terkirim → slot cocok → halaman konsultan terbuka dengan slot terpilih
   - AI-017: lewati
   - AI-018: budget minimal lebih besar dari maksimal ditolak

   Yang gagal adalah AI-009 (tombol jawaban cepat "punya bukti"), karena tombol itu dikomentari di commit `ae3a81f` sebelum perubahan ini.
6. **SIT profil dan katalog konsultan**: 17 lolos, 8 gagal. Yang gagal bukan karena perubahan ini:
   - 6 skenario profil konsultan: selector jadwal lama `!w-16` (masalah lama dari commit `f6e00bc`)
   - EXP-004: timeout karena server lambat, lolos saat diulang
   - EXP-005: Cloudflare di depan Supabase memblokir kata kunci tes yang mirip perintah SQL
7. Ruff `check` bersih, `import main` OK, `next build` berhasil.

### Catatan

- Setiap alur pencarian konsultan sekarang butuh satu giliran tambahan, tetapi giliran kirim form tidak memanggil Gemini, jadi biaya tambahannya cuma satu panggilan classifier di pesan pertama.
- Konsultan dengan tarif kosong tidak masuk hasil kalau user mengisi budget, karena tarifnya tidak bisa dibandingkan.
- RPC `search_consultants_by_category` masih ada di Supabase tetapi tidak dipakai lagi oleh backend.
