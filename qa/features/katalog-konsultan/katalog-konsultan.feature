@sit @katalog-konsultan @precondition:login-klien
Feature: Katalog konsultan
  Klien mencari dan menyaring konsultan sebelum memesan konsultasi.

  # Katalog berisi data sungguhan, jadi skenario memeriksa konsultan uji dan sifat hasil pencarian,
  # bukan jumlah kartu yang pasti.

  @EXP-001 @critical @mobile
  Scenario: Konsultan aktif tampil di katalog beserta tarifnya
    Given pengguna berada di halaman katalog konsultan
    When pengguna mencari konsultan uji berdasarkan namanya
    Then konsultan uji tampil di katalog beserta tarifnya

  @EXP-002
  Scenario: Pencarian nama tidak membedakan huruf besar dan kecil
    Given pengguna berada di halaman katalog konsultan
    When pengguna mencari konsultan uji dengan kapitalisasi yang berbeda
    Then konsultan uji tampil di katalog

  @EXP-003
  Scenario: Konsultan dapat dicari berdasarkan keahlian
    Given pengguna berada di halaman katalog konsultan
    When pengguna mencari berdasarkan keahlian konsultan uji
    Then setiap konsultan yang tampil cocok dengan keahlian itu

  @EXP-004
  Scenario: Pencarian tanpa hasil menampilkan keadaan kosong
    Given pengguna berada di halaman katalog konsultan
    When pengguna mencari kata yang tidak cocok dengan konsultan mana pun
    Then katalog menampilkan keadaan kosong

  @EXP-005
  Scenario: Kata pencarian yang tidak wajar tidak merusak katalog
    Given pengguna berada di halaman katalog konsultan
    When pengguna mencari dengan kata yang sangat panjang, berisi skrip, perintah SQL, dan emoji
    Then setiap pencarian itu berakhir dengan keadaan kosong
    And tidak ada dialog yang muncul
    And halaman tidak mengalami galat

  @EXP-006
  Scenario: Katalog dapat disaring berdasarkan kategori hukum
    Given pengguna berada di halaman katalog konsultan
    When pengguna menyaring katalog berdasarkan kategori konsultan uji
    Then katalog diminta ke backend dengan kategori itu
    And setiap konsultan yang tampil cocok dengan keahlian itu

  @EXP-007
  Scenario: Saringan verifikasi dan tarif dapat dipakai lalu diatur ulang
    Given pengguna berada di halaman katalog konsultan
    When pengguna menyaring konsultan terverifikasi pada rentang tarif konsultan uji
    Then konsultan uji tampil di katalog
    When pengguna mengatur ulang saringan katalog
    Then saringan katalog kembali ke keadaan awal

  @EXP-008
  Scenario: Rentang tarif yang terbalik tidak menghasilkan konsultan
    Given pengguna berada di halaman katalog konsultan
    When pengguna menyaring dengan tarif minimum di atas tarif maksimum
    Then katalog menampilkan keadaan kosong

  @EXP-009 @stub
  Scenario: Foto profil dengan alamat berbahaya tidak dipakai
    Given katalog berisi konsultan dengan foto profil berbahaya
    When pengguna membuka halaman katalog konsultan
    Then foto konsultan itu diganti gambar bawaan

  @EXP-010 @stub
  Scenario: Konsultan tanpa nama tidak merusak katalog
    Given katalog berisi konsultan dengan nama yang kosong
    When pengguna membuka halaman katalog konsultan
    Then konsultan lain tetap tampil di katalog
    And halaman tidak mengalami galat

  @EXP-011 @fail @BUG-18
  Scenario: Gangguan saat memuat katalog diberitahukan ke klien
    Given layanan katalog konsultan sedang mengalami gangguan
    When pengguna membuka halaman katalog konsultan
    Then katalog menampilkan pesan gagal memuat

  @EXP-012
  Scenario: Klien membuka profil konsultan dari katalog
    Given pengguna berada di halaman katalog konsultan
    When pengguna mencari konsultan uji berdasarkan namanya
    And pengguna membuka profil konsultan uji dari katalog
    Then pengguna diarahkan ke halaman profil konsultan uji
