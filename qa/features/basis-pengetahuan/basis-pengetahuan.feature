@sit @basis-pengetahuan @precondition:login-admin
Feature: Basis pengetahuan dokumen hukum
  Admin mengelola dokumen hukum yang menjadi sumber jawaban Tanya AI.

  # Ekstraksi dokumen berjalan di latar belakang dan butuh layanan embedding, jadi unggah dan ganti
  # dokumen disimulasikan (@stub). Skenario yang menghapus memakai dokumen uji milik pengujian.

  @KNW-001 @critical
  Scenario: Daftar dokumen hukum menampilkan nomor, jumlah pasal, dan statusnya
    Given basis pengetahuan berisi dokumen uji
    And pengguna berada di halaman basis pengetahuan
    When pengguna mencari dokumen uji di basis pengetahuan
    Then dokumen uji tampil dengan nomor, jumlah pasal, dan status hukumnya

  @KNW-002
  Scenario: Pencarian dokumen menunggu admin selesai mengetik
    Given pengguna berada di halaman basis pengetahuan
    When pengguna mengetik kata pencarian dokumen huruf demi huruf
    Then hanya satu pencarian dokumen yang dikirim ke backend

  @KNW-003
  Scenario: Dokumen dapat disaring berdasarkan kategori
    Given pengguna berada di halaman basis pengetahuan
    When pengguna menyaring dokumen berdasarkan kategori pidana
    Then daftar dokumen diminta ke backend dengan kategori itu

  @KNW-003
  Scenario: Nomor halaman di luar jangkauan dikembalikan ke halaman aktif
    Given pengguna berada di halaman basis pengetahuan
    When pengguna berpindah ke halaman dokumen berikutnya lalu mengetik nomor halaman yang tidak ada
    Then daftar dokumen tetap berada di halaman kedua

  @KNW-011
  Scenario: Berpindah halaman segera setelah daftar dimuat tidak kembali ke halaman pertama
    Given pengguna berada di halaman basis pengetahuan
    When pengguna langsung berpindah ke halaman dokumen berikutnya
    Then daftar dokumen tetap berada di halaman kedua

  @KNW-004 @stub
  Scenario: Admin mengunggah dokumen hukum baru
    Given unggahan dokumen akan diproses sampai selesai
    And pengguna berada di halaman basis pengetahuan
    When pengguna mengunggah dokumen hukum baru
    Then proses dokumen berjalan lalu dinyatakan selesai
    And data dokumen dikirim lengkap ke backend

  @KNW-004
  Scenario: Formulir unggah belum bisa dikirim sebelum lengkap
    Given pengguna berada di halaman basis pengetahuan
    When pengguna membuka formulir unggah dokumen
    Then dokumen belum dapat diunggah

  @KNW-005 @stub
  Scenario: Proses dokumen yang gagal diberitahukan ke admin
    Given ada proses dokumen yang berakhir gagal
    When pengguna membuka halaman basis pengetahuan
    Then kegagalan proses dokumen diberitahukan beserta penyebabnya

  @KNW-006
  Scenario: Admin menghapus dokumen beserta seluruh pasalnya
    Given basis pengetahuan berisi dokumen uji
    And pengguna berada di halaman basis pengetahuan
    When pengguna mencari dokumen uji di basis pengetahuan
    And pengguna menghapus dokumen uji itu
    Then muncul keterangan dokumen berhasil dihapus
    And dokumen uji beserta pasalnya hilang dari database

  @KNW-007 @stub
  Scenario: Admin mengganti berkas dokumen yang sudah ada
    Given basis pengetahuan berisi dokumen uji
    And penggantian dokumen akan diproses sampai selesai
    And pengguna berada di halaman basis pengetahuan
    When pengguna mencari dokumen uji di basis pengetahuan
    And pengguna mengganti berkas dokumen uji itu
    Then formulir ganti dokumen terisi data dokumen uji
    And penggantian dikirim ke backend untuk dokumen uji

  @KNW-010 @stub @fail @BUG-35
  Scenario: Tahun undang-undang di luar rentang ditolak
    Given unggahan dokumen akan diproses sampai selesai
    And pengguna berada di halaman basis pengetahuan
    When pengguna mengunggah dokumen dengan tahun yang tidak masuk akal
    Then tidak ada permintaan unggah dokumen yang dikirim ke backend
