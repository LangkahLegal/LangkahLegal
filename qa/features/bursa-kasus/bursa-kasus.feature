@sit @bursa-kasus
Feature: Bursa kasus
  Konsultan melihat kasus terbuka yang diposting klien dan mengklaim kasus yang ingin ditanganinya.

  # Bursa berisi data sungguhan, jadi skenario memeriksa kasus yang diposting klien uji.

  @BUR-001 @critical @mobile @precondition:login-konsultan
  Scenario: Kasus terbuka tampil anonim beserta dokumennya
    Given klien uji memposting beberapa kasus ke bursa
    When pengguna membuka halaman bursa kasus
    Then kasus klien uji tampil anonim di bursa beserta tautan dokumennya

  @BUR-002 @precondition:login-konsultan
  Scenario: Bursa dapat disaring berdasarkan kategori
    Given klien uji memposting beberapa kasus ke bursa
    And pengguna berada di halaman bursa kasus
    When pengguna menyaring bursa berdasarkan kategori pidana
    Then hanya kasus pidana milik klien uji yang tampil

  @BUR-002 @precondition:login-konsultan
  Scenario: Bursa dapat disaring ke kategori umum
    Given klien uji memposting beberapa kasus ke bursa
    And pengguna berada di halaman bursa kasus
    When pengguna menyaring bursa berdasarkan kategori umum
    Then hanya kasus umum milik klien uji yang tampil

  @BUR-003 @precondition:login-konsultan
  Scenario: Deskripsi kasus yang panjang dapat diperluas dan diciutkan
    Given klien uji memposting beberapa kasus ke bursa
    And pengguna berada di halaman bursa kasus
    Then deskripsi kasus yang panjang tampil terpotong
    When pengguna memperluas deskripsi kasus itu
    Then deskripsi kasus itu tampil utuh
    When pengguna menciutkan deskripsi kasus itu
    Then deskripsi kasus yang panjang tampil terpotong

  @BUR-004 @precondition:login-konsultan
  Scenario: Deskripsi kasus berisi skrip ditampilkan sebagai teks biasa
    Given klien uji memposting beberapa kasus ke bursa
    When pengguna membuka halaman bursa kasus
    Then deskripsi berisi skrip tampil sebagai teks biasa
    And tidak ada dialog yang muncul

  @BUR-005 @precondition:login-konsultan
  Scenario: Konsultan mengurungkan klaim kasus
    Given klien uji memposting beberapa kasus ke bursa
    And pengguna berada di halaman bursa kasus
    When pengguna mengurungkan klaim sebuah kasus
    Then kasus itu tetap terbuka di bursa
    And tidak ada permintaan klaim kasus yang dikirim ke backend

  @BUR-006 @critical @precondition:login-konsultan
  Scenario: Konsultan mengklaim kasus dan membuka konsultasinya
    Given klien uji memposting beberapa kasus ke bursa
    And pengguna berada di halaman bursa kasus
    When pengguna mengklaim sebuah kasus
    Then klaim kasus dikonfirmasi berhasil
    And kasus itu tertutup dan menjadi konsultasi konsultan uji
    When pengguna membuka konsultasi hasil klaim
    Then pengguna diarahkan ke halaman detail konsultasi itu

  @BUR-007 @precondition:login-konsultan
  Scenario: Konsultan kembali ke bursa setelah mengklaim kasus
    Given klien uji memposting beberapa kasus ke bursa
    And pengguna berada di halaman bursa kasus
    When pengguna mengklaim sebuah kasus
    And pengguna kembali ke bursa dari konfirmasi klaim
    Then daftar bursa tampil kembali

  @BUR-008 @precondition:login-konsultan
  Scenario: Kasus yang sudah diambil konsultan lain tidak bisa diklaim
    Given klien uji memposting beberapa kasus ke bursa
    And pengguna berada di halaman bursa kasus
    When konsultan lain lebih dulu mengambil kasus yang hendak diklaim pengguna
    Then muncul pemberitahuan "Kasus ini sudah diklaim oleh konsultan lain"
    And jendela konfirmasi klaim tertutup

  @BUR-009 @precondition:login-konsultan
  Scenario: Gangguan saat memuat bursa diberitahukan ke konsultan
    Given layanan daftar bursa sedang mengalami gangguan
    When pengguna membuka halaman bursa kasus
    Then bursa menampilkan pesan gagal memuat

  @BUR-010 @stub @precondition:login-konsultan
  Scenario: Bursa tanpa kasus menampilkan keadaan kosong
    Given bursa sedang tidak punya kasus terbuka
    When pengguna membuka halaman bursa kasus
    Then bursa menampilkan keadaan kosong
