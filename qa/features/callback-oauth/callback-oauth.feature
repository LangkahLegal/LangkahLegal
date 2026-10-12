@sit @callback-oauth
Feature: Callback login Google
  Setelah pengguna menyetujui login di Google, aplikasi menukar kode dengan sesi dan mengarahkan sesuai peran.

  # Penukaran kode di Google tidak bisa dijalankan otomatis, jadi jawaban layanan itu
  # disimulasikan (@stub) dengan sesi sungguhan milik akun uji. Sisanya memakai backend sungguhan.

  @AUTH-037
  Scenario: Penolakan akses di Google diberitahukan ke pengguna
    When pengguna kembali dari Google setelah menolak memberi akses
    Then galat callback menampilkan alasan penolakan
    When pengguna memilih kembali ke login
    Then pengguna diarahkan ke halaman login

  @AUTH-038
  Scenario: Callback tanpa kode otorisasi dikembalikan ke login
    When pengguna membuka halaman callback OAuth
    Then pengguna diarahkan ke halaman login

  @AUTH-039 @stub
  Scenario: Pendaftaran konsultan lewat Google berakhir di dashboard konsultan
    Given Google mengenali pengguna sebagai konsultan
    And pendaftaran lewat Google sebagai konsultan sedang berlangsung
    When pengguna kembali dari Google dengan kode otorisasi
    Then pengguna diarahkan ke halaman dashboard konsultan
    And kode otorisasi ditukar bersama kode verifikasinya
    And peran konsultan dikirim ke backend

  @AUTH-040 @stub
  Scenario: Pengguna Google baru tanpa peran otomatis menjadi klien
    Given Google mengenali pengguna sebagai akun tanpa peran
    When pengguna kembali dari Google dengan kode otorisasi
    Then pengguna diarahkan ke halaman dashboard klien
    And peran klien dikirim ke backend
    And akun tanpa peran tersimpan sebagai klien

  @AUTH-041 @stub @fail @BUG-07
  Scenario: Tujuan lanjutan ke situs luar tidak boleh mengalihkan pengguna
    Given Google mengenali pengguna sebagai klien
    When pengguna kembali dari Google dengan tujuan lanjutan ke situs luar
    Then browser tetap berada di aplikasi LangkahLegal

  @AUTH-042
  Scenario: Kode otorisasi yang tidak berlaku diberitahukan ke pengguna
    Given browser masih menyimpan kode verifikasi OAuth
    When pengguna kembali dari Google dengan kode otorisasi yang tidak berlaku
    Then galat callback tampil
    And hanya ada 1 permintaan tukar kode OAuth yang dikirim ke backend
