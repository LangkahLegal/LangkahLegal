@sit @daftar-klien @precondition:login-konsultan
Feature: Daftar klien konsultan
  Konsultan melihat klien yang sedang ditanganinya dan mengurutkannya.

  @CLT-001
  Scenario: Klien aktif dapat diurutkan menurut pengajuan dan jadwal
    Given konsultan uji punya beberapa klien aktif
    When pengguna membuka halaman daftar klien
    Then daftar klien menampilkan jumlah klien aktif dengan pengajuan terbaru di atas
    When pengguna mengurutkan klien dari pengajuan terlama
    Then daftar klien tersusun dari pengajuan terlama
    When pengguna mengurutkan klien dari jadwal paling dekat
    Then daftar klien tersusun dari jadwal paling dekat

  @CLT-002
  Scenario: Konsultan tanpa klien aktif melihat daftar kosong
    Given klien belum punya konsultasi
    When pengguna membuka halaman daftar klien
    Then daftar klien menampilkan keadaan kosong

  @CLT-002
  Scenario: Gangguan saat memuat daftar klien diberitahukan ke konsultan
    Given layanan klien aktif konsultan sedang mengalami gangguan
    When pengguna membuka halaman daftar klien
    Then daftar klien menampilkan pesan gagal memuat
