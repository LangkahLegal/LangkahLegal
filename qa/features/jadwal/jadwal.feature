@sit @jadwal @precondition:login-konsultan
Feature: Jadwal praktik konsultan
  Konsultan mengatur slot jadwal dan status ketersediaannya menerima konsultasi.

  @SCH-001 @mobile
  Scenario: Halaman jadwal menampilkan status ketersediaan dan kalender bulan ini
    Given konsultan uji belum membuka jadwal praktik
    When pengguna membuka halaman jadwal
    Then halaman jadwal menampilkan status menerima konsultasi dan kalender bulan ini

  @SCH-002 @critical
  Scenario: Konsultan menambah slot jadwal baru
    Given konsultan uji belum membuka jadwal praktik
    And pengguna berada di halaman jadwal
    When pengguna menambah slot jadwal pada bulan depan
    Then muncul pemberitahuan "Jadwal baru berhasil ditambahkan!"
    And slot jadwal baru tersimpan di database

  @SCH-003 @fail @BUG-38
  Scenario: Konsultan meliburkan slot yang sudah ada
    Given konsultan uji punya slot jadwal pada bulan depan
    And pengguna berada di halaman jadwal
    When pengguna meliburkan slot jadwal itu
    Then muncul pemberitahuan "Jadwal berhasil diperbarui!"
    And slot jadwal itu tersimpan sebagai libur

  @SCH-004
  Scenario: Slot yang sudah dipesan klien tidak dapat diubah
    Given konsultan uji punya slot jadwal bulan depan yang sudah dipesan klien
    And pengguna berada di halaman jadwal
    When pengguna membuka slot jadwal yang sudah dipesan itu
    Then slot jadwal itu hanya bisa dilihat

  @SCH-005 @fail @BUG-15
  Scenario: Slot dengan jam selesai sebelum jam mulai ditolak
    Given konsultan uji belum membuka jadwal praktik
    And pengguna berada di halaman jadwal
    When pengguna menambah slot dengan jam selesai sebelum jam mulai
    Then tidak ada permintaan tambah jadwal yang dikirim ke backend

  @SCH-006 @fail @BUG-15
  Scenario: Slot tidak dapat ditambah pada tanggal yang sudah lewat
    Given pengguna berada di halaman jadwal
    When pengguna memilih tanggal pada bulan lalu
    Then formulir slot jadwal tidak terbuka

  @SCH-007 @fail @BUG-08
  Scenario: Status tidak menerima konsultasi tersimpan
    Given pengguna berada di halaman jadwal
    When pengguna menonaktifkan penerimaan konsultasi
    Then status tidak menerima konsultasi tersimpan ke backend

  @SCH-008 @stub
  Scenario: Slot yang bentrok diberitahukan ke konsultan
    Given layanan tambah jadwal menolak dengan pesan "bentrok"
    And pengguna berada di halaman jadwal
    When pengguna menambah slot jadwal yang bentrok
    Then muncul pemberitahuan "Gagal menambah jadwal. Pastikan jam tidak bertabrakan."

  @SCH-009 @fail @BUG-32
  Scenario: Berpindah bulan dari tanggal 31 tidak melompati bulan
    Given hari ini di browser adalah tanggal 31 Januari
    And pengguna berada di halaman jadwal
    When pengguna berpindah ke bulan berikutnya di kalender
    Then kalender menampilkan bulan Februari

  @SCH-010
  Scenario: Formulir slot jadwal dapat ditutup tanpa menyimpan
    Given konsultan uji belum membuka jadwal praktik
    And pengguna berada di halaman jadwal
    When pengguna membuka lalu menutup formulir slot jadwal
    Then formulir slot jadwal tidak terbuka
    And tidak ada permintaan tambah jadwal yang dikirim ke backend
