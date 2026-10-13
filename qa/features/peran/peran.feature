@sit @peran
Feature: Pemilihan peran
  Calon pengguna memilih mendaftar sebagai klien atau konsultan.

  @AUTH-016
  Scenario: Peran klien terpilih sejak awal
    Given pengguna berada di halaman pemilihan peran
    Then peran klien sudah terpilih

  @AUTH-016 @mobile
  Scenario: Memilih peran konsultan membuka formulir pendaftaran konsultan
    Given pengguna berada di halaman pemilihan peran
    When pengguna memilih mendaftar sebagai konsultan
    Then pengguna diarahkan ke halaman pendaftaran
    And formulir pendaftaran konsultan tampil
