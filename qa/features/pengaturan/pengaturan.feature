@sit @pengaturan
Feature: Pengaturan akun
  Pengguna melihat ringkasan akunnya, mengganti tema, membuka sub-pengaturan, dan keluar dari aplikasi.

  @SET-001 @critical @mobile @precondition:login-klien
  Scenario: Halaman pengaturan menampilkan akun dan seluruh menu
    When pengguna membuka halaman pengaturan
    Then pengaturan menampilkan nama, email, dan seluruh menu pengaturan

  @SET-002 @precondition:login-konsultan
  Scenario: Konsultan terverifikasi melihat status verifikasinya
    When pengguna membuka halaman pengaturan
    Then pengaturan menampilkan status terverifikasi

  @SET-003 @precondition:login-klien
  Scenario: Tema gelap tetap aktif setelah halaman dimuat ulang
    Given pengguna berada di halaman pengaturan
    When pengguna mengganti tema aplikasi
    Then aplikasi memakai tema gelap
    When pengguna memuat ulang halaman
    Then aplikasi memakai tema gelap

  @SET-004 @critical @precondition:login-klien-sementara
  Scenario: Pengguna keluar dari aplikasi
    Given pengguna berada di halaman pengaturan
    When pengguna keluar dari aplikasi
    Then pengguna diarahkan ke halaman login
    And seluruh data sesi terhapus dari browser
    And hanya ada 1 permintaan logout yang dikirim ke backend

  @SET-005 @precondition:login-klien
  Scenario: Pengguna mengurungkan keluar dari aplikasi
    Given pengguna berada di halaman pengaturan
    When pengguna mengurungkan keluar dari aplikasi
    Then pengguna tetap berada di halaman pengaturan
    And tidak ada permintaan logout yang dikirim ke backend

  @SET-005 @precondition:login-klien-sementara
  Scenario: Sesi tetap dibersihkan walau layanan logout bermasalah
    Given layanan logout sedang mengalami gangguan
    And pengguna berada di halaman pengaturan
    When pengguna keluar dari aplikasi
    Then pengguna diarahkan ke halaman login
    And seluruh data sesi terhapus dari browser

  @SET-006 @precondition:login-klien
  Scenario: Tema tidak berubah saat area kosong diklik
    Given pengguna berada di halaman pengaturan
    When pengguna mengklik area kosong halaman
    Then aplikasi tetap memakai tema terang

  @SET-007 @precondition:login-klien
  Scenario: Setiap menu pengaturan membuka halamannya
    When pengguna membuka setiap menu pengaturan
    Then setiap menu membuka halaman pengaturannya
