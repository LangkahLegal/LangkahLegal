@sit @sesi
Feature: Sesi dan pembaruan token
  Aplikasi memperbarui token akses yang kedaluwarsa tanpa mengganggu pengguna.

  @SES-001 @critical
  Scenario: Token akses kedaluwarsa diperbarui otomatis
    Given token akses klien sudah kedaluwarsa
    When pengguna membuka halaman dashboard klien
    Then dashboard menampilkan nama pengguna
    And hanya ada 1 permintaan perbarui sesi yang dikirim ke backend
    And token akses di browser sudah diganti dengan yang baru

  @SES-004 @continue
  Scenario: Setelah token diperbarui, setiap permintaan memakai token yang baru
    When pengguna membuka halaman dashboard klien
    Then dashboard menampilkan nama pengguna
    And semua permintaan ke backend membawa token akses pengguna

  @SES-002
  Scenario: Sesi yang tidak bisa diperbarui dibersihkan dan pengguna diminta login
    Given token akses dan token pembaruan klien sudah tidak berlaku
    When pengguna membuka halaman dashboard klien
    Then tidak ada sesi yang tersimpan di browser
    And pengguna segera diarahkan ke halaman login

  @SES-003
  Scenario: Beberapa permintaan yang ditolak bersamaan hanya memicu satu pembaruan sesi
    Given token akses konsultan sudah kedaluwarsa
    When pengguna membuka halaman dashboard konsultan
    Then dashboard konsultan selesai dimuat
    And hanya ada 1 permintaan perbarui sesi yang dikirim ke backend
