@sit @proteksi-halaman
Feature: Proteksi halaman dan pembatasan peran
  Halaman privat hanya bisa dibuka pengguna yang login, dan setiap peran hanya melihat halamannya sendiri.

  @GRD-001 @critical
  Scenario: Pengunjung yang belum login tidak bisa membuka halaman privat
    Then setiap halaman privat mengarahkan pengunjung ke halaman login

  @GRD-002 @fail @BUG-05
  Scenario: Pengunjung yang membuka halaman verifikasi konsultan diminta login
    When pengguna membuka halaman verifikasi konsultan
    Then pengguna segera diarahkan ke halaman login

  @GRD-003 @fail @BUG-05
  Scenario: Pengunjung yang membuka halaman basis pengetahuan diminta login
    When pengguna membuka halaman basis pengetahuan
    Then pengguna segera diarahkan ke halaman login

  @GRD-004 @fail @BUG-06
  Scenario: Pengunjung yang membuka halaman contoh pembayaran diminta login
    When pengguna membuka halaman contoh pembayaran
    Then pengguna segera diarahkan ke halaman login

  @GRD-005
  Scenario: Pengunjung dapat menjelajahi katalog konsultan
    Given pengguna berada di halaman katalog konsultan
    Then setidaknya satu konsultan tampil di katalog

  @GRD-006
  Scenario: Pengunjung yang bertanya ke Tanya AI diminta login
    Given pengguna berada di halaman tanya AI
    When pengguna bertanya ke Tanya AI
    Then pengguna diminta login terlebih dahulu

  @GRD-007
  Scenario: Klien yang membuka dashboard konsultan dikembalikan ke dashboard klien
    Given pengguna sudah login sebagai klien
    When pengguna membuka halaman dashboard konsultan
    Then pengguna diarahkan ke halaman dashboard klien

  @GRD-008
  Scenario: Klien yang membuka dashboard admin dikembalikan ke dashboard klien
    Given pengguna sudah login sebagai klien
    When pengguna membuka halaman dashboard admin
    Then pengguna diarahkan ke halaman dashboard klien

  @GRD-009
  Scenario: Konsultan yang membuka dashboard klien dikembalikan ke dashboard konsultan
    Given pengguna sudah login sebagai konsultan
    When pengguna membuka halaman dashboard klien
    Then pengguna diarahkan ke halaman dashboard konsultan

  @GRD-010
  Scenario: Konsultan yang membuka dashboard admin dikembalikan ke dashboard konsultan
    Given pengguna sudah login sebagai konsultan
    When pengguna membuka halaman dashboard admin
    Then pengguna diarahkan ke halaman dashboard konsultan

  @GRD-011
  Scenario: Admin yang membuka dashboard klien dikembalikan ke dashboard admin
    Given pengguna sudah login sebagai admin
    When pengguna membuka halaman dashboard klien
    Then pengguna diarahkan ke halaman dashboard admin

  @GRD-012
  Scenario: Pengguna yang perannya belum diketahui diminta memilih peran
    Given pengguna sudah login sebagai klien tanpa peran tersimpan di browser
    When pengguna membuka halaman dashboard klien
    Then pengguna diarahkan ke halaman pemilihan peran

  @GRD-013 @fail @BUG-06
  Scenario: Klien yang membuka jadwal dikembalikan ke dashboard klien
    Given pengguna sudah login sebagai klien
    When pengguna membuka halaman jadwal
    Then pengguna segera diarahkan ke halaman dashboard klien

  @GRD-014 @fail @BUG-06
  Scenario: Klien yang membuka bursa kasus dikembalikan ke dashboard klien
    Given pengguna sudah login sebagai klien
    When pengguna membuka halaman bursa kasus
    Then pengguna segera diarahkan ke halaman dashboard klien

  @GRD-015 @fail @BUG-06
  Scenario: Klien yang membuka verifikasi konsultan dikembalikan ke dashboard klien
    Given pengguna sudah login sebagai klien
    When pengguna membuka halaman verifikasi konsultan
    Then pengguna segera diarahkan ke halaman dashboard klien

  @GRD-016 @fail @BUG-06
  Scenario: Konsultan yang membuka posting kasus dikembalikan ke dashboard konsultan
    Given pengguna sudah login sebagai konsultan
    When pengguna membuka halaman posting kasus
    Then pengguna segera diarahkan ke halaman dashboard konsultan

  @GRD-017 @fail @BUG-06
  Scenario: Konsultan yang membuka basis pengetahuan dikembalikan ke dashboard konsultan
    Given pengguna sudah login sebagai konsultan
    When pengguna membuka halaman basis pengetahuan
    Then pengguna segera diarahkan ke halaman dashboard konsultan
