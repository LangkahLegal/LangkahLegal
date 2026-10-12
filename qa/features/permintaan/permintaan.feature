@sit @permintaan @precondition:login-konsultan
Feature: Permintaan konsultasi
  Konsultan meninjau permintaan klien lalu menerima, menolak, atau menjadwalkannya.

  @REQ-001 @critical
  Scenario: Konsultan menerima permintaan klien
    Given klien punya konsultasi berstatus pending
    And konsultasi itu punya tautan Zoom dan dokumen pendukung
    And pengguna berada di halaman permintaan konsultasi itu
    Then permintaan menampilkan klien, deskripsi kasus, dan dokumennya
    When pengguna menerima permintaan itu
    Then permintaan dikonfirmasi diterima
    And konsultasi itu tersimpan dengan status menunggu pembayaran
    When pengguna kembali ke dashboard dari konfirmasi permintaan
    Then pengguna diarahkan ke halaman dashboard konsultan

  @REQ-002
  Scenario: Konsultan menolak permintaan klien
    Given klien punya konsultasi berstatus pending
    And pengguna berada di halaman permintaan konsultasi itu
    When pengguna menolak permintaan itu
    Then permintaan dikonfirmasi ditolak
    And konsultasi itu tersimpan dengan status ditolak

  @REQ-003 @fail @BUG-09
  Scenario: Permintaan yang sedang diproses tidak bisa diterima dua kali
    Given klien punya konsultasi berstatus pending
    And layanan ubah status konsultasi merespons lambat
    And pengguna berada di halaman permintaan konsultasi itu
    When pengguna menerima permintaan itu lalu menekan tombol terima sekali lagi
    Then permintaan dikonfirmasi diterima
    And hanya ada 1 permintaan ubah status konsultasi yang dikirim ke backend

  @REQ-004 @stub
  Scenario: Kegagalan memproses permintaan diberitahukan ke konsultan
    Given klien punya konsultasi berstatus pending
    And layanan ubah status konsultasi menolak dengan pesan "Akses ditolak: Pengajuan ini bukan milik Anda"
    And pengguna berada di halaman permintaan konsultasi itu
    When pengguna menerima permintaan itu
    Then muncul pemberitahuan "Gagal memproses permintaan."
    And permintaan tetap terbuka untuk ditinjau

  @REQ-005
  Scenario: Konsultan menjadwalkan kasus yang diambil dari bursa
    Given konsultan uji mengambil kasus dari bursa dan punya jadwal praktik
    And pengguna berada di halaman permintaan konsultasi itu
    Then permintaan dari bursa belum bisa diterima sebelum dijadwalkan
    When pengguna menjadwalkan kasus itu pada jadwal praktiknya
    Then permintaan dikonfirmasi diterima dan dijadwalkan
    And jadwal kasus itu tersimpan sesuai pilihan konsultan

  @REQ-006
  Scenario: Kasus dari bursa tidak bisa dijadwalkan tanpa jadwal praktik
    Given konsultan uji mengambil kasus dari bursa tanpa punya jadwal praktik
    And pengguna berada di halaman permintaan konsultasi itu
    Then permintaan menjelaskan bahwa belum ada jadwal praktik
    When pengguna memilih menambah jadwal dari permintaan
    Then pengguna diarahkan ke halaman jadwal

  @REQ-007
  Scenario: Permintaan yang tidak ada diberitahukan ke konsultan
    When pengguna membuka halaman permintaan yang tidak ada
    Then permintaan menampilkan pesan data tidak ditemukan
