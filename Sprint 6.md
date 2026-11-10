# Sprint 6

Catatan perubahan yang saya kerjakan selama Sprint 6. Setiap perubahan ditulis apa yang diubah, kenapa, file mana saja, dan bagaimana ngetesnya. Entri terbaru ditaruh paling bawah.

---

## 1. Menyamarkan data pribadi sebelum dikirim ke Gemini

**Tanggal:** 9 November 2026
**Branch:** `AI-Enhancement`
**Status:** belum di-commit

### Masalah

Semua pesan klien dikirim mentah ke Gemini, termasuk nama, NIK, nomor HP, email, dan nomor rekening kalau klien menyebutnya di cerita kasus. Ada tiga tempat pengirimannya:
- classifier (`chat_policy.classify`)
- pembuatan jawaban dan tool (`rag_service.agentic_generate`)
- pembuatan judul sesi (`chat_service._auto_generate_title`)

Waktu classifier gagal, query mentah juga dikirim ke Voyage untuk embedding. Selain itu `rag_service.py` menulis 100 karakter pertama setiap pesan klien ke log server, jadi data pribadi juga ada di log Vercel.

### Keputusan (dari Danish)

1. Yang disamarkan adalah data yang polanya jelas, ditambah nama yang punya penanda ("nama saya ...", "Pak ...", "Bu ..."). Tidak pakai model NER karena terlalu berat untuk Vercel.
2. Placeholder dikembalikan ke data asli di backend, jadi klien dan konsultan tetap melihat nama dan nomor yang asli.

### Perubahan

1. `helpers/pii.py` (baru) berisi kelas `Penyamar`. Satu `Penyamar` dipakai untuk satu request:
   - `samarkan_percakapan(query, history)` mengganti data pribadi dengan placeholder seperti `[NAMA_1]` atau `[TELEPON_1]`. Nilai yang sama selalu dapat placeholder yang sama, jadi model tetap tahu siapa yang dibicarakan di sepanjang riwayat.
   - Nama dikumpulkan dari semua pesan dulu baru disamarkan. Jadi kalau klien baru memperkenalkan namanya di pesan ketiga, nama itu juga tersamar di pesan pertama dan kedua.
   - `pulihkan()` mengembalikan placeholder ke nilai asli. Placeholder tanpa kurung siku (`NAMA_1`) juga dikenali, karena model kadang membuang kurungnya.
   - `ringkasan()` mengembalikan jumlah data pribadi per jenis tanpa nilainya, untuk log.
2. Yang disamarkan: email, nomor rekening/VA (dikenali dari kata "rekening", "norek", "VA"), nomor kartu, NIK 16 digit, nomor HP (`08..`, `+62..`, `62..`), nomor panjang lain minimal 10 digit (BPJS, polis), plat nomor, alamat jalan, dan nama setelah penanda.
3. Yang sengaja tidak disentuh:
   - nominal uang, karena classifier butuh "300rb" atau "1 juta" untuk budget
   - nomor UU dan pasal ("UU 13/2003", "Pasal 1365"), karena dipakai pencarian pasal
   - tanggal dan jam
   - jabatan setelah sapaan ("Pak RT", "Bu Lurah", "Pak Polisi") dan "Bapak/Ibu" di jawaban Kia
4. `rag_service.triage` sekarang menyamarkan query dan riwayat di awal. Isi lamanya dipindah ke `_triage`, yang hanya melihat teks tersamar. Hasil akhirnya (jawaban, draft konsultasi, konteks konsultasi) dipulihkan sebelum dikembalikan. Akibatnya:
   - Gemini dan Voyage tidak pernah menerima data asli
   - pesan yang disimpan di `chat_messages`, kartu draft, dan `deskripsi_kasus` untuk konsultan tetap berisi data asli
   - log `[TRIAGE] Query masuk` sekarang menulis versi tersamar
5. Prompt classifier dan prompt Kia diberi satu aturan tambahan: placeholder adalah data pribadi yang disamarkan, tulis ulang persis seperti itu dan jangan ditebak. Tujuannya supaya model menyalin `[NAMA_1]` dengan utuh ke `ringkasan_kasus`.
6. Judul sesi juga dibuat dari pesan yang tersamar, lalu dipulihkan sebelum disimpan.

### File

| File | Perubahan |
|---|---|
| `backend/helpers/pii.py` | Baru. Pola data pribadi, pengenalan nama, kelas `Penyamar`. |
| `backend/services/rag_service.py` | `triage()` menyamarkan dan memulihkan, isi lama pindah ke `_triage()`. |
| `backend/services/chat_policy.py` | Aturan placeholder di `CLASSIFIER_PROMPT` dan `BASE_PROMPT`. |
| `backend/services/chat_service.py` | Judul sesi dibuat dari teks tersamar. |
| `backend/evals/pii_eval.py` | Baru. Eval offline penyamaran. |

### Pengujian

1. `python -m evals.pii_eval` (offline, tanpa Gemini): 53/53 cek lolos.
   - 17 teks berisi data pribadi: semua tersamar dan bisa dipulihkan persis ke teks aslinya
   - 14 teks yang harus utuh (nomor UU, pasal, nominal uang, tanggal, "Pak RT", "Bu Lurah", "Bapak/Ibu", "Ibu Kota") tidak berubah
   - nama yang baru disebut di pesan terakhir ikut tersamar di riwayat, metadata riwayat tidak berubah
   - placeholder tanpa kurung tetap dipulihkan
2. Tes alur dengan Gemini palsu yang merekam semua teks yang dikirim: 4 panggilan (classifier, tool, jawaban, judul) dan tidak ada satu pun yang berisi nama, HP, NIK, atau email asli. Jawaban, draft, dan judul yang disimpan berisi data asli lagi.
3. Tes ke Gemini sungguhan dengan pesan "Nama saya Rina Kartika, HP 0813..., atasan saya Pak Hendra Wijaya tidak membayar gaji ... lapor polisi atau damai?":
   - Gemini menerima `Nama saya [NAMA_2], HP [TELEPON_1] ... Pak [NAMA_1]`
   - model menulis ringkasan kasus dengan placeholder yang utuh
   - draft yang sampai ke klien: "Saya Rina Kartika ... atasan saya, Pak Hendra Wijaya"
4. `python -m evals.preferensi_eval` ke Gemini sungguhan setelah prompt classifier ditambah aturan placeholder: tetap 11/11.
5. Ruff `check` dan `format --check` bersih, `import main` OK.

### Catatan

- Nama tanpa penanda tidak dikenali, misalnya "Halo, saya Andi dari Bandung". Kalau mau lebih lengkap harus pakai model NER, tapi itu berat untuk Vercel.
- Nama perusahaan ("PT Maju") dan nama kota tidak disamarkan, karena kota dipakai untuk mencari konsultan.
- Peta placeholder tidak disimpan. Riwayat dimuat ulang dari database setiap giliran lalu disamarkan ulang, jadi penomoran cukup konsisten dalam satu request.

---

## 2. Log setiap request chatbot ke Supabase Storage

**Tanggal:** 9 November 2026
**Branch:** `AI-Enhancement`
**Status:** belum di-commit

### Masalah

Tidak ada jejak per request chatbot. Kalau user komplain jawabannya aneh atau lambat, kita tidak bisa tahu:
- model mana yang menjawab
- berapa token yang dipakai
- berapa lama tiap langkah
- kenapa gagal

Log server cuma teks bebas di Vercel tanpa ID, jadi log dari request yang berbeda bercampur. Jalur "server sibuk" (429/503) juga tidak tercatat sama sekali karena tidak dianggap error.

### Keputusan (dari Danish)

Log disimpan di storage, dan teks pesan yang dicatat adalah versi tersamar (persis yang dilihat Gemini), plus metadata. Teks asli tetap hanya ada di tabel `chat_messages`.

### Perubahan

1. **Request ID.** `middleware/request_id.py` (baru) memberi setiap request ID unik dan mengembalikannya di header `X-Request-ID`. Format log server di `main.py` sekarang ikut menampilkan ID ini, jadi semua baris log dari satu request bisa dicari bareng.
2. **Pengumpul jejak.** `services/chat_log_service.py` (baru) mengumpulkan jejak satu request lewat `ContextVar`, jadi fungsi lain cukup memanggil `catat(...)` atau `catat_gemini(...)` tanpa harus meneruskan objek ke mana-mana. Setiap panggilan Gemini dicatat: langkah (`classify`, `agent`, `judul`), model, latency, token (prompt, output, total), `finish_reason`, dan error.
3. **Isi satu file log:**
   - `request_id`, waktu, durasi total, status (`ok`, `overload`, `error`, `ditolak`)
   - `user_id`, `session_id`, sesi baru atau bukan
   - request: query tersamar, kategori, preferensi, panjang riwayat
   - jumlah data pribadi per jenis (tanpa nilainya)
   - klasifikasi (intent, mode, gaya, fallback, pasal tanpa sumber)
   - pasal yang ditemukan (id dokumen, nama UU, pasal, skor)
   - daftar panggilan Gemini
   - respons: tipe, jawaban tersamar, draft tersamar, jumlah konsultan
   - error: langkah yang gagal dan pesannya
4. **Penyimpanan.** File JSON diunggah ke bucket privat `chat-logs` dengan path `{tahun}/{bulan}/{tanggal}/{session_id}/{jam}-{request_id}.json`. Unggahan berjalan sebagai `BackgroundTasks` setelah respons terkirim, jadi user tidak menunggu. Kalau unggahan gagal (misalnya bucket belum ada), yang muncul cuma warning di log dan chat tetap jalan.
5. **Konfigurasi.** Env baru `SUPABASE_CHAT_LOG_BUCKET` (default `chat-logs`) dan `CHAT_LOG_ENABLED` (default `true`, isi `false` untuk mematikan log).
6. **Tools:**
   - `tools/siapkan_bucket_chat_log.py` membuat bucket privat. Aman dijalankan ulang, dan memberi peringatan kalau bucket-nya ternyata publik.
   - `tools/bersihkan_chat_log.py --hari 30 [--dry-run]` menghapus log yang lebih tua dari N hari. Log sudah tersamar, tapi tetap berisi cerita kasus, jadi sebaiknya tidak disimpan selamanya.

### File

| File | Perubahan |
|---|---|
| `backend/middleware/request_id.py` | Baru. Middleware `X-Request-ID` dan filter log. |
| `backend/main.py` | Memasang middleware dan menambah request ID ke format log. |
| `backend/services/chat_log_service.py` | Baru. Pengumpul jejak dan unggahan ke storage. |
| `backend/services/chat_service.py` | `run_triage` memulai jejak, mencatat status (termasuk overload dan error), lalu menyerahkan unggahan ke `BackgroundTasks`. |
| `backend/routers/chatbot.py` | Endpoint `/triage` menerima `BackgroundTasks`. |
| `backend/services/rag_service.py`, `chat_policy.py` | Mencatat setiap panggilan Gemini dan pasal yang ditemukan. |
| `backend/core/config.py`, `backend/.env.example` | Dua env baru. |
| `backend/tools/siapkan_bucket_chat_log.py`, `bersihkan_chat_log.py` | Baru. |
| `backend/docs/chatbot.py` | Dokumentasi endpoint: penyamaran data dan `X-Request-ID`. |

### Pengujian

1. Header: request tanpa `X-Request-ID` mendapat ID baru, ID yang dikirim client diteruskan, dan ID yang tidak valid (ada spasi atau baris baru) diganti.
2. Jalur sukses dengan Gemini palsu: log berisi 4 panggilan Gemini dengan token dan latency, query dan jawaban tersamar, dan tidak ada nama, HP, NIK, atau email asli di seluruh isi log.
3. Jalur overload (semua model 429): klien tetap dapat pesan "sistem sedang sibuk", dan log tercatat dengan `status: overload` beserta 4 percobaan model yang gagal.
4. Jalur error (database gagal): log tercatat dengan `status: error` dan langkah `load_history`.
5. Unggahan ke bucket yang belum ada: hanya warning `Bucket not found`, tidak ada exception.
6. Tes ke Gemini sungguhan (entri 1): token per panggilan tercatat, yaitu classifier 1.048, tool 1.251, dan jawaban 1.544 token.

### Catatan

- Bucket `chat-logs` belum dibuat di Supabase. Selama belum dibuat, log tidak tersimpan tetapi chat tetap jalan. Cara membuatnya: `python tools/siapkan_bucket_chat_log.py`.
- Database dan storage lokal sama dengan production, jadi log dari laptop dan dari Vercel masuk ke bucket yang sama.
- Log hanya dibuat untuk `/chatbot/triage`, belum untuk endpoint lain.
