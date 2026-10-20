@sit @tanya-ai @precondition:login-klien
Feature: Tanya AI
  Klien bertanya tentang persoalan hukum kepada asisten AI dan menyimpan riwayat percakapannya.

  # Layanan AI dibatasi tiga pertanyaan per menit dan jawabannya tidak pernah sama persis.
  # Karena itu hanya satu skenario yang bertanya ke AI sungguhan; skenario yang butuh isi jawaban
  # tertentu memakai jawaban tiruan (@stub).

  @AI-001 @mobile
  Scenario: Halaman Tanya AI menyambut klien
    When pengguna membuka halaman tanya AI
    Then Tanya AI menampilkan sambutan dan menunggu pertanyaan

  @AI-002 @critical @layanan-eksternal
  Scenario: Klien bertanya dan mendapat jawaban dari AI
    Given klien belum punya percakapan dengan AI
    And pengguna berada di halaman tanya AI
    When pengguna mengirim pertanyaan hukum ke AI
    Then pertanyaan itu tampil di percakapan selagi AI menyiapkan jawaban
    And AI membalas pertanyaan itu
    And percakapan tersimpan sebagai sesi klien uji

  @AI-003 @stub
  Scenario: Pertanyaan lanjutan tetap berada di sesi yang sama
    Given AI akan membalas dengan jawaban biasa
    And pengguna berada di halaman tanya AI
    When pengguna mengirim dua pertanyaan berturut-turut
    Then pertanyaan kedua dikirim dalam sesi yang sama

  @AI-004
  Scenario: Baris baru tidak mengirim pertanyaan
    Given pengguna berada di halaman tanya AI
    When pengguna menulis pertanyaan dua baris
    Then pertanyaan itu belum dikirim ke AI

  @AI-004
  Scenario: Pertanyaan kosong tidak dapat dikirim
    Given pengguna berada di halaman tanya AI
    When pengguna mengirim pertanyaan yang hanya berisi spasi
    Then tidak ada permintaan tanya AI yang dikirim ke backend

  @AI-005
  Scenario: AI yang kebanjiran permintaan diberitahukan dengan ramah
    Given layanan AI sedang kebanjiran permintaan
    And pengguna berada di halaman tanya AI
    When pengguna mengirim pertanyaan hukum ke AI
    Then AI menampilkan pesan gangguan yang sesuai dan klien dapat bertanya lagi

  @AI-006
  Scenario: Galat internal layanan AI diberitahukan dengan ramah
    Given layanan AI sedang mengalami galat internal
    And pengguna berada di halaman tanya AI
    When pengguna mengirim pertanyaan hukum ke AI
    Then AI menampilkan pesan gangguan yang sesuai dan klien dapat bertanya lagi

  @AI-007
  Scenario: Koneksi terputus ke layanan AI diberitahukan dengan ramah
    Given layanan AI sedang tidak dapat dihubungi
    And pengguna berada di halaman tanya AI
    When pengguna mengirim pertanyaan hukum ke AI
    Then AI menampilkan pesan gangguan yang sesuai dan klien dapat bertanya lagi

  @AI-008 @stub
  Scenario: Rekomendasi konsultan dari AI dapat langsung dijadwalkan
    Given AI akan membalas dengan rekomendasi konsultan
    And pengguna berada di halaman tanya AI
    When pengguna mengirim pertanyaan hukum ke AI
    Then AI menampilkan konsultan uji sebagai rekomendasi
    When pengguna memilih menjadwalkan konsultan yang direkomendasikan
    Then profil konsultan uji terbuka di tab baru

  @AI-014 @stub
  Scenario: Ringkasan kasus dari AI terisi otomatis di form pengajuan konsultan
    Given AI akan membalas dengan draft pengajuan konsultasi
    And pengguna berada di halaman tanya AI
    When pengguna mengirim pertanyaan hukum ke AI
    Then AI menampilkan ringkasan kasus sebagai draft pengajuan
    When pengguna memilih menjadwalkan konsultan yang direkomendasikan
    Then form pengajuan di tab baru sudah berisi ringkasan kasus dari AI

  @AI-015 @stub
  Scenario: Dokumen sumber jawaban AI dapat dibuka sampai naskah resminya
    Given AI akan membalas dengan jawaban bersumber
    And pengguna berada di halaman tanya AI
    When pengguna mengirim pertanyaan hukum ke AI
    Then AI menampilkan dokumen sumber di bawah jawaban
    When pengguna membuka dokumen sumber itu
    Then isi pasal yang dirujuk tampil beserta tautan naskah resminya
    When pengguna beralih ke naskah resmi
    Then naskah resmi peraturan ditampilkan di dalam pratinjau

  @AI-009 @stub
  Scenario: Jawaban cepat dapat dipilih saat AI menanyakan bukti
    Given AI akan membalas dengan pertanyaan tentang bukti
    And pengguna berada di halaman tanya AI
    When pengguna mengirim pertanyaan hukum ke AI
    And pengguna memilih jawaban cepat bahwa ia punya bukti
    Then jawaban cepat itu dikirim sebagai pertanyaan berikutnya

  @AI-010 @stub
  Scenario: Jawaban AI berisi konten berbahaya tidak dijalankan browser
    Given AI akan membalas dengan konten berbahaya
    And pengguna berada di halaman tanya AI
    When pengguna mengirim pertanyaan hukum ke AI
    Then konten berbahaya dalam jawaban AI dinetralkan
    And tidak ada dialog yang muncul

  @AI-011 @stub
  Scenario: Pertanyaan baru tidak dikirim selama AI masih menjawab
    Given AI akan membalas dengan jawaban biasa setelah beberapa saat
    And pengguna berada di halaman tanya AI
    When pengguna mengirim dua pertanyaan tanpa menunggu jawaban
    Then hanya ada 1 permintaan tanya AI yang dikirim ke backend

  @AI-012
  Scenario: Klien membuka sesi lama, menghapus sesi lain, lalu memulai percakapan baru
    Given klien punya dua sesi percakapan lama dengan AI
    And pengguna berada di halaman tanya AI
    When pengguna membuka salah satu sesi lama dari riwayat
    Then isi percakapan sesi itu tampil kembali
    When pengguna menghapus sesi lama yang lain
    Then sesi itu terhapus dari riwayat dan dari database
    When pengguna memulai percakapan baru
    Then Tanya AI kembali menampilkan sambutan

  @AI-013
  Scenario: Riwayat percakapan tetap terbaca tanpa font ikon
    Given klien punya dua sesi percakapan lama dengan AI
    And font ikon tidak dapat dimuat
    And pengguna berada di halaman tanya AI
    When pengguna membuka riwayat percakapan
    Then judul sesi lama tetap terbaca
