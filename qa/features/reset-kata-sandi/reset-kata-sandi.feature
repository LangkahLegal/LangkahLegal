@sit @reset-kata-sandi
Feature: Reset kata sandi
  Pengguna mengganti kata sandi dari tautan reset yang diterimanya.

  @AUTH-031
  Scenario: Halaman reset tanpa tautan yang sah ditolak
    Given pengguna berada di halaman reset kata sandi
    Then tautan reset dinyatakan tidak valid
    And pengguna dapat meminta tautan reset baru

  @AUTH-032
  Scenario: Tautan reset yang sudah tidak berlaku ditolak
    When pengguna membuka tautan reset yang sudah tidak berlaku
    Then pengguna diberi tahu tautan reset sudah kedaluwarsa

  @AUTH-033 @precondition:pengguna-reset-kata-sandi
  Scenario: Kata sandi baru dengan format tidak valid ditolak
    Given pengguna membuka tautan reset yang diterimanya
    When pengguna menyimpan kata sandi baru dengan format tidak valid
    Then setiap kata sandi itu ditolak dengan pesan yang sesuai
    And tidak ada permintaan reset kata sandi yang dikirim ke backend

  @AUTH-034 @precondition:pengguna-reset-kata-sandi
  Scenario: Kata sandi berhasil direset lalu dapat dipakai untuk login
    Given pengguna membuka tautan reset yang diterimanya
    When pengguna menyimpan kata sandi baru yang valid
    Then muncul pemberitahuan "Password berhasil diubah"
    And pengguna diarahkan ke halaman login
    And kata sandi baru dapat dipakai untuk login

  @AUTH-043 @precondition:pengguna-reset-kata-sandi
  Scenario: Label formulir reset terhubung ke kolom yang benar
    Given pengguna membuka tautan reset yang diterimanya
    When pengguna memilih label konfirmasi kata sandi baru
    Then kolom konfirmasi kata sandi baru menjadi aktif
    And setiap kolom formulir reset punya id unik
