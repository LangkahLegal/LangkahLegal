@sit @verifikasi-otp
Feature: Verifikasi OTP
  Pendaftar memverifikasi email dengan kode OTP sebelum masuk ke aplikasi.

  @AUTH-023 @critical @precondition:calon-konsultan-menunggu-otp
  Scenario: Konsultan baru memverifikasi kode OTP lalu masuk ke dashboard
    Given pengguna berada di halaman verifikasi OTP
    When pengguna memverifikasi kode OTP yang diterimanya
    Then pengguna diarahkan ke halaman dashboard konsultan
    And akun baru tersimpan sebagai konsultan

  @AUTH-023
  Scenario: Verifikasi belum bisa dikirim sebelum kode diisi
    Given pengguna berada di halaman verifikasi OTP
    Then tombol verifikasi belum dapat ditekan

  @AUTH-024
  Scenario: Kotak OTP menolak karakter selain huruf dan angka
    Given pengguna berada di halaman verifikasi OTP
    When pengguna mengetik karakter selain huruf dan angka pada kotak OTP pertama
    Then kotak OTP pertama tetap kosong

  @AUTH-024
  Scenario: Fokus kotak OTP berpindah mengikuti ketikan
    Given pengguna berada di halaman verifikasi OTP
    When pengguna mengetik satu angka pada kotak OTP pertama
    Then fokus berpindah ke kotak OTP kedua
    When pengguna menghapus dari kotak OTP yang kosong
    Then fokus kembali ke kotak OTP pertama

  @AUTH-025
  Scenario: Kode OTP yang ditempel mengisi semua kotak
    Given pengguna berada di halaman verifikasi OTP
    When pengguna menempel kode OTP yang mengandung spasi
    Then semua kotak OTP terisi tanpa spasi
    And tombol verifikasi dapat ditekan

  @AUTH-026
  Scenario: Kode OTP yang salah ditolak
    Given sebuah pendaftaran sedang menunggu verifikasi
    And pengguna berada di halaman verifikasi OTP
    When pengguna memverifikasi kode OTP yang salah
    Then pesan galat verifikasi tampil
    And pengguna tetap berada di halaman verifikasi OTP

  @AUTH-027 @stub
  Scenario: Kode OTP dapat diminta ulang
    Given sebuah pendaftaran sedang menunggu verifikasi
    And layanan kirim ulang OTP menerima permintaan
    And pengguna berada di halaman verifikasi OTP
    When pengguna meminta kode OTP dikirim ulang setelah mengisi sebagian kotak
    Then kode baru diminta untuk email pendaftaran itu
    And kotak OTP dikosongkan

  @AUTH-028
  Scenario: Verifikasi tanpa pendaftaran yang tertunda dikembalikan ke login
    Given pengguna berada di halaman verifikasi OTP
    When pengguna memverifikasi kode OTP yang salah
    Then pengguna diarahkan ke halaman login
    And tidak ada permintaan verifikasi OTP yang dikirim ke backend
