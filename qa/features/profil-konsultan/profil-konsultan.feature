@sit @profil-konsultan @precondition:login-klien
Feature: Profil konsultan dan pemesanan konsultasi
  Klien membaca profil konsultan, memilih jadwal, lalu mengirim permintaan konsultasi.

  @BOK-001 @mobile
  Scenario: Profil konsultan menampilkan informasi utamanya
    Given konsultan uji membuka jadwal praktik
    When pengguna membuka halaman profil konsultan uji
    Then profil menampilkan nama, status verifikasi, tarif, dan deskripsi konsultan uji

  @BOK-002 @critical
  Scenario: Klien memesan konsultasi dengan dokumen pendukung
    Given konsultan uji membuka jadwal praktik
    And pengguna berada di halaman profil konsultan uji
    When pengguna memesan konsultasi dengan dokumen pendukung
    Then pemesanan dikonfirmasi berhasil
    And pengajuan tersimpan menunggu persetujuan konsultan beserta dokumennya
    When pengguna kembali ke dashboard dari konfirmasi pemesanan
    Then pengguna diarahkan ke halaman dashboard klien

  @BOK-003
  Scenario: Pemesanan tanpa jadwal dan deskripsi ditolak
    Given konsultan uji membuka jadwal praktik
    And pengguna berada di halaman profil konsultan uji
    When pengguna memesan konsultasi tanpa mengisi apa pun
    Then muncul pemberitahuan "Mohon lengkapi semua data pengajuan."
    And tidak ada permintaan pemesanan konsultasi yang dikirim ke backend

  @BOK-003
  Scenario: Pemesanan dengan deskripsi kosong ditolak
    Given konsultan uji membuka jadwal praktik
    And pengguna berada di halaman profil konsultan uji
    When pengguna memesan konsultasi dengan deskripsi yang hanya berisi spasi
    Then muncul pemberitahuan "Mohon lengkapi semua data pengajuan."
    And tidak ada permintaan pemesanan konsultasi yang dikirim ke backend

  @BOK-004
  Scenario: Jam yang sudah dipesan tidak bisa dipilih
    Given konsultan uji sudah punya sesi terjadwal pada jadwal praktiknya
    And pengguna berada di halaman profil konsultan uji
    When pengguna melihat pilihan jam mulai
    Then jam yang sudah dipesan ditandai terisi dan tidak bisa dipilih

  @BOK-005
  Scenario: Jam di luar jam praktik tidak bisa dipilih
    Given konsultan uji membuka jadwal praktik
    And pengguna berada di halaman profil konsultan uji
    When pengguna melihat pilihan jam mulai
    Then hanya jam di dalam jam praktik yang bisa dipilih

  @BOK-006
  Scenario: Konsultan tanpa jadwal tidak menawarkan tanggal
    Given konsultan uji belum membuka jadwal praktik
    When pengguna membuka halaman profil konsultan uji
    Then tidak ada tanggal konsultasi yang bisa dipilih

  @BOK-007
  Scenario: Dokumen yang terlalu besar ditolak
    Given konsultan uji membuka jadwal praktik
    And pengguna berada di halaman profil konsultan uji
    When pengguna melampirkan dokumen yang terlalu besar
    Then muncul pemberitahuan "File terlalu besar! Maksimal 10MB"
    And dokumen itu tidak masuk daftar lampiran

  @BOK-007
  Scenario: Dokumen yang sudah dilampirkan dapat dihapus
    Given konsultan uji membuka jadwal praktik
    And pengguna berada di halaman profil konsultan uji
    When pengguna melampirkan lalu menghapus sebuah dokumen
    Then daftar lampiran kembali kosong

  @BOK-008 @fail @BUG-12
  Scenario: Berkas program tidak boleh dilampirkan
    Given konsultan uji membuka jadwal praktik
    And pengguna berada di halaman profil konsultan uji
    When pengguna melampirkan berkas program
    Then dokumen itu tidak masuk daftar lampiran

  @BOK-009 @stub
  Scenario: Penolakan backend saat memesan diberitahukan ke klien
    Given konsultan uji membuka jadwal praktik
    And layanan pemesanan konsultasi menolak dengan pesan "Jadwal sudah terisi"
    And pengguna berada di halaman profil konsultan uji
    When pengguna memesan konsultasi tanpa dokumen
    Then muncul pemberitahuan "Jadwal sudah terisi"
    And pemesanan tidak dikonfirmasi berhasil

  @BOK-010
  Scenario: Pemesanan yang sedang diproses tidak bisa dikirim dua kali
    Given konsultan uji membuka jadwal praktik
    And layanan pemesanan konsultasi merespons lambat
    And pengguna berada di halaman profil konsultan uji
    When pengguna memesan konsultasi lalu menekan tombol pesan sekali lagi
    Then pemesanan dikonfirmasi berhasil
    And hanya ada 1 permintaan pemesanan konsultasi yang dikirim ke backend

  @BOK-011 @fail @BUG-19
  Scenario: Profil konsultan yang tidak ada diberitahukan ke klien
    When pengguna membuka halaman profil konsultan yang tidak ada
    Then profil menampilkan pesan konsultan tidak ditemukan
