@sit @halaman-informasi
Feature: Halaman informasi publik
  Halaman tentang, kebijakan, dan ketentuan dapat dibaca siapa saja.

  @PUB-009 @PUB-010 @PUB-011 @PUB-012
  Scenario: Setiap halaman informasi dapat dibaca tanpa login
    When pengguna membuka setiap halaman informasi
    Then setiap halaman informasi berhasil dimuat dengan judulnya
    And halaman tidak mengalami galat

  @PUB-013
  Scenario: Alamat yang tidak dikenal menampilkan halaman tidak ditemukan
    When pengguna membuka alamat yang tidak dikenal
    Then halaman tidak ditemukan tampil
