# Sprint 7

Catatan perubahan yang saya kerjakan selama Sprint 7. Setiap perubahan ditulis apa yang diubah, kenapa, file mana saja, dan bagaimana ngetesnya. Entri terbaru ditaruh paling bawah.

---

## 1. Perbaikan bug dari review AI dan dokumen

**Tanggal:** 24 November 2026
**Branch:** `fix/ai-review` (dibuat dari `feat/vulnerability`, karena bug nomor 2 hanya ada di branch itu)
**Status:** belum di-commit

### Latar belakang

Saya melakukan review menyeluruh untuk bagian AI (backend chatbot), urusan dokumen dan file, dan halaman chat di frontend. Temuan yang paling penting saya cek ulang langsung di kode sebelum diperbaiki. Entri ini berisi bug yang sudah terbukti ada. Perbaikan kualitas AI ada di entri 2, perbaikan chat di frontend ada di entri 3.

### Masalah, penyebab, dan perbaikannya

1. **Kia hanya membaca 30 pesan pertama sesi, bukan 30 terakhir.**
   - Penyebab: `chat_repository.list_history` mengurutkan pesan dari yang terlama lalu mengambil 30, jadi yang terambil justru pesan paling awal. Setelah percakapan lewat 30 pesan, Kia tidak melihat pesan terbaru, dan form budget/jadwal tidak dikenali karena kode mencari pertanyaan Kia di pesan lama.
   - Perbaikan: ambil 30 pesan terbaru (urutan menurun), lalu dibalik lagi di Python supaya urutannya tetap dari lama ke baru.
2. **Middleware request ID hilang saat merge.**
   - Penyebab: baris `app.middleware("http")(pasang_request_id)` terhapus di merge `86821c8` (branch `feat/vulnerability`), padahal di `dev` masih ada. Akibatnya semua log berisi `[-]` dan header `X-Request-ID` tidak keluar.
   - Perbaikan: baris itu dikembalikan di `main.py`.
3. **Log request yang error tidak pernah terunggah ke bucket `chat-logs`.**
   - Penyebab: FastAPI hanya menjalankan `BackgroundTasks` kalau endpoint selesai normal. Kalau `run_triage` raise error, task unggah log ikut dibuang. Padahal log error yang paling dibutuhkan.
   - Perbaikan: kalau request gagal, log diunggah langsung sebelum error diteruskan. Kalau sukses, tetap lewat `BackgroundTasks`.
4. **Chat langsung error 500 kalau Voyage gagal.**
   - Penyebab: `embed_query` di `retrieval_service.cari_pasal` tidak dibungkus try/except. Voyage gratis cuma 3 request per menit untuk seluruh aplikasi, jadi pertanyaan ke-4 dalam semenit langsung error.
   - Perbaikan: kalau embedding atau pencarian vektor gagal, pencarian tetap jalan lewat kata kunci (BM25). Kegagalannya dicatat di log (`vektor_gagal`).
5. **Endpoint chatbot `async def` tapi isinya blocking.**
   - Penyebab: satu chat bisa 5-20 detik (panggilan Gemini, Supabase, Voyage, dan `time.sleep` saat retry), dan selama itu event loop terblokir sehingga request lain ikut menunggu.
   - Perbaikan: kelima endpoint di `routers/chatbot.py` diganti jadi `def` biasa, jadi FastAPI menjalankannya di threadpool. Sudah dicek bahwa request ID (ContextVar) tetap terbawa ke thread.
6. **Klaim bursa kasus bisa dobel.**
   - Penyebab: status kasus dicek dulu, baru di-update di query terpisah. Dua konsultan yang klaim bersamaan bisa sama-sama lolos cek, sama-sama dapat konsultasi, dan sama-sama bisa melihat dokumen privat klien.
   - Perbaikan: `case_repository.update_if_status` menutup kasus hanya kalau statusnya masih `open`, dalam satu query. Yang kalah dapat pesan "sudah diklaim". Kalau pembuatan konsultasi gagal (termasuk exception), kasus dibuka lagi.
7. **Portofolio bisa diarahkan ke file konsultan lain.**
   - Penyebab: `_stored_portofolio` menerima path storage apa pun. Konsultan bisa mengisi path portofolio konsultan lain dan admin akan memverifikasi file itu.
   - Perbaikan: path storage hanya diterima kalau ada di folder miliknya sendiri (`konsultan/{id_user}/`) dan tidak mengandung `..`. Link https tetap boleh.
8. **Content-Type file gambar diambil dari client.**
   - Penyebab: untuk dokumen pendukung dan avatar, `file.content_type` dari browser disimpan apa adanya. File GIF yang isinya HTML bisa disimpan sebagai `text/html`, lalu terbuka sebagai halaman web lewat signed URL.
   - Perbaikan: Content-Type ditentukan dari ekstensi yang sudah lolos cek magic bytes (`IMAGE_CONTENT_TYPES`), tidak pernah dari client.

### File

| File | Perubahan |
|---|---|
| `backend/repositories/chat_repository.py` | `list_history` mengambil pesan terbaru. |
| `backend/main.py` | Middleware request ID dipasang lagi. |
| `backend/services/chat_service.py` | Log diunggah langsung saat request gagal. |
| `backend/services/retrieval_service.py` | Fallback ke BM25 saat Voyage gagal. |
| `backend/routers/chatbot.py` | Endpoint jadi `def`. |
| `backend/repositories/case_repository.py`, `backend/services/case_service.py` | Klaim bursa dengan update bersyarat. |
| `backend/services/user_service.py` | Path portofolio dibatasi ke folder sendiri. |
| `backend/services/storage_service.py` | Content-Type dari ekstensi. |

---

## 2. Perbaikan kualitas AI

**Tanggal:** 24 November 2026
**Branch:** `fix/ai-review`
**Status:** belum di-commit

### Masalah, penyebab, dan perbaikannya

1. **Saat classifier Gemini gagal (misalnya kuota habis), guardrail melemah.**
   - Kata krisis dicocokkan sebagai potongan teks, jadi "bunuh" juga cocok dengan "pembunuhan", "diancam" cocok dengan "diancam pidana penjara", dan "sembunyi" cocok dengan "menyembunyikan". Pertanyaan pidana biasa jadi dapat template darurat.
   - Klasifikasi cadangan selalu mode informasi, jadi "lapor polisi atau damai?" tidak diarahkan ke advokat.
   - Perbaikan: kata krisis dicocokkan per kata (`_POLA_KRISIS`), dan istilah pasal seperti "diancam pidana/hukuman/denda" dikecualikan. Ditambah `_POLA_NASIHAT` untuk permintaan nasihat yang paling umum ("X atau Y", "harus bagaimana", "bakal menang gak"), sehingga intentnya jadi `minta_nasihat_hukum`.
2. **Cek pasal karangan bisa dikelabui.**
   - Jawaban Kia sebelumnya ikut dihitung sebagai sumber, jadi pasal karangan di giliran lalu dianggap "bersumber" di giliran berikutnya.
   - Nama peraturannya tidak dicek: "Pasal 5 KUHP" lolos kalau di konteks ada Pasal 5 UU ITE.
   - "Pasal 1365 dan 1366" hanya mengecek 1365.
   - Perbaikan: sumber yang dihitung hanya pasal hasil pencarian dan pesan klien sendiri. Kalau jawaban menyebut nama peraturannya, pasal itu harus cocok dengan peraturan yang sama di hasil pencarian (dicek lewat alias "KUHP"/"UU ITE" dan nomor UU). Daftar nomor ("1365 dan 1366", "5, 6, dan 7") ikut dicek, dan angka seperti "10 tahun penjara" tidak dianggap pasal.
3. **Fakta awal kasus hilang di percakapan panjang.**
   - Komentar di kode bilang fakta awal terbawa lewat draft, padahal yang dikirim ke model cuma "draft sudah dibuat (kategori)", bukan isinya. Setelah riwayat dipotong 10 pesan, ringkasan kasus yang baru bisa kehilangan fakta awal.
   - Perbaikan: ringkasan kasus dari draft terakhir (`_ringkasan_terakhir`) ikut dikirim sebagai konteks internal. Karena metadata tidak disamarkan, ringkasan ini disamarkan dulu sebelum dikirim ke Gemini.
4. **Judul sesi memakan satu panggilan Gemini tambahan.**
   - Panggilan ini sinkron di jalur request dan memakai model yang paling langka kuotanya.
   - Perbaikan: classifier sekarang mengisi field `judul` di pesan pertama, jadi tidak ada panggilan tambahan. Kalau classifier gagal, judul diambil dari 6 kata pertama pesan. Isi judul juga tidak ditulis ke log lagi, karena bisa memuat nama klien.
5. **Cabang `thinking_budget=0` di classifier tidak pernah jalan.**
   - Kodenya mengecek `gemini-3.8`, sementara modelnya 3.5 dan 3.1. Kedua model ini memang tidak menghasilkan token thinking (sudah dicek di Sprint 5), jadi cabang itu dihapus dan config classifier jadi konstanta `CLASSIFIER_CONFIG`.
6. **Masking PII menyamarkan kata kerja.**
   - "nama saya dicatut di pinjol" membuat "dicatut" dianggap nama dan disamarkan, padahal itu inti kasusnya.
   - Perbaikan: setelah "nama saya" yang ditulis huruf kecil, kata berawalan di-/ter- atau berakhiran -kan/-nya tidak diambil sebagai nama.
7. **Template krisis tidak punya layanan kesehatan jiwa.**
   - Perbaikan: ditambah **119 ext. 8**, layanan kesehatan jiwa dan pencegahan bunuh diri Kemenkes. Nomornya saya cek di healing119.id ("Hubungi 119 ext. 8 untuk darurat bunuh diri"). Jam layanannya tidak tercantum, jadi di template tidak saya tulis "24 jam".

### File

| File | Perubahan |
|---|---|
| `backend/services/chat_policy.py` | `_POLA_KRISIS`, `_POLA_NASIHAT`, field `judul`, `CLASSIFIER_CONFIG`, nomor 119 ext. 8. |
| `backend/services/rag_service.py` | Cek pasal karangan yang baru (`_kutipan`, `_kutipan_tanpa_sumber`), `_ringkasan_terakhir`, judul dari classifier. |
| `backend/services/retrieval_service.py` | `nomor_uu_normal` dan `peraturan_disebut` untuk cek pasal. |
| `backend/services/chat_service.py` | `_simpan_judul` menggantikan `_auto_generate_title`. |
| `backend/helpers/pii.py`, `backend/evals/pii_eval.py` | Kata kerja setelah "nama saya" tidak dianggap nama, ditambah 4 kasus eval. |

---

## 3. Perbaikan chat Kia di frontend

**Tanggal:** 24 November 2026
**Branch:** `fix/ai-review`
**Status:** belum di-commit

### Masalah, penyebab, dan perbaikannya

1. **Balasan Kia bisa masuk ke sesi yang salah.**
   - Kalau user kirim pesan lalu pindah sesi sebelum Kia menjawab, jawabannya muncul di sesi lain.
   - Kalau dimulai dari "Konsultasi Baru" lalu pindah sesi, `activeSessionId` ditimpa sesi baru padahal yang tampil sesi lain, sehingga pesan berikutnya masuk ke sesi yang berbeda.
   - Klik sesi A lalu B dengan cepat bisa menampilkan isi A di bawah B, karena respons yang datang belakangan menimpa.
   - Perbaikan: store punya `viewId` yang naik setiap kali percakapan yang tampil berganti. Balasan dan riwayat yang datang dari view lama tidak ditulis ke layar. Status "sedang mengetik" juga dicatat per view, jadi sesi lain tidak ikut terkunci.
2. **Form budget/jadwal terkunci setelah gagal sekali.**
   - Form hanya aktif kalau dia pesan terakhir. Begitu muncul balasan error (misalnya 429), form langsung menampilkan "sudah dikirim" dan tidak bisa dikirim ulang.
   - Perbaikan: pesan yang gagal dan balasan errornya tidak dihitung, jadi form tetap aktif dengan isian yang sama.
3. **Balasan error tampil seperti jawaban biasa dan tidak bisa dicoba lagi.**
   - Perbaikan: balasan error tampil dengan warna merah dan tombol "Coba lagi" yang mengirim ulang pesan yang sama (termasuk isian form). Balasan `type: "error"` dari backend (server sibuk) juga diperlakukan sebagai error.
4. **Pesan yang terlalu pendek atau panjang kena error 422.**
   - Backend membatasi 3-2000 karakter, tapi input di frontend tidak.
   - Perbaikan: tombol kirim mati di bawah 3 karakter dan muncul keterangan, textarea dibatasi 2000 karakter dengan penghitung mulai 1800, dan error 422 punya pesan sendiri.
5. **Seluruh chat di-render ulang setiap ketikan.**
   - Teks input disimpan di halaman, jadi setiap huruf me-render ulang semua pesan beserta markdown-nya. Interval teks "Kia sedang membaca..." tiap 2 detik juga melakukan hal yang sama.
   - Perbaikan:
     - teks input pindah ke `ChatInput`
     - `ChatMessage` di-`memo` dengan handler yang stabil (`useCallback`)
     - store dibaca dengan selector (`useShallow`)
     - indikator mengetik jadi komponen sendiri
     - judul sesi baru langsung dimuat, karena sudah tersimpan sebelum respons dikirim, jadi `setTimeout` 2 detik dihapus
6. **Aksesibilitas.**
   - Area percakapan diberi `role="log"` dan `aria-live`, indikator mengetik `role="status"`, textarea dan tombol kirim punya label.
   - Baris sesi di sidebar sekarang `<button>`, jadi bisa dipilih dengan keyboard. Tombol hapus punya label dan tetap terlihat saat difokus.

### File

| File | Perubahan |
|---|---|
| `frontend/src/stores/useChatStore.js` | `viewId`, pengaman respons basi, `aiFields`/`jamSekarang` dipakai bersama, `updateLocalMessage`/`removeLocalMessages`. |
| `frontend/src/app/ai/page.js` | Pengiriman per view, coba lagi, form aktif setelah gagal, `TypingIndicator`, `aria-live`. |
| `frontend/src/components/ai/ChatInput.jsx` | State input, batas 3-2000, label. |
| `frontend/src/components/ai/ChatMessage.jsx` | `memo`, tampilan error dan tombol coba lagi, prop `formAktif`. |
| `frontend/src/components/ai/ChatSidebar.jsx` | Baris sesi jadi tombol, label tombol hapus. |
| `frontend/src/components/ai/AISourceList.jsx`, `AIPreferenceForm.jsx` | Selector store, teks form selesai. |
| `qa/pages/tanya-ai/tanya-ai.page.js` | Selector tombol kirim dan hapus sesi mengikuti label baru. |

---

## Pengujian (entri 1-3)

1. **Tes offline dengan DB, Gemini, dan storage palsu: 31/31 lolos.**
   - history: dari 40 pesan, yang terambil pesan 10-39 dengan urutan benar
   - `/chatbot/triage` lewat HTTP:
     - header `X-Request-ID` keluar dan sama dengan `request_id` di log (ContextVar tetap jalan di threadpool)
     - judul diambil dari classifier, dengan nama klien dipulihkan
     - tidak ada lagi panggilan Gemini untuk judul
   - request yang error tetap mengunggah log dengan `status: error`
   - Voyage melempar 429: pasal tetap ditemukan lewat BM25
   - fallback classifier: "pembunuhan" dan "diancam pidana" bukan krisis, "mau bunuh aku" dan "bunuh diri" krisis, "lapor atau damai" dan "bakal menang gak" jadi `minta_nasihat_hukum`
   - ringkasan draft ikut dikirim ke model, dan nama di dalamnya tersamar
   - klaim bursa kedua ditolak, dan kasus dibuka lagi kalau insert konsultasi gagal
   - portofolio: path milik sendiri diterima, path konsultan lain, `..`, dan URL publik konsultan lain ditolak
   - file GIF dengan header `text/html` disimpan sebagai `image/gif`, dan avatar PNG dengan header `image/svg+xml` disimpan sebagai `image/png`
2. Cek pasal karangan diuji dengan 9 contoh jawaban:
   - lolos: "Pasal 5 UU ITE", "Pasal 1365 KUHPerdata", "Pasal 5 ayat (1) UU No. 11 Tahun 2008", "10 tahun penjara", dan "Pasal 378 KUHP" kalau klien sendiri yang menyebutnya
   - ditandai: "Pasal 5 KUHP" (peraturan berbeda), "1366" di "Pasal 1365 dan 1366", "6" dan "7" di "Pasal 5, 6, dan 7"
3. `python -m evals.pii_eval`: 57/57 lolos, termasuk 4 kasus baru "nama saya dicatut/tercantum/dipakai/disalahgunakan".
4. Ruff `check` dan `format --check` bersih, `import main` OK.
5. Frontend: ESLint bersih untuk semua file yang diubah, dan `npm run build` berhasil.
6. Tes ke Gemini sungguhan. Waktu dites, server Google sedang kelebihan beban: banyak panggilan kena `503 UNAVAILABLE` ("model is currently experiencing high demand") di kedua model.
   - Field `judul` classifier: pesan pertama menghasilkan "Gaji Karyawan Tidak Dibayar", dan pesan lanjutan yang punya riwayat menghasilkan `null`, sesuai aturan.
   - Satu percakapan penuh ("Nama saya Rina Kartika ... gaji tidak dibayar 3 bulan"): kedua classifier kena 503 sehingga fallback dipakai, pencarian vektor tetap jalan (Pasal 93, 157, 33), dan jawaban keluar di percobaan terakhir tanpa pasal karangan. Jadi jalur darurat ikut teruji di kondisi nyata.
   - `python -m evals.preferensi_eval` dijalankan dua kali. Gabungan kedua run: 8 dari 11 kasus mendapat jawaban dan semuanya benar (tidak ada yang salah baca budget/jadwal/intent). Tiga kasus sisanya ("sabtu pagi dong", "200rb, sabtu pagi", "maksimal 1 juta, besok sore") kena 503 di kedua run, jadi belum terverifikasi. Perlu dijalankan ulang saat Gemini tidak sibuk.
7. SIT Playwright belum dijalankan. Page object Tanya AI sudah disesuaikan dengan label tombol baru ("Kirim pesan", "Hapus sesi ...", "Klik lagi untuk hapus sesi").

### Catatan

- Temuan review yang butuh keputusan arsitektur belum dikerjakan, karena perlu dibahas dengan tim:
  - ingest dokumen hukum oleh admin tidak muat di batas waktu Vercel
  - batas upload 10MB/50MB lebih besar dari batas body Vercel (sekitar 4,5MB)
  - rate limit dan cache korpus BM25 hanya berlaku per instance
  - portofolio masih di bucket publik
- Branch ini dibuat dari `feat/vulnerability`, jadi PR-nya ikut membawa commit branch itu sampai `feat/vulnerability` di-merge ke `dev`.
