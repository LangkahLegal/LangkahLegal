@sit @detail-verifikasi @precondition:login-admin
Feature: Keputusan verifikasi konsultan
  Admin meninjau data konsultan lalu menyetujui atau menolak verifikasinya.

  @VER-004 @critical
  Scenario: Admin menyetujui verifikasi konsultan
    Given konsultan baru baru saja mengajukan verifikasi
    And pengguna berada di halaman verifikasi konsultan baru
    Then data pengajuan konsultan baru tampil lengkap
    When pengguna menyetujui verifikasi konsultan itu
    Then pengguna diarahkan ke halaman verifikasi konsultan
    And konsultan baru tersimpan sebagai terverifikasi

  @VER-005
  Scenario: Penolakan verifikasi tidak bisa dikirim tanpa alasan
    Given konsultan baru baru saja mengajukan verifikasi
    And pengguna berada di halaman verifikasi konsultan baru
    When pengguna hendak menolak verifikasi tanpa menulis alasan
    Then penolakan belum dapat dikirim

  @VER-005
  Scenario: Admin menolak verifikasi konsultan dengan alasan
    Given konsultan baru baru saja mengajukan verifikasi
    And pengguna berada di halaman verifikasi konsultan baru
    When pengguna menolak verifikasi konsultan itu dengan sebuah alasan
    Then pengguna diarahkan ke halaman verifikasi konsultan
    And konsultan baru tersimpan sebagai ditolak beserta alasannya

  @VER-006
  Scenario: Konsultan yang sudah terverifikasi tidak bisa diputuskan ulang
    When pengguna membuka halaman verifikasi konsultan uji
    Then data konsultan uji tampil tanpa pilihan terima atau tolak

  @VER-007
  Scenario: Pengajuan yang tidak ada diberitahukan ke admin
    When pengguna membuka halaman verifikasi konsultan yang tidak ada
    Then halaman verifikasi menampilkan pesan data tidak ditemukan

  @VER-008
  Scenario: Kegagalan menyimpan keputusan diberitahukan ke admin
    Given konsultan baru baru saja mengajukan verifikasi
    And layanan keputusan verifikasi sedang mengalami gangguan
    And pengguna berada di halaman verifikasi konsultan baru
    When pengguna menyetujui verifikasi konsultan itu
    Then admin diberi tahu bahwa keputusan gagal disimpan
