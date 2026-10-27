# Laporan Perubahan Codebase LangkahLegal

## Periode Pemeriksaan

- **Periode laporan:** 14–28 Oktober 2026
- **Rentang commit:** `77608c83276da352f9f99c2993dd463fe2d5f1b0` sampai `ce296753e8b73e970dffe0cfdc5e5507e2f821be`
- **Commit awal tercatat:** 15 Oktober 2026
- **Commit akhir tercatat:** 27 Oktober 2026
- **Jumlah commit:** 26 commit, termasuk merge commit
- **Perubahan bersih:** 127 file
- **Penambahan kode:** 5.329 baris
- **Penghapusan kode:** 1.466 baris

> Tidak ditemukan commit bertanggal 14 atau 28 Oktober dalam rentang commit yang diberikan. Karena itu, isi laporan berasal dari perubahan yang tercatat pada 15–27 Oktober 2026.

## Ringkasan Perubahan Utama

### 1. Pengembangan Asisten AI Kia

- Nama asisten AI diperbarui menjadi **Kia** agar memiliki identitas yang lebih jelas.
- Kemampuan AI untuk membuat draf konsultasi ditingkatkan.
- Informasi hasil konsultasi ditampilkan dalam kartu khusus agar lebih mudah dibaca.
- Jawaban AI dilengkapi daftar sumber hukum atau dokumen pendukung.
- Pengguna dapat membuka dan membaca dokumen sumber langsung dari halaman percakapan.
- Tampilan dokumen sumber diubah dari popup menjadi panel berdampingan dengan percakapan.
- Pengelolaan data peraturan diperbarui agar sumber hukum lebih mudah disinkronkan dan digunakan AI.
- Aturan respons AI diperkuat melalui kebijakan percakapan khusus.
- Dokumentasi arsitektur dan integrasi chatbot diperbarui mengikuti perubahan sistem.
- Evaluasi otomatis ditambahkan untuk mengukur kualitas dan kepatuhan respons chatbot.

### 2. Peningkatan Bursa Kasus

- Fitur pencarian dan penyaringan ditambahkan pada halaman **Bursa Kasus**.
- Pengguna dapat menyaring kasus berdasarkan beberapa kriteria yang tersedia.
- Proses filter diterapkan pada frontend dan backend agar hasil tetap konsisten.
- Tampilan kartu kasus dan komponen filter diperbaiki.
- Proses pencarian dibuat lebih efisien dengan penundaan singkat sebelum permintaan dikirim ke server.
- Pengujian QA terkait Bursa Kasus disesuaikan dengan perilaku baru.

### 3. Peningkatan Pencarian Konsultan dan Klien

- Tampilan halaman pencarian konsultan diperbaiki agar lebih rapi dan mudah digunakan.
- Kartu konsultan diperbarui untuk menampilkan informasi secara lebih jelas.
- Fitur filter ditambahkan pada katalog konsultan.
- Fitur filter ditambahkan pada daftar klien untuk pengguna berperan sebagai konsultan.
- Logika filter dipusatkan agar dapat digunakan secara konsisten pada beberapa halaman.
- Layanan backend diperbarui untuk mendukung pencarian dan penyaringan data.
- Pengujian QA untuk katalog konsultan dan daftar klien ikut diperbarui.

### 4. Peningkatan Riwayat Konsultasi

- Halaman riwayat konsultasi klien dan konsultan diperbarui.
- Fitur pencarian ditambahkan untuk memudahkan pengguna menemukan konsultasi tertentu.
- Filter ditambahkan agar riwayat dapat dipilih berdasarkan kategori atau kondisi tertentu.
- Data konsultasi dikelompokkan agar informasi lebih terstruktur.
- Komponen filter riwayat dibuat agar dapat digunakan pada halaman klien dan konsultan.
- Tampilan halaman disederhanakan meskipun jumlah fitur bertambah.

### 5. Perbaikan Sistem Autentikasi dan Sesi

- Masalah pengguna keluar dari aplikasi terlalu cepat diperbaiki.
- Pengelolaan token dan data autentikasi pada browser diperkuat.
- Perulangan saat pemilihan peran pengguna diperbaiki.
- Perlindungan halaman berdasarkan status login diperbaiki.
- Pengguna yang belum memiliki peran diarahkan ke halaman pemilihan peran.
- Pengguna yang sudah memiliki peran tidak lagi diarahkan berulang kali ke halaman tersebut.
- Proses pemanggilan API diperbaiki agar kesalahan autentikasi ditangani secara lebih tepat.
- Perlindungan halaman diterapkan pada sisi frontend dan backend.

### 6. Penambahan Middleware Keamanan Backend

- Middleware baru ditambahkan untuk memeriksa sesi pengguna.
- Pemeriksaan hak akses berdasarkan peran dipindahkan ke mekanisme yang lebih terpusat.
- Endpoint backend disesuaikan agar menggunakan pemeriksaan sesi dan peran secara konsisten.
- Pembatasan jumlah permintaan ditambahkan untuk mencegah penggunaan API secara berlebihan.
- Pembatasan berdasarkan alamat IP kemudian dihapus agar tidak mengganggu pengguna yang memakai jaringan bersama.
- Struktur kode lama terkait pembatasan permintaan dibersihkan.
- Beberapa pemeriksaan akses yang sebelumnya tersebar di service dipindahkan ke lapisan middleware.
- Respons kesalahan autentikasi dan otorisasi disederhanakan agar lebih konsisten.

### 7. Penyesuaian Aksi Berdasarkan Hak Akses

- Tombol atau aksi yang akan ditolak backend kini disembunyikan dari pengguna.
- Tampilan detail konsultan disesuaikan berdasarkan kondisi pengguna.
- Halaman permintaan konsultasi diperbarui agar hanya menampilkan aksi yang valid.
- Halaman pembayaran diperbaiki agar mengikuti status dan hak akses pengguna.
- Perubahan ini mengurangi kebingungan karena pengguna tidak lagi melihat tombol yang tidak dapat digunakan.
- Skenario QA pembayaran diperbarui untuk memastikan perilaku baru berjalan benar.

### 8. Perbaikan Layanan Profil dan Foto Pengguna

- Proses perubahan foto profil dipindahkan ke layanan penyimpanan backend.
- Konfigurasi penyimpanan gambar ditambahkan pada backend.
- Data profil pengguna diperbarui agar mendukung URL foto dengan lebih baik.
- Komponen unggah avatar pada frontend disederhanakan.
- Perubahan ini memperbaiki masalah respons `400` saat pengguna memperbarui foto profil.

### 9. Keamanan dan Kebersihan URL

- Helper ditambahkan untuk membersihkan dan memvalidasi URL.
- URL yang digunakan pada data kasus dan konsultasi diproses sebelum dikirim atau disimpan.
- Perubahan ini mengurangi risiko penggunaan tautan yang tidak valid atau tidak aman.
- Pengelolaan URL menjadi lebih konsisten pada beberapa layanan backend.

### 10. Penyederhanaan Pengaturan Aplikasi

- Opsi **pengaturan bahasa** dihapus dari aplikasi.
- Halaman pengaturan bahasa dihapus dari frontend.
- Tautan menuju pengaturan bahasa dihapus dari halaman pengaturan.
- Skenario, page object, dan pengujian QA terkait pengaturan bahasa ikut dihapus.
- Data pengujian pengaturan diperbarui agar sesuai dengan fitur yang masih tersedia.

### 11. Peningkatan Landing Page

- Tinggi bagian utama landing page disesuaikan dengan ukuran layar.
- Tata letak hero section diperbaiki agar tampil lebih proporsional.
- Logo pada navbar dapat digunakan untuk kembali ke bagian awal halaman.
- Perpindahan ke bagian awal halaman menggunakan efek scroll yang lebih halus.

### 12. Peningkatan Pengujian dan Evaluasi AI

- Skrip evaluasi chatbot ditambahkan pada backend.
- Evaluasi mencakup kebijakan respons dan perilaku AI.
- Laporan hasil evaluasi dalam format teks, JSON, dan HTML ditambahkan.
- Beberapa masalah pada kebijakan chatbot diperbaiki berdasarkan hasil evaluasi.
- Dokumentasi teknis AI diperbarui agar sesuai dengan implementasi terbaru.
- Data pengujian fitur Tanya AI diperluas.
- Skenario QA ditambahkan untuk draf konsultasi dan sumber dokumen.

### 13. Pengelolaan Artefak QA

- Hasil pengujian otomatis sempat tercatat dalam repository, termasuk laporan HTML, screenshot, trace, dan file hasil generate.
- File hasil generate kemudian dihapus dari pelacakan Git.
- Aturan `.gitignore` diperbarui agar artefak serupa tidak kembali masuk ke repository.
- Source pengujian tetap dipertahankan, sedangkan hasil sementara tidak lagi disimpan.
- Perubahan ini membuat repository lebih bersih dan mengurangi file berukuran besar yang tidak diperlukan.

### 14. Perapian dan Konsistensi Codebase

- Kode Python diformat menggunakan **Ruff**.
- Penulisan kode dibuat lebih konsisten tanpa mengubah fungsi utama.
- Komentar dan docstring yang tidak memberikan informasi penting dihapus.
- Struktur middleware dan helper dirapikan.
- Beberapa logika yang berulang dipusatkan agar lebih mudah dipelihara.
- Komponen filter dipindahkan ke lokasi yang lebih umum agar dapat digunakan kembali.
- Dependensi backend disesuaikan mengikuti perubahan middleware.

## Kronologi Perubahan

### 15–18 Oktober 2026

- Memformat kode Python menggunakan Ruff.
- Merapikan helper jadwal dan service konsultan.
- Menyamakan gaya penulisan kode backend.

### 19 Oktober 2026

- Menghapus fitur pengaturan bahasa beserta pengujian terkait.
- Memperbaiki tampilan hero section landing page.
- Menambahkan smooth scroll melalui logo navbar.
- Mengubah identitas asisten AI menjadi Kia.
- Menambahkan fitur draf konsultasi AI.
- Menambahkan sumber hukum pada jawaban AI.
- Menambahkan pengelolaan dan sinkronisasi data peraturan.
- Memperbarui tampilan pencarian konsultan.
- Menambahkan filter pada Bursa Kasus.
- Menambahkan pencarian, filter, dan kategorisasi riwayat konsultasi.
- Menambahkan filter pada katalog konsultan dan daftar klien.
- Menambahkan dan memperbarui pengujian QA untuk fitur-fitur tersebut.
- Menggabungkan pengembangan filter dan peningkatan antarmuka pengguna.

### 20 Oktober 2026

- Menambahkan evaluasi otomatis chatbot.
- Memperbarui dokumentasi arsitektur dan integrasi AI.
- Menyimpan hasil evaluasi chatbot untuk ditinjau.
- Melakukan penyesuaian kebijakan respons berdasarkan hasil evaluasi.

### 24 Oktober 2026

- Mengubah layanan pembaruan profil.
- Menambahkan dukungan penyimpanan gambar pada backend.
- Memperbaiki proses perubahan foto profil.
- Menyederhanakan komponen unggah avatar.

### 25–27 Oktober 2026

- Mengubah popup dokumen AI menjadi panel berdampingan.
- Memperbaiki masalah logout terlalu cepat.
- Memperbaiki perulangan pada pemilihan peran.
- Memperkuat perlindungan halaman.
- Menambahkan pemeriksaan sesi dan peran pada backend.
- Menambahkan pembatasan permintaan API.
- Menghapus pembatasan berdasarkan IP agar tidak mengganggu jaringan bersama.
- Menambahkan pembersihan URL.
- Menyembunyikan aksi yang tidak diizinkan backend.
- Memperbarui pengujian pembayaran.
- Menghapus artefak QA dari pelacakan Git.
- Menggabungkan seluruh perubahan middleware ke branch utama pengembangan.

## Dampak bagi Pengguna

- Pengguna lebih mudah mencari kasus, konsultan, klien, dan riwayat konsultasi.
- Interaksi dengan Kia lebih informatif karena dilengkapi draf konsultasi dan sumber hukum.
- Dokumen sumber dapat dibaca tanpa meninggalkan percakapan.
- Sesi login lebih stabil dan tidak mudah berakhir sebelum waktunya.
- Navigasi berdasarkan peran menjadi lebih konsisten.
- Pengguna hanya melihat aksi yang memang dapat mereka lakukan.
- Penggantian foto profil menjadi lebih andal.
- Landing page dan beberapa halaman utama lebih nyaman digunakan.

## Dampak bagi Tim Pengembang

- Pemeriksaan sesi dan hak akses lebih terpusat.
- Logika filter lebih mudah digunakan kembali.
- Evaluasi kualitas chatbot dapat dilakukan secara terukur.
- Repository lebih bersih karena hasil generate QA tidak lagi dilacak.
- Struktur kode lebih konsisten setelah diformat dan dirapikan.
- Dokumentasi AI lebih sesuai dengan implementasi terbaru.
- Risiko tautan tidak valid berkurang melalui sanitasi URL.

## Kesimpulan

Perubahan selama periode ini berfokus pada empat area utama:

1. **Peningkatan fitur pengguna**, terutama pencarian, filter, riwayat konsultasi, dan tampilan aplikasi.
2. **Pengembangan Kia**, mencakup draf konsultasi, sumber hukum, tampilan dokumen, dan evaluasi respons.
3. **Penguatan keamanan**, mencakup sesi, hak akses berbasis peran, perlindungan halaman, pembatasan permintaan, dan sanitasi URL.
4. **Perawatan codebase**, mencakup pemformatan kode, penghapusan fitur yang tidak digunakan, pembaruan QA, serta pembersihan artefak hasil pengujian.
