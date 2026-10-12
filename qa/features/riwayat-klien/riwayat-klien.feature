@sit @riwayat-klien @precondition:login-klien
Feature: Riwayat konsultasi klien
  Klien melihat seluruh konsultasinya, dengan sesi yang masih berjalan di urutan teratas.

  @HIS-001 @mobile
  Scenario: Riwayat mendahulukan sesi aktif dan menghitung sesi selesai
    Given klien punya riwayat konsultasi dengan berbagai status
    When pengguna membuka halaman riwayat klien
    Then riwayat menampilkan semua konsultasi dengan sesi aktif di urutan teratas
    And jumlah sesi selesai tampil di riwayat

  @HIS-002
  Scenario: Klien tanpa konsultasi melihat riwayat kosong
    Given klien belum punya konsultasi
    When pengguna membuka halaman riwayat klien
    Then riwayat menampilkan keadaan kosong

  @HIS-003
  Scenario: Klien membuka detail konsultasi dari riwayat
    Given klien punya konsultasi berstatus selesai
    And pengguna berada di halaman riwayat klien
    When pengguna membuka detail konsultasi dari riwayat
    Then pengguna diarahkan ke halaman detail konsultasi itu
