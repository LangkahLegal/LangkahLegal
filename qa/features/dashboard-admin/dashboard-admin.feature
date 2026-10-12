@sit @dashboard-admin @precondition:login-admin
Feature: Dashboard admin
  Admin memantau jumlah pengguna, transaksi, dan pengajuan verifikasi konsultan.

  @ADM-001 @critical @mobile
  Scenario: Dashboard admin menampilkan statistik pengguna sesuai database
    When pengguna membuka halaman dashboard admin
    Then statistik pengguna di dashboard admin sama dengan isi database

  @ADM-002
  Scenario: Pengajuan verifikasi terbaru dapat dibuka dari dashboard
    Given konsultan baru baru saja mengajukan verifikasi
    And pengguna berada di halaman dashboard admin
    Then pengajuan verifikasi konsultan baru tampil di dashboard admin
    When pengguna membuka pengajuan verifikasi itu dari dashboard
    Then pengguna diarahkan ke halaman verifikasi konsultan baru

  @ADM-003 @stub
  Scenario: Dashboard tetap tampil tanpa pengajuan dan tanpa statistik
    Given tidak ada pengajuan verifikasi yang menunggu
    And layanan statistik admin sedang mengalami gangguan
    When pengguna membuka halaman dashboard admin
    Then dashboard admin menampilkan bahwa semua pengajuan sudah selesai
    And halaman tidak mengalami galat
