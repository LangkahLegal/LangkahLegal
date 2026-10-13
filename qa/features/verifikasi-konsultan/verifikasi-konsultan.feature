@sit @verifikasi-konsultan @precondition:login-admin
Feature: Daftar verifikasi konsultan
  Admin melihat pengajuan verifikasi konsultan, menyaringnya menurut status, dan mencarinya.

  @VER-001 @critical
  Scenario: Jumlah pengajuan per status sama dengan isi database
    When pengguna membuka halaman verifikasi konsultan
    Then tab status menampilkan jumlah pengajuan sesuai database

  @VER-002
  Scenario: Pengajuan dapat disaring ke status pending
    Given konsultan baru baru saja mengajukan verifikasi
    And pengguna berada di halaman verifikasi konsultan
    When pengguna menyaring pengajuan yang masih pending
    Then pengajuan konsultan baru tampil tanpa konsultan yang sudah terverifikasi
    And daftar pengajuan diminta ke backend dengan status pending

  @VER-003
  Scenario: Pengajuan dapat dicari berdasarkan nama
    Given konsultan baru baru saja mengajukan verifikasi
    And pengguna berada di halaman verifikasi konsultan
    When pengguna mencari pengajuan berdasarkan nama konsultan baru
    Then hanya pengajuan konsultan baru yang tampil

  @VER-003
  Scenario: Pencarian pengajuan tanpa hasil menampilkan keadaan kosong
    Given pengguna berada di halaman verifikasi konsultan
    When pengguna mencari pengajuan dengan kata yang tidak cocok
    Then daftar pengajuan menampilkan keadaan kosong

  @VER-009 @stub
  Scenario: Pengajuan tanpa nama lengkap tidak merusak daftar
    Given daftar pengajuan berisi konsultan tanpa nama lengkap
    When pengguna membuka halaman verifikasi konsultan
    Then pengajuan lain tetap tampil di daftar
    And halaman tidak mengalami galat
