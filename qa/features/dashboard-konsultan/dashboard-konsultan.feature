@sit @dashboard-konsultan
Feature: Dashboard konsultan
  Konsultan melihat pendapatan, sesi terdekat, dan permintaan baru dari klien.

  @CDB-001 @critical @mobile @precondition:login-konsultan
  Scenario: Konsultan tanpa konsultasi melihat dashboard kosong
    Given klien belum punya konsultasi
    When pengguna membuka halaman dashboard konsultan
    Then dashboard konsultan menampilkan sapaan, pendapatan nol, dan keadaan kosong

  @CDB-002 @precondition:login-konsultan
  Scenario: Jadwal terdekat menampilkan sesi mendatang yang paling dekat
    Given konsultan uji punya sesi terjadwal yang dekat, yang jauh, dan yang sudah lewat
    When pengguna membuka halaman dashboard konsultan
    Then hanya sesi yang paling dekat tampil sebagai jadwal terdekat

  @CDB-003 @precondition:login-konsultan
  Scenario: Permintaan baru tidak menampilkan permintaan yang jadwalnya sudah lewat
    Given konsultan uji menerima permintaan baru dan permintaan yang jadwalnya sudah lewat
    And pengguna berada di halaman dashboard konsultan
    Then hanya permintaan yang jadwalnya belum lewat tampil sebagai permintaan baru
    When pengguna membuka permintaan baru itu
    Then pengguna diarahkan ke halaman permintaan konsultasi itu

  @CDB-004
  Scenario: Konsultan yang verifikasinya ditolak diberi tahu alasannya
    Given verifikasi konsultan baru ditolak dengan sebuah alasan
    And pengguna sudah login sebagai konsultan baru
    And pengguna berada di halaman dashboard konsultan
    Then dashboard konsultan menampilkan penolakan verifikasi beserta alasannya
    When pengguna memilih pengaturan profil dari pemberitahuan penolakan
    Then pengguna diarahkan ke halaman pengaturan profil

  @CDB-005 @precondition:login-konsultan
  Scenario: Gangguan saat memuat statistik tidak merusak dashboard
    Given layanan statistik konsultan sedang mengalami gangguan
    When pengguna membuka halaman dashboard konsultan
    Then dashboard konsultan tetap tampil dengan pendapatan nol
    And halaman tidak mengalami galat
