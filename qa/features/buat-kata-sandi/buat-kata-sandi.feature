@sit @buat-kata-sandi
Feature: Buat kata sandi
  Pengguna yang masuk lewat Google dapat membuat kata sandi untuk akunnya.

  @AUTH-035
  Scenario: Kata sandi dengan format tidak valid ditolak
    Given pengguna berada di halaman buat kata sandi
    When pengguna membuat kata sandi dengan format tidak valid
    Then setiap kata sandi itu ditolak dengan pesan yang sesuai

  @AUTH-036 @precondition:login-klien-sementara-tanpa-kata-sandi
  Scenario: Kata sandi yang valid tersimpan lalu pengguna menuju dashboard
    Given pengguna diminta membuat kata sandi setelah masuk lewat Google
    And pengguna berada di halaman buat kata sandi
    When pengguna membuat kata sandi yang valid
    Then tidak ada pesan galat buat kata sandi
    And pengguna diarahkan ke halaman dashboard klien
