@sit @login
Feature: Login
  Pengguna terdaftar masuk dengan email dan kata sandi, atau dengan akun Google.

  @AUTH-001 @critical @mobile
  Scenario: Klien berhasil login
    When pengguna login sebagai klien
    Then pengguna diarahkan ke halaman dashboard klien
    And sesi klien tersimpan di browser

  @AUTH-002 @critical
  Scenario: Konsultan berhasil login
    When pengguna login sebagai konsultan
    Then pengguna diarahkan ke halaman dashboard konsultan
    And sesi konsultan tersimpan di browser

  @AUTH-003 @critical
  Scenario: Admin berhasil login
    When pengguna login sebagai admin
    Then pengguna diarahkan ke halaman dashboard admin
    And sesi admin tersimpan di browser

  @AUTH-004
  Scenario: Akun yang belum punya peran diminta memilih peran
    When pengguna login sebagai akun tanpa peran
    Then pengguna diarahkan ke halaman pemilihan peran

  @AUTH-005 @critical
  Scenario: Kata sandi yang salah ditolak
    When pengguna login dengan kata sandi yang salah
    Then pesan galat login adalah "Invalid login credentials"
    And pengguna tetap berada di halaman login
    And tidak ada sesi yang tersimpan di browser
    And pengguna dapat mencoba login kembali

  @AUTH-006
  Scenario: Login tanpa kata sandi ditolak sebelum dikirim
    When pengguna login tanpa mengisi kata sandi
    Then pesan galat login adalah "Password wajib diisi."
    And tidak ada permintaan login yang dikirim ke backend

  @AUTH-007
  Scenario: Login tanpa email ditolak peramban
    When pengguna login dengan email yang kosong
    Then kolom email login ditandai kosong
    And tidak ada permintaan login yang dikirim ke backend

  @AUTH-007
  Scenario: Login dengan email salah format ditolak peramban
    When pengguna login dengan email yang salah format
    Then kolom email login ditandai salah format
    And tidak ada permintaan login yang dikirim ke backend

  @AUTH-008
  Scenario: Gangguan server saat login diberitahukan ke pengguna
    Given layanan login sedang mengalami gangguan
    When pengguna login sebagai klien
    Then pesan galat login tampil
    And pengguna dapat mencoba login kembali
    And halaman tidak mengalami galat

  @AUTH-008
  Scenario: Koneksi terputus saat login diberitahukan ke pengguna
    Given layanan login tidak dapat dihubungi
    When pengguna login sebagai klien
    Then pesan galat login memuat "Network Error"
    And halaman tidak mengalami galat

  @AUTH-009
  Scenario: Login yang sedang diproses tidak bisa dikirim dua kali
    Given layanan login merespons lambat
    When pengguna login sebagai klien
    Then tombol masuk terkunci selama login diproses
    When pengguna menekan tombol masuk sekali lagi
    Then pengguna diarahkan ke halaman dashboard klien
    And hanya ada 1 permintaan login yang dikirim ke backend

  @AUTH-010
  Scenario: Kata sandi dapat ditampilkan dan disembunyikan
    Given pengguna berada di halaman login
    When pengguna mengetik kata sandi login
    Then kata sandi login tersembunyi
    When pengguna memilih menampilkan kata sandi
    Then kata sandi login terlihat
    When pengguna memilih menyembunyikan kata sandi
    Then kata sandi login tersembunyi

  @AUTH-011 @stub
  Scenario: Pesan galat berisi skrip tidak dijalankan browser
    Given layanan login menolak dengan pesan berisi skrip
    When pengguna login dengan kata sandi berisi perintah SQL
    Then pesan galat login menampilkan skrip itu sebagai teks biasa
    And tidak ada dialog yang muncul

  @AUTH-012
  Scenario: Pengguna yang lupa kata sandi menuju halaman pemulihan dari login
    Given pengguna berada di halaman login
    When pengguna memilih tautan lupa kata sandi
    Then pengguna diarahkan ke halaman lupa kata sandi

  @AUTH-012
  Scenario: Pengunjung yang belum punya akun menuju pendaftaran dari login
    Given pengguna berada di halaman login
    When pengguna memilih tautan daftar
    Then pengguna diarahkan ke halaman pemilihan peran

  @AUTH-013 @fail @BUG-14 @precondition:login-klien
  Scenario: Pengguna yang sudah login tidak perlu melihat halaman login lagi
    When pengguna membuka halaman login
    Then pengguna diarahkan ke halaman dashboard klien

  @AUTH-014
  Scenario: Login Google membawa pengguna ke halaman persetujuan Google
    Given pengguna berada di halaman login
    When pengguna memilih masuk dengan Google
    Then browser berpindah ke penyedia login Google
    And Google diminta mengembalikan pengguna ke halaman callback
    And kode verifikasi OAuth tersimpan di browser

  @AUTH-015 @stub
  Scenario: Login Google yang gagal disiapkan diberitahukan ke pengguna
    Given layanan login Google tidak memberikan alamat tujuan
    And pengguna berada di halaman login
    When pengguna memilih masuk dengan Google
    Then pesan galat login adalah "Gagal menyiapkan login Google."
