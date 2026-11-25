# LangkahLegal

Prototipe akademik legal-tech untuk keperluan mata kuliah.

> **Batas penggunaan:** bukan layanan hukum, bukan pengganti nasihat advokat, dan tidak boleh digunakan untuk data pribadi, dokumen perkara, konsultasi, atau pembayaran nyata.

## Aturan demo

- Gunakan akun, nama, email, profil konsultan, narasi kasus, chat, dan dokumen sintetis.
- Gunakan Midtrans sandbox; backend menolak konfigurasi production.
- Batasi deployment untuk anggota tim, dosen, dan penguji.
- Matikan deployment dan rotasi/nonaktifkan credential setelah penilaian.
- Hapus database, storage, dan log demo paling lambat 30 hari setelah nilai final.
- Jangan membagikan atau commit file `.env`.

Jika aplikasi dibuka untuk publik atau menerima pengguna, data, profesional, maupun pembayaran nyata, audit hukum dan keamanan production wajib dilakukan ulang.

## Audit

- Baseline: `audits/LangkahLegal_Referensi_Hukum_dan_Audit.md`
- Hasil: `audits/LangkahLegal_Audit_Codebase_2026-11-25.md`
- Walkthrough: `audits/LangkahLegal_Walkthrough_Perbaikan_2026-11-25.md`
