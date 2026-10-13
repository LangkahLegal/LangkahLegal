@sit @pembayaran @precondition:login-klien
Feature: Pembayaran konsultasi
  Klien membayar konsultasi yang sudah disetujui konsultan lewat Midtrans.

  # Jendela pembayaran Midtrans tidak bisa diisi otomatis, jadi hasilnya disimulasikan (@stub).
  # Pembuatan transaksi dan pembacaan status tetap memakai backend sungguhan.

  @PAY-001 @critical @mobile
  Scenario: Halaman pembayaran menampilkan konsultan dan rincian biaya
    Given klien punya konsultasi berstatus menunggu pembayaran
    When pengguna membuka halaman pembayaran konsultasi itu
    Then halaman pembayaran menampilkan konsultan, rincian biaya, dan tombol bayar

  @PAY-002 @critical @stub
  Scenario: Klien menyelesaikan pembayaran
    Given klien punya konsultasi berstatus menunggu pembayaran
    And Midtrans akan menyelesaikan pembayaran
    And pengguna berada di halaman pembayaran konsultasi itu
    When pengguna membayar konsultasi
    Then pembayaran dikonfirmasi berhasil
    And transaksi tercatat di database untuk konsultasi itu
    When pengguna kembali ke dashboard dari konfirmasi pembayaran
    Then pengguna diarahkan ke halaman dashboard klien

  @PAY-003 @stub
  Scenario: Pembayaran yang belum diselesaikan mengembalikan klien ke dashboard
    Given klien punya konsultasi berstatus menunggu pembayaran
    And Midtrans akan menunda pembayaran
    And pengguna berada di halaman pembayaran konsultasi itu
    When pengguna membayar konsultasi
    Then muncul pemberitahuan "Pembayaran tertunda"
    And pengguna diarahkan ke halaman dashboard klien

  @PAY-004 @stub
  Scenario: Pembayaran yang ditolak dapat dicoba kembali
    Given klien punya konsultasi berstatus menunggu pembayaran
    And Midtrans akan menolak pembayaran
    And pengguna berada di halaman pembayaran konsultasi itu
    When pengguna membayar konsultasi
    Then muncul pemberitahuan "Pembayaran gagal. Silakan coba lagi."
    And pengguna masih dapat membayar konsultasi

  @PAY-005
  Scenario: Konsultasi yang belum disetujui tidak dapat dibayar
    Given klien punya konsultasi berstatus pending
    And pengguna berada di halaman pembayaran konsultasi itu
    When pengguna membayar konsultasi
    Then muncul pemberitahuan "Pengajuan tidak dalam status yang memerlukan pembayaran"
    And jendela pembayaran Midtrans tidak dibuka

  @PAY-006
  Scenario: Konsultasi yang sudah lunas langsung menampilkan konfirmasi
    Given klien punya konsultasi berstatus terjadwal
    And pembayaran konsultasi itu sudah lunas
    When pengguna membuka halaman pembayaran konsultasi itu
    Then pembayaran dikonfirmasi berhasil

  @PAY-012
  Scenario: Pelunasan terdeteksi tanpa memuat ulang halaman
    Given klien punya konsultasi berstatus menunggu pembayaran
    And pembayaran konsultasi itu masih tertunda
    And pengguna berada di halaman pembayaran konsultasi itu
    When pembayaran itu dilunasi di luar aplikasi
    Then pembayaran dikonfirmasi berhasil

  @PAY-007
  Scenario: Layanan pembayaran yang tidak tersedia diberitahukan ke klien
    Given klien punya konsultasi berstatus menunggu pembayaran
    And layanan pembayaran Midtrans tidak dapat dimuat
    And pengguna berada di halaman pembayaran konsultasi itu
    When pengguna membayar konsultasi
    Then pengguna diberi tahu bahwa pembayaran tidak dapat diproses

  @PAY-008
  Scenario: Pembayaran untuk konsultasi yang tidak ada menampilkan gagal memuat
    When pengguna membuka halaman pembayaran yang tidak ada
    Then halaman pembayaran menampilkan gagal memuat dengan pilihan coba lagi

  @PAY-009 @stub
  Scenario: Pembayaran yang sedang diproses tidak membuat transaksi ganda
    Given klien punya konsultasi berstatus menunggu pembayaran
    And Midtrans akan menyelesaikan pembayaran
    And layanan pembuatan transaksi merespons lambat
    And pengguna berada di halaman pembayaran konsultasi itu
    When pengguna membayar konsultasi lalu menekan tombol bayar sekali lagi
    Then pembayaran dikonfirmasi berhasil
    And hanya ada 1 permintaan pembuatan transaksi yang dikirim ke backend
