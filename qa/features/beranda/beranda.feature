@sit @beranda
Feature: Beranda
  Pengunjung dapat mengenal LangkahLegal tanpa harus login.

  @PUB-001 @mobile
  Scenario: Beranda tampil lengkap untuk pengunjung
    Given pengguna berada di halaman beranda
    Then beranda menampilkan seluruh bagian utamanya
    And halaman tidak mengalami galat

  @PUB-002
  Scenario: Pengunjung memulai pendaftaran dari beranda
    Given pengguna berada di halaman beranda
    When pengguna memilih mulai sekarang
    Then pengguna diarahkan ke halaman pemilihan peran

  @PUB-003
  Scenario: Pengunjung menuju login dari navbar
    Given pengguna berada di halaman beranda
    When pengguna memilih masuk dari navbar
    Then pengguna diarahkan ke halaman login

  @PUB-004 @precondition:login-konsultan
  Scenario: Konsultan yang sudah login menuju dashboardnya dari navbar
    Given pengguna berada di halaman beranda
    When pengguna memilih dashboard dari navbar
    Then pengguna diarahkan ke halaman dashboard konsultan

  @PUB-005
  Scenario: Pengguna yang perannya belum diketahui diminta memilih peran
    Given pengguna sudah login sebagai klien tanpa peran tersimpan di browser
    And pengguna berada di halaman beranda
    When pengguna memilih dashboard dari navbar
    Then pengguna diarahkan ke halaman pemilihan peran

  @PUB-006
  Scenario: Jawaban FAQ dapat dibuka dan ditutup
    Given pengguna berada di halaman beranda
    When pengguna membuka sebuah pertanyaan FAQ
    Then jawaban pertanyaan itu tampil
    When pengguna menutup pertanyaan FAQ itu
    Then jawaban pertanyaan itu tersembunyi

  @PUB-007
  Scenario: Tautan layanan di navbar membawa pengunjung ke bagian fitur
    Given pengguna berada di halaman beranda
    When pengguna memilih tautan layanan di navbar
    Then bagian fitur terlihat di layar

  @PUB-008 @mobile
  Scenario: Beranda pas dengan lebar layar
    Given pengguna berada di halaman beranda
    Then beranda tidak dapat digulir ke samping
