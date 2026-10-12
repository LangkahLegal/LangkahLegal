@sit @tentang-aplikasi @precondition:login-klien
Feature: Tentang aplikasi
  Pengguna membaca penjelasan tentang LangkahLegal dari menu pengaturan.

  @ABT-001
  Scenario: Halaman tentang aplikasi dapat dibuka dari pengaturan
    When pengguna membuka halaman tentang aplikasi
    Then halaman tentang aplikasi menampilkan penjelasan LangkahLegal
