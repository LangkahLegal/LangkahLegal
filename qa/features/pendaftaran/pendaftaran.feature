@sit @pendaftaran
Feature: Pendaftaran akun
  Calon pengguna mengisi data diri untuk membuat akun.

  # Pengiriman email pendaftaran disimulasikan (@stub) karena layanan email dibatasi
  # beberapa pesan per jam.

  @AUTH-017
  Scenario: Formulir pendaftaran tidak bisa dibuka tanpa memilih peran
    When pengguna membuka halaman pendaftaran
    Then pengguna diarahkan ke halaman pemilihan peran

  @AUTH-018 @critical @stub
  Scenario: Pendaftaran klien berlanjut ke verifikasi OTP
    Given pengguna sudah memilih mendaftar sebagai klien
    And layanan pendaftaran menerima permintaan
    When pengguna mendaftar dengan data yang valid
    Then pengguna diarahkan ke halaman verifikasi OTP
    And data pendaftaran dikirim lengkap ke backend
    And pendaftaran tercatat menunggu verifikasi

  @AUTH-019 @stub
  Scenario: Email yang sudah terdaftar ditolak
    Given pengguna sudah memilih mendaftar sebagai klien
    And layanan pendaftaran menolak dengan pesan "User already registered"
    When pengguna mendaftar dengan data yang valid
    Then pesan galat pendaftaran adalah "User already registered"
    And pengguna tetap berada di halaman pendaftaran

  @AUTH-020 @stub
  Scenario: Nama beraksara non-Latin dan emoji diterima apa adanya
    Given pengguna sudah memilih mendaftar sebagai konsultan
    And layanan pendaftaran menerima permintaan
    When pengguna mendaftar dengan nama beraksara non-Latin dan emoji
    Then data pendaftaran dikirim lengkap ke backend

  @AUTH-021 @stub
  Scenario: Kata sandi yang terlalu pendek ditolak sebelum dikirim
    Given pengguna sudah memilih mendaftar sebagai klien
    And layanan pendaftaran menolak dengan pesan "Password should be at least 6 characters"
    When pengguna mendaftar dengan kata sandi yang terlalu pendek
    Then tidak ada permintaan pendaftaran yang dikirim ke backend

  @AUTH-022
  Scenario: Pendaftaran tanpa nama ditolak peramban
    Given pengguna sudah memilih mendaftar sebagai klien
    When pengguna mendaftar dengan nama yang kosong
    Then kolom nama pendaftaran ditandai belum diisi
    And tidak ada permintaan pendaftaran yang dikirim ke backend
