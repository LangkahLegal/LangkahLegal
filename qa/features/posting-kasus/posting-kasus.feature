@sit @posting-kasus @precondition:login-klien
Feature: Posting kasus ke bursa
  Klien yang belum punya konsultan memposting kasusnya secara anonim agar diambil konsultan.

  @BPO-001 @mobile
  Scenario: Formulir posting kasus menjelaskan bahwa kasus diposting anonim
    When pengguna membuka halaman posting kasus
    Then formulir posting kasus menampilkan pilihan kategori dan keterangan anonim

  @BPO-002 @critical
  Scenario: Klien memposting kasus lengkap dengan dokumen
    Given klien belum punya konsultasi
    And pengguna berada di halaman posting kasus
    When pengguna memposting kasus pidana dengan jadwal dan dokumen
    Then posting kasus dikonfirmasi berhasil
    And kasus tersimpan terbuka di bursa sesuai isian klien
    When pengguna kembali ke dashboard dari konfirmasi posting
    Then pengguna diarahkan ke halaman dashboard klien

  @BPO-003
  Scenario: Posting tanpa isian apa pun ditolak
    Given pengguna berada di halaman posting kasus
    When pengguna memposting kasus tanpa mengisi apa pun
    Then muncul pemberitahuan "Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam)."
    And tidak ada permintaan posting kasus yang dikirim ke backend

  @BPO-003
  Scenario: Posting tanpa jadwal ditolak
    Given pengguna berada di halaman posting kasus
    When pengguna memposting kasus tanpa memilih jadwal
    Then muncul pemberitahuan "Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam)."
    And tidak ada permintaan posting kasus yang dikirim ke backend

  @BPO-004 @stub
  Scenario: Penolakan backend saat memposting diberitahukan ke klien
    Given layanan posting kasus menolak dengan pesan "Hanya client yang dapat memposting kasus"
    And pengguna berada di halaman posting kasus
    When pengguna memposting kasus pidana dengan jadwal dan dokumen
    Then muncul pemberitahuan "Hanya client yang dapat memposting kasus"
    And pengguna tetap berada di halaman posting kasus

  @BPO-005
  Scenario: Jam yang bentrok dengan konsultasi klien sendiri tidak ditawarkan
    Given klien sudah punya sesi konsultasi besok
    And pengguna berada di halaman posting kasus
    When pengguna melihat pilihan jam untuk besok
    Then jam yang bentrok dengan sesinya ditandai terisi

  @BPO-006
  Scenario: Jam yang sudah lewat hari ini tidak ditawarkan
    Given waktu di browser menunjukkan siang hari
    And pengguna berada di halaman posting kasus
    When pengguna melihat pilihan jam untuk hari ini
    Then hanya jam yang belum lewat yang bisa dipilih

  @BPO-007
  Scenario: Jumlah dokumen pendukung dibatasi
    Given pengguna berada di halaman posting kasus
    When pengguna melampirkan dokumen melebihi batas jumlah
    Then muncul pemberitahuan "Maksimal 10 file"
    And hanya dokumen sebanyak batas yang masuk daftar lampiran
