@sit @detail-dokumen @precondition:login-admin
Feature: Detail dokumen hukum
  Admin membaca pasal-pasal sebuah dokumen hukum dan memperbaiki isinya.

  @KNW-008
  Scenario: Admin membaca seluruh pasal sebuah dokumen
    Given basis pengetahuan berisi dokumen uji
    When pengguna membuka detail dokumen uji
    Then detail dokumen menampilkan identitas dokumen uji
    When pengguna membuka semua pasal
    Then isi setiap pasal dokumen uji tampil

  # Menyimpan pasal membuat embedding baru lewat layanan pihak ketiga.
  @KNW-008 @layanan-eksternal
  Scenario: Admin memperbaiki isi sebuah pasal
    Given basis pengetahuan berisi dokumen uji
    And pengguna membuka detail dokumen uji
    When pengguna menyunting isi pasal pertama
    Then muncul keterangan perubahan pasal berhasil disimpan
    And isi pasal pertama tersimpan di database

  @KNW-009
  Scenario: Detail dokumen tanpa dokumen yang dipilih menampilkan keadaan kosong
    When pengguna membuka halaman detail dokumen
    Then detail dokumen menampilkan keadaan kosong
