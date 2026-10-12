@sit @pengaturan-bahasa @precondition:login-klien
Feature: Pengaturan bahasa
  Pengguna memilih bahasa tampilan aplikasi.

  @LNG-001 @fail @BUG-25
  Scenario: Pilihan bahasa Inggris tersimpan
    Given pengguna berada di halaman pengaturan bahasa
    When pengguna memilih bahasa Inggris lalu menyimpannya
    Then pengguna diarahkan ke halaman pengaturan
    When pengguna membuka halaman pengaturan bahasa
    Then bahasa Inggris masih terpilih
