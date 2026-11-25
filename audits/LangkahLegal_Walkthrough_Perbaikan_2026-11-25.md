# Walkthrough perbaikan audit LangkahLegal

## Keamanan secret

- `.gitignore`: mengecualikan `.env` dan varian lokal, tetap mengizinkan `.env.example`.
- `.dockerignore`: mencegah secret, Git metadata, cache, dan dependency lokal masuk build context.
- Credential tidak dihapus atau dirotasi otomatis karena tindakan tersebut membutuhkan akses provider dan dapat memutus deployment.

## Auth dan sesi

- `backend/routers/auth.py`: login, signup, OTP, OAuth exchange, dan refresh tetap memasang cookie `HttpOnly`, tetapi response kini hanya memuat `authenticated` dan user non-token.
- Refresh token hanya diterima dari cookie; body refresh token dihapus.
- PKCE verifier hanya disimpan dan dibaca lewat cookie `HttpOnly`; tidak dikirim ke frontend.
- `backend/services/auth_service.py`: `_safe_redirect_url` menolak origin yang berbeda dari `FRONTEND_URL`; `public_auth_result` membentuk response aman.
- `frontend/src/services/auth.service.js` dan `frontend/src/lib/axios.js`: frontend memakai state autentikasi non-rahasia, bukan session Supabase.
- `backend/main.py`: mutation dengan `Origin` asing ditolak. Webhook Midtrans dikecualikan karena server-to-server.

## Lifecycle data

- `backend/services/consultation_service.py`: kegagalan delete storage kini menghasilkan error dan mempertahankan metadata DB untuk retry.
- `frontend/src/lib/consultationDraft.js`: draft hilang/malformed/kedaluwarsa dibersihkan saat dibaca.
- Retensi DB menyeluruh belum dibuat karena periode dan legal hold belum ditetapkan.

## Pembayaran

- `backend/services/payment_service.py`: konsultasi `DIBATALKAN` tidak dapat membuat transaksi baru.
- Refund otomatis belum dibuat. Kebijakan bisnis, status retry, dan otorisasi provider belum tersedia; implementasi spekulatif berisiko kehilangan uang atau refund ganda.
- `frontend/src/app/(info)/terms/page.js`: tidak lagi menjanjikan refund otomatis; menjelaskan pemeriksaan dan kebutuhan kebijakan.

## Transparansi dan klaim

- `frontend/src/app/(info)/privacy/page.js`: mengungkap kategori data, tujuan, vendor, AI, transfer potensial, kontrol aktual, batas E2EE, retensi yang belum ditetapkan, dan hak yang sebagian manual.
- `frontend/src/app/(info)/compliance/page.js`: menghapus klaim kepatuhan absolut, pencegahan kebocoran, verifikasi izin menyeluruh, lisensi vendor, dan audit independen tanpa bukti.
- Informasi identitas pengendali tetap placeholder jujur, bukan fakta organisasi yang dikarang.

## Tests dan CI

- `backend/tests/test_audit_controls.py`: memeriksa token tidak masuk response publik, redirect beda origin ditolak, redirect same-origin diterima, dan status batal tidak payable.
- `.github/workflows/ci.yml`: menjalankan `unittest` backend setelah dependency dipasang.

## Validasi

- `python -m unittest discover -s backend/tests -p "test_*.py"`: 4 test lulus.
- `npm run lint`: 0 error, 6 warning existing terkait font dan elemen `<img>`.
- `git diff --check`: lulus; hanya warning normalisasi LF/CRLF pada dua file frontend.

## Penyesuaian proyek mata kuliah

Pemilik menyatakan aplikasi tidak mencapai production dengan pengguna nyata. Karena itu PSE, DPIA formal, petugas PDP, DPA enterprise, verifikasi izin profesional, refund uang nyata, workflow hak organisasi lengkap, RPO/RTO, audit independen, dan pentest produksi dikeluarkan atau ditunda dari scope demo. Alasannya: tidak ada layanan publik, subjek data nyata, hubungan jasa hukum nyata, atau transaksi uang nyata.

Pengecualian hanya berlaku bila seluruh data sintetis, Midtrans sandbox, profil konsultan dummy, dan deployment dibatasi. Audit penuh aktif kembali bila aplikasi dibuka ke publik atau menerima data/transaksi nyata.

## Interupsi yang masih perlu dijawab

1. Konfirmasi seluruh akun, kasus, chat, dokumen, dan profil merupakan data sintetis.
2. Konfirmasi Midtrans memakai sandbox dan tidak menerima uang nyata.
3. Konfirmasi deployment hanya dapat diakses tim, dosen, atau penguji; atau akan dimatikan setelah penilaian.
4. Rotasi atau nonaktifkan credential yang pernah berada di `backend/.env` setelah demo.
5. Setujui retensi demo: hapus database, storage, dan log maksimal 30 hari setelah nilai final.
6. Tambahkan disclaimer prototipe akademik: bukan layanan hukum, bukan untuk perkara/data nyata, dan bukan untuk pembayaran nyata.

Rincian alasan dan trigger audit ulang dicatat di `audits/LangkahLegal_Audit_Codebase_2026-11-25.md`, bagian 6–8.
