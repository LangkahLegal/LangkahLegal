@sit @pengaturan-profil
Feature: Pengaturan profil
  Klien dan konsultan memperbarui data diri; konsultan juga memperbarui kredensial profesionalnya.

  # Unggahan foto memakai layanan pihak ketiga (ImgBB), jadi jawabannya disimulasikan (@stub).

  @PRF-001 @critical @precondition:login-klien
  Scenario: Klien mengubah namanya
    Given pengguna berada di halaman pengaturan profil
    When pengguna mengganti namanya lalu menyimpan profil
    Then pengguna diarahkan ke halaman pengaturan
    And nama baru klien tersimpan di database

  @PRF-001 @precondition:login-klien
  Scenario: Formulir profil klien tidak memuat kredensial konsultan
    When pengguna membuka halaman pengaturan profil
    Then formulir profil terisi data klien tanpa bagian kredensial profesional

  @PRF-002 @precondition:login-klien
  Scenario: Email tidak dapat diubah dari formulir profil
    When pengguna membuka halaman pengaturan profil
    Then kolom email profil hanya bisa dibaca

  @PRF-003
  Scenario: Konsultan memperbarui kredensial profesional dan portofolionya
    Given pengguna sudah login sebagai konsultan baru
    And pengguna berada di halaman pengaturan profil
    When pengguna memperbarui kredensial profesional dan portofolionya
    Then pengguna diarahkan ke halaman pengaturan
    And kredensial profesional konsultan tersimpan di database beserta portofolionya

  @PRF-004
  Scenario: Tarif dan pengalaman bernilai negatif tidak tersimpan
    Given pengguna sudah login sebagai konsultan baru
    And pengguna berada di halaman pengaturan profil
    When pengguna mengisi tarif dan pengalaman dengan nilai negatif lalu menyimpan profil
    Then nilai negatif tidak tersimpan di database

  @PRF-005 @precondition:login-klien
  Scenario: Kegagalan menyimpan profil diberitahukan ke pengguna
    Given layanan simpan profil sedang mengalami gangguan
    And pengguna berada di halaman pengaturan profil
    When pengguna menyimpan profil tanpa perubahan
    Then muncul pemberitahuan "Gagal menyimpan perubahan."
    And pengguna tetap berada di halaman pengaturan profil

  @PRF-006 @precondition:login-klien
  Scenario: Foto profil yang terlalu besar ditolak
    Given pengguna berada di halaman pengaturan profil
    When pengguna mengunggah foto profil yang terlalu besar
    Then muncul pemberitahuan "File terlalu besar (max 2MB)"

  @PRF-006 @stub @precondition:login-klien
  Scenario: Foto profil baru tersimpan dan tampil
    Given layanan unggah foto menerima foto profil
    And pengguna berada di halaman pengaturan profil
    When pengguna mengunggah foto profil baru
    Then foto profil baru tampil di halaman
    And alamat foto baru tersimpan di database

  @PRF-007 @stub @precondition:login-klien
  Scenario: Kegagalan mengunggah foto diberitahukan ke pengguna
    Given layanan unggah foto menolak foto profil
    And pengguna berada di halaman pengaturan profil
    When pengguna mengunggah foto profil baru
    Then muncul pemberitahuan "Gagal sinkronisasi foto."
    And tidak ada permintaan simpan profil yang dikirim ke backend

  @PRF-008
  Scenario: Konsultan yang ditolak melihat alasan penolakan di profilnya
    Given verifikasi konsultan baru ditolak dengan sebuah alasan
    And pengguna sudah login sebagai konsultan baru
    When pengguna membuka halaman pengaturan profil
    Then profil menampilkan penolakan verifikasi beserta alasannya

  @PRF-009 @precondition:login-klien
  Scenario: Label kolom profil terhubung ke kolomnya
    When pengguna membuka halaman pengaturan profil
    Then kolom nama dan email dapat ditemukan lewat labelnya
