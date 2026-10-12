@sit @pengaturan-keamanan
Feature: Pengaturan keamanan
  Pengguna mengganti kata sandinya dari halaman keamanan.

  # Skenario yang benar-benar mengganti kata sandi memakai klien sekali pakai,
  # supaya akun uji tetap tidak ikut berubah.

  @SEC-001 @critical @precondition:login-klien-sementara
  Scenario: Pengguna mengganti kata sandi lalu diminta login ulang
    Given pengguna berada di halaman pengaturan keamanan
    When pengguna mengganti kata sandinya
    Then muncul pemberitahuan "Kata sandi berhasil diperbarui!"
    And pengguna diarahkan ke halaman login
    And kata sandi baru pengguna itu dapat dipakai untuk login

  @SEC-002 @precondition:login-klien
  Scenario: Konfirmasi kata sandi yang tidak cocok ditolak
    Given pengguna berada di halaman pengaturan keamanan
    When pengguna mengganti kata sandi dengan konfirmasi yang tidak cocok
    Then muncul pemberitahuan "Konfirmasi password baru tidak cocok."
    And tidak ada permintaan reset kata sandi yang dikirim ke backend

  @SEC-003 @fail @BUG-23 @precondition:login-klien
  Scenario: Aturan panjang minimal kata sandi konsisten
    When pengguna membuka halaman pengaturan keamanan
    Then petunjuk dan validasi kata sandi memakai panjang minimal yang sama

  @SEC-004 @fail @BUG-22 @precondition:login-klien
  Scenario: Mengganti kata sandi mensyaratkan kata sandi saat ini
    When pengguna membuka halaman pengaturan keamanan
    Then pengguna diminta mengisi kata sandi saat ini

  @SEC-005 @precondition:login-klien-sementara
  Scenario: Kata sandi baru yang sama dengan yang lama ditolak
    Given pengguna berada di halaman pengaturan keamanan
    When pengguna mengganti kata sandi dengan kata sandi lamanya
    Then muncul pemberitahuan "New password should be different from the old password."
    And pengguna tetap berada di halaman pengaturan keamanan

  @SEC-006 @fail @BUG-34 @precondition:login-klien-sementara
  Scenario: Sesi di browser dihapus setelah kata sandi diganti
    Given pengguna berada di halaman pengaturan keamanan
    When pengguna mengganti kata sandinya
    Then pengguna diarahkan ke halaman login
    And tidak ada sesi yang tersimpan di browser
