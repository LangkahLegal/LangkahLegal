@sit @riwayat-konsultan @precondition:login-konsultan
Feature: Riwayat sesi konsultan
  Konsultan melihat sesi yang pernah ditanganinya.

  @CHI-001
  Scenario: Riwayat konsultan tidak memuat pengajuan yang masih pending
    Given konsultan uji punya sesi selesai, pengajuan pending, dan sesi dibatalkan
    When pengguna membuka halaman riwayat konsultan
    Then riwayat konsultan hanya menampilkan sesi yang sudah diproses beserta jumlah sesi selesai

  @CHI-002
  Scenario: Konsultan tanpa sesi melihat riwayat kosong
    Given klien belum punya konsultasi
    When pengguna membuka halaman riwayat konsultan
    Then riwayat konsultan menampilkan keadaan kosong
