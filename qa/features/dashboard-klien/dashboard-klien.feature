@sit @dashboard-klien @precondition:login-klien
Feature: Dashboard klien
  Klien melihat konsultasi aktifnya dan menuju layanan utama dari satu halaman.

  @CLI-001 @critical @mobile
  Scenario: Klien tanpa konsultasi melihat sapaan dan layanan unggulan
    Given klien belum punya konsultasi
    When pengguna membuka halaman dashboard klien
    Then dashboard klien menampilkan sapaan, layanan unggulan, dan kartu konsultasi kosong
    And halaman tidak mengalami galat

  @CLI-002
  Scenario: Klien tanpa konsultasi mencari konsultan dari dashboard
    Given klien belum punya konsultasi
    And pengguna berada di halaman dashboard klien
    When pengguna memilih cari konsultan
    Then pengguna diarahkan ke halaman katalog konsultan

  @CLI-003
  Scenario: Dashboard menampilkan pengajuan aktif, bukan konsultasi yang sudah selesai
    Given klien punya konsultasi selesai dan pengajuan baru yang masih pending
    When pengguna membuka halaman dashboard klien
    Then kartu konsultasi menampilkan konsultan uji dengan status pending

  @CLI-004
  Scenario: Klien membatalkan pengajuan yang masih pending
    Given klien punya konsultasi berstatus pending
    And pengguna berada di halaman dashboard klien
    When pengguna membatalkan konsultasi itu
    Then muncul pemberitahuan "Konsultasi berhasil dibatalkan."
    And konsultasi itu tersimpan dengan status dibatalkan

  @CLI-005
  Scenario: Klien mengurungkan pembatalan
    Given klien punya konsultasi berstatus pending
    And pengguna berada di halaman dashboard klien
    When pengguna mengurungkan pembatalan konsultasi itu
    Then tidak ada permintaan ubah status konsultasi yang dikirim ke backend
    And konsultasi itu tersimpan dengan status pending

  @CLI-006
  Scenario: Klien melanjutkan ke pembayaran dari dashboard
    Given klien punya konsultasi berstatus menunggu pembayaran
    And pengguna berada di halaman dashboard klien
    When pengguna memilih lanjut pembayaran
    Then pengguna diarahkan ke halaman pembayaran konsultasi itu

  @CLI-007
  Scenario: Konsultasi ditolak yang disembunyikan tetap tersembunyi
    Given klien punya konsultasi berstatus ditolak
    And pengguna berada di halaman dashboard klien
    When pengguna menyembunyikan konsultasi yang ditolak itu
    Then kartu konsultasi kosong tampil
    When pengguna memuat ulang halaman
    Then kartu konsultasi kosong tampil

  @CLI-008
  Scenario: Data tersimpan yang rusak di browser tidak merusak dashboard
    Given klien punya konsultasi berstatus pending
    And daftar konsultasi tersembunyi di browser rusak
    When pengguna membuka halaman dashboard klien
    Then kartu konsultasi menampilkan konsultan uji dengan status pending
    And halaman tidak mengalami galat

  @CLI-009
  Scenario: Gangguan saat memuat konsultasi diberitahukan ke klien
    Given layanan daftar konsultasi sedang mengalami gangguan
    When pengguna membuka halaman dashboard klien
    Then dashboard klien menampilkan pesan gagal memuat

  @CLI-010
  Scenario: Klien menuju katalog konsultan dari layanan unggulan
    Given pengguna berada di halaman dashboard klien
    When pengguna memilih layanan eksplorasi konsultan
    Then pengguna diarahkan ke halaman katalog konsultan

  @CLI-010
  Scenario: Klien menuju pengaturan dari dashboard
    Given pengguna berada di halaman dashboard klien
    When pengguna memilih pengaturan di dashboard
    Then pengguna diarahkan ke halaman pengaturan

  @CLI-011 @mobile @khusus-mobile
  Scenario: Klien berpindah ke riwayat lewat navigasi bawah
    Given pengguna berada di halaman dashboard klien
    When pengguna memilih riwayat di navigasi bawah
    Then pengguna diarahkan ke halaman riwayat klien
