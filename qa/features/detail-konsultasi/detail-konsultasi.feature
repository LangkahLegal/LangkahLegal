@sit @detail-konsultasi
Feature: Detail konsultasi
  Klien dan konsultan melihat detail sesi, bergabung lewat Zoom, dan klien menutup sesi dengan ulasan.

  @CON-001 @critical @precondition:login-klien
  Scenario: Klien melihat detail sesi terjadwal dan bergabung lewat Zoom
    Given klien punya konsultasi berstatus terjadwal
    And konsultasi itu punya tautan Zoom dan dokumen pendukung
    And pengguna berada di halaman detail konsultasi itu
    Then detail konsultasi menampilkan status, deskripsi kasus, dokumen, dan tautan Zoom
    When pengguna bergabung ke sesi konsultasi
    Then tautan Zoom terbuka di tab baru

  @CON-002 @precondition:login-klien
  Scenario: Klien menyalin tautan Zoom
    Given klien punya konsultasi berstatus terjadwal
    And konsultasi itu punya tautan Zoom dan dokumen pendukung
    And pengguna berada di halaman detail konsultasi itu
    When pengguna menyalin tautan Zoom
    Then tautan Zoom tersalin ke papan klip

  @CON-003 @precondition:login-klien
  Scenario: Klien menutup sesi dengan rating dan ulasan
    Given klien punya konsultasi berstatus terjadwal
    And pengguna berada di halaman detail konsultasi itu
    When pengguna memberi rating dan ulasan untuk sesi itu
    Then formulir ulasan tertutup
    And ulasan tersimpan di database untuk konsultasi itu

  @CON-003 @precondition:login-klien
  Scenario: Ulasan tidak dapat dikirim sebelum rating dipilih
    Given klien punya konsultasi berstatus terjadwal
    And pengguna berada di halaman detail konsultasi itu
    When pengguna membuka formulir ulasan
    Then ulasan belum dapat dikirim

  @CON-004 @precondition:login-klien
  Scenario: Ulasan dibatasi panjangnya
    Given klien punya konsultasi berstatus terjadwal
    And pengguna berada di halaman detail konsultasi itu
    When pengguna menulis ulasan yang melebihi batas panjang
    Then ulasan dipotong sesuai batas panjangnya

  @CON-005 @precondition:login-klien
  Scenario: Ulasan kedua untuk sesi yang sama ditolak
    Given klien punya konsultasi berstatus terjadwal
    And konsultasi itu sudah pernah diberi ulasan
    And pengguna berada di halaman detail konsultasi itu
    When pengguna memberi rating dan ulasan untuk sesi itu
    Then muncul pemberitahuan "Anda sudah memberikan ulasan untuk sesi konsultasi ini."
    And formulir ulasan tetap terbuka

  @CON-006 @precondition:login-klien
  Scenario: Konsultasi yang dibatalkan tidak menawarkan Zoom maupun ulasan
    Given klien punya konsultasi berstatus dibatalkan
    When pengguna membuka halaman detail konsultasi itu
    Then detail konsultasi menampilkan status dibatalkan tanpa Zoom dan ulasan

  @CON-007 @precondition:login-klien
  Scenario: Konsultasi yang tidak ada menampilkan gagal memuat
    When pengguna membuka halaman detail konsultasi yang tidak ada
    Then detail konsultasi menampilkan gagal memuat dengan pilihan coba lagi

  @CON-008 @precondition:login-konsultan
  Scenario: Konsultan menambahkan tautan Zoom untuk sesi terjadwal
    Given klien punya konsultasi berstatus terjadwal
    And pengguna berada di halaman detail konsultasi itu
    When pengguna menyimpan tautan Zoom untuk sesi itu
    Then tautan Zoom tersimpan di database untuk konsultasi itu

  @CON-009 @precondition:login-konsultan
  Scenario: Tautan Zoom yang bukan alamat web ditolak
    Given klien punya konsultasi berstatus terjadwal
    And pengguna berada di halaman detail konsultasi itu
    When pengguna menyimpan tautan Zoom yang bukan alamat web
    Then tidak ada permintaan simpan tautan Zoom yang dikirim ke backend

  @CON-010 @precondition:login-konsultan
  Scenario: Konsultan tidak ditawari ulasan dan dapat mengurungkan pengisian tautan
    Given klien punya konsultasi berstatus terjadwal
    And pengguna berada di halaman detail konsultasi itu
    When pengguna mengurungkan pengisian tautan Zoom
    Then tautan Zoom tetap belum tersedia
    And konsultan tidak ditawari memberi ulasan
