@sit @lupa-kata-sandi
Feature: Lupa kata sandi
  Pengguna yang lupa kata sandi meminta tautan reset lewat email.

  # Pengiriman email reset disimulasikan (@stub) karena layanan email dibatasi beberapa pesan per jam.

  @AUTH-029 @stub
  Scenario: Permintaan tautan reset dikonfirmasi ke pengguna
    Given layanan lupa kata sandi menerima permintaan
    And pengguna berada di halaman lupa kata sandi
    When pengguna meminta tautan reset untuk emailnya
    Then konfirmasi tautan terkirim tampil beserta emailnya
    And tautan reset diminta mengarah ke halaman reset kata sandi

  @AUTH-030
  Scenario: Permintaan tautan reset tanpa email ditolak peramban
    Given pengguna berada di halaman lupa kata sandi
    When pengguna meminta tautan reset tanpa mengisi email
    Then tidak ada permintaan lupa kata sandi yang dikirim ke backend

  @AUTH-030 @stub
  Scenario: Penolakan backend saat meminta tautan reset diberitahukan ke pengguna
    Given layanan lupa kata sandi menolak dengan pesan "User not found"
    And pengguna berada di halaman lupa kata sandi
    When pengguna meminta tautan reset untuk emailnya
    Then pengguna melihat pesan "User not found"
