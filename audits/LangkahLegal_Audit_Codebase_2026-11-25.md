# Audit kepatuhan codebase LangkahLegal

**Tanggal:** 25 November 2026  
**Baseline tunggal:** `audits/LangkahLegal_Referensi_Hukum_dan_Audit.md`  
**Ruang lingkup bukti:** source code, config, SQL, tests, workflow CI/CD, deployment files.  
**Dikecualikan:** seluruh Markdown lama/deprecated, termasuk `audits/PRIVACY & SECURITY.md`.

## 1. Kesimpulan eksekutif

Status implementasi teknis keseluruhan: **SEBAGIAN**. Ini bukan pendapat hukum final atau penetapan kepatuhan organisasi menyeluruh.

Kontrol positif: autentikasi dan pemeriksaan role/ownership parsial, cookie `HttpOnly`, redaksi pola PII sebelum Gemini/Voyage, RAG dan sumber, private storage path, signed URL, validasi upload, security headers, CodeQL.

Kesenjangan utama sebelum perbaikan: secret plaintext dalam workspace, token auth dalam JSON, redirect client tanpa validasi, CSRF tidak lengkap, klaim E2EE tidak sesuai arsitektur, retensi menyeluruh tidak ada, penghapusan dokumen tidak fail-safe, konsultasi batal tetap payable, refund tidak terhubung ke pembatalan, dan klaim pemasaran tanpa bukti.

PP 33/2026: **BELUM TERVERIFIKASI** dan tidak dipakai menetapkan kewajiban. Dampak UU 1/2024 di luar baseline: **BELUM TERVERIFIKASI**.

## 2. Matriks temuan

| # | Kewajiban, pihak, kondisi | Fakta dan bukti | Status awal | Kesenjangan / tindakan |
|---|---|---|---|---|
| 1 | UU PDP Pasal 35–39, 47; PP 71/2019 Pasal 22–27. Pengendali/PSE saat mengamankan data dan sistem. | Secret sensitif ada di `backend/.env`; `.gitignore` awal tidak mengecualikan `.env`; `Dockerfile:5-10` menyalin backend. | **TIDAK MEMENUHI** | Tambah ignore build/Git dan secret scanning. Rotasi, history/image/registry audit memerlukan akses eksternal. |
| 2 | UU PDP Pasal 35–39; PP 71/2019 Pasal 23–27. Pengendali/PSE pada sesi pengguna. | Cookie `HttpOnly` di `backend/helpers/cookies.py:18-44`, tetapi session Supabase dikembalikan oleh `backend/routers/auth.py:34-101` dan dibaca frontend. | **SEBAGIAN** | Token harus hanya berada dalam cookie; response hanya state non-rahasia. |
| 3 | UU PDP Pasal 35–39; prinsip pencegahan akses tidak sah. | Mutation menerima cookie; `SameSite=Lax`; tidak ada validasi Origin/CSRF pada `backend/main.py:40-54`. | **SEBAGIAN** | Validasi Origin untuk mutation browser; webhook dikecualikan. Double-submit token dapat ditambah bila arsitektur lintas-origin diperlukan. |
| 4 | UU PDP Pasal 35–39; PP 71/2019 keamanan transaksi. | Redirect auth diterima sebagai string bebas di `backend/schemas/auth.py:10-59`, diteruskan di `backend/services/auth_service.py`. | **SEBAGIAN** | Exact origin allowlist server-side. |
| 5 | UU PDP Pasal 16, 35–39, 42–45. Pengendali saat menghapus dokumen. | `backend/services/consultation_service.py:507-515` menghapus metadata walau storage delete gagal. | **TIDAK MEMENUHI** | Fail closed; pertahankan metadata agar retry mungkin. |
| 6 | UU PDP Pasal 5–8, 16, 21, 27; PP 71/2019 Pasal 28–34. Pengendali/PSE saat memberi notice. | Notice lama di `frontend/src/app/(info)/privacy/page.js:8-33` tidak memuat identitas, dasar, vendor, transfer, retensi, AI, prosedur hak; mengklaim E2EE. Server memproses plaintext di `backend/services/rag_service.py:672-681`. | **TIDAK MEMENUHI** | Ganti klaim dengan fakta arsitektur dan ungkap batas informasi yang belum ditetapkan. Identitas legal/kontak wajib diisi organisasi. |
| 7 | UU PDP Pasal 42–45. Pengendali saat tujuan/retensi berakhir atau permintaan sah diterima. | Chat, dokumen, profil, konsultasi, payment tanpa TTL menyeluruh; tool cleanup log manual tersedia. | **TIDAK MEMENUHI** implementasi menyeluruh; scheduler **BELUM TERVERIFIKASI** | Tetapkan register retensi dan legal hold dahulu; baru migration/job terjadwal. |
| 8 | UU PDP Pasal 5–14, 30–32, 40–45. Pengendali saat subjek menggunakan hak. | Baca/update profil, baca/hapus chat, hapus dokumen tersedia; account deletion, export lengkap, restriction, withdrawal, portability, SLA belum ada. | **SEBAGIAN** | Perlu keputusan legal dan model data sebelum workflow menyeluruh. |
| 9 | UU PDP Pasal 27, 35–39; SE 9/2023 sebagai pedoman. | Redaksi di `backend/helpers/pii.py`; dipakai `backend/services/rag_service.py:668-681`; regex tidak mencakup seluruh fakta kontekstual/data spesifik. | **SEBAGIAN** / **PEDOMAN—SEBAGIAN** | Pertahankan redaksi, perluas evaluasi dan governance vendor. |
| 10 | UU PDP Pasal 35–39; PP 71/2019 Pasal 22–27. | Service-role global di `backend/core/database.py`; intent RLS di `backend/sql/enable_rls.sql`, penerapan produksi tidak terlihat. | **SEBAGIAN**; produksi **BELUM TERVERIFIKASI** | Migration terversi, verifikasi grants/policies, negative authz tests, kurangi service role. |
| 11 | UU Perlindungan Konsumen Pasal 4–10, 16–19; PP 71/2019 Pasal 28–34, 46–49. Pelaku usaha bila hubungan konsumen terpenuhi. | `backend/services/payment_service.py:22-27` menganggap status batal payable; pembatalan tidak menjalankan refund; terms menjanjikan refund tanpa alur nyata. | **TIDAK MEMENUHI** untuk artefak diperiksa | Blok pembayaran batal; tetapkan kebijakan dan workflow refund dengan status retry/idempotensi. |
| 12 | UU Perlindungan Konsumen Pasal 4–10 dan 18. | Klaim E2EE, audit independen, kepatuhan absolut, izin semua konsultan di halaman info tidak didukung artefak. | **TIDAK MEMENUHI** | Hapus klaim absolut; hanya tampilkan fakta terverifikasi. |
| 13 | UU PDP Pasal 51–56. Pengendali/prosesor saat memakai vendor dan transfer. | Supabase, Gemini, Voyage, Midtrans, Brevo digunakan; Vercel `sin1` dikonfigurasi; DPA, negara, subprosesor, retensi, safeguards tidak terlihat. | **BELUM TERVERIFIKASI** | Review kontrak, lokasi, transfer Pasal 56, training use, deletion dan incident terms. |
| 14 | UU PDP Pasal 34, 46, 53–54; Permenkominfo 5/2020. | DPIA, petugas PDP, incident workflow 3×24 jam, PSE registration, SOP akses penegak hukum tidak terlihat dalam artefak teknis. | **BELUM TERVERIFIKASI** | Verifikasi dan hasilkan bukti organisasi; ketiadaan repo bukan bukti pelanggaran. |
| 15 | UU Advokat Pasal 1–4, 17–19, 21–22 bila pihak benar advokat/hubungan profesi terbentuk. | Platform menyimpan relasi konsultasi dan dokumen; status profesi, kontrak, dan pembagian tanggung jawab tidak terbukti menyeluruh. | **BELUM TERVERIFIKASI** | Verifikasi izin, status layanan, kerahasiaan dan kontrak konsultan. |
| 16 | PP 71/2019 Pasal 22–27; UU PDP Pasal 31–32. | Request ID, log AI/admin parsial; audit event login, role change, akses dokumen, deletion dan export tidak konsisten. | **SEBAGIAN** | Audit log terpusat, akses terbatas, retensi dan alerting. |
| 17 | PP 71/2019 Pasal 3, 22–27. | Upload punya size/extension/signature/random name/private path; antivirus/CDR/quarantine tidak ada. | **SEBAGIAN** | Tambah scanning saat risiko/volume produksi menuntut. |
| 18 | Enkripsi at rest, backup, restore, runtime TLS dan storage policy. | Artefak provider/runtime tidak tersedia; frontend punya security headers dan konfigurasi HTTPS. | **BELUM TERVERIFIKASI** | Kumpulkan konfigurasi provider, restore drill, RPO/RTO, bukti TLS dan bucket policy. |

## 3. Inventaris dan alur data

- **Akun:** nama, email, foto, role, auth ID, session, metode login.
- **Konsultan:** identitas/profil profesional, nomor izin, pendidikan, kota, tarif, bio, tautan, status verifikasi, rating.
- **Konsultasi/perkara:** narasi kasus, kategori, jadwal, file/link bukti, relasi pihak, status.
- **AI/chat:** query, history, ringkasan, bukti, preferensi, rekomendasi, model/token/latency/error.
- **Pembayaran:** nama, email, order, jumlah, komisi, metode/status, token dan redirect pembayaran.
- **Data spesifik potensial:** field bebas dan upload dapat berisi kesehatan, anak, catatan kejahatan, agama, biometrik, dan data keuangan. Isi/volume produksi **BELUM TERVERIFIKASI**.

Alur AI terbukti: plaintext dari DB → redaksi pola → Gemini/Voyage → pemulihan placeholder → plaintext asli dan jawaban disimpan. Karena server membaca isi, E2EE tidak berlaku pada alur ini.

Bursa menghapus `id_user`, tetapi narasi/link tetap dapat mengidentifikasi individu: **SEBAGIAN**, bukan anonim.

## 4. Hasil action plan repository

Diterapkan:

1. `.env` dikecualikan dari Git dan Docker context; `.env.example` tetap boleh dilacak.
2. Session/token dan PKCE verifier tidak lagi dikirim ke JavaScript; refresh hanya memakai cookie.
3. Redirect auth divalidasi terhadap exact `FRONTEND_URL` origin.
4. Mutation browser mendapat validasi `Origin`; webhook Midtrans dikecualikan.
5. Penghapusan dokumen mempertahankan metadata bila storage gagal.
6. Status konsultasi batal dihapus dari status payable.
7. Draft browser kedaluwarsa langsung dihapus.
8. Notice privasi, halaman kepatuhan, dan terms diubah agar tidak mengklaim E2EE, audit independen, kepatuhan absolut, verifikasi izin menyeluruh, atau refund otomatis.
9. Unit test stdlib ditambah dan dijalankan dalam CI.

Status pascaperbaikan:

- Secret hygiene source: **SEBAGIAN**; rotasi/history audit belum dilakukan.
- Token response: **MEMENUHI** pada kontrak source yang diperbaiki.
- Redirect validation: **MEMENUHI** untuk exact configured origin.
- CSRF: **SEBAGIAN**; Origin check tersedia, token CSRF belum ada.
- Document deletion failure path: **MEMENUHI** pada source.
- Cancelled payable: **MEMENUHI** pada source.
- Transparansi: **SEBAGIAN**; notice jujur, tetapi identitas legal, dasar final, retensi, prosedur hak, dan transfer belum ditetapkan.
- Refund menyeluruh: **TIDAK MEMENUHI** sampai kebijakan dan workflow provider disetujui.
- Retensi dan hak menyeluruh: **TIDAK MEMENUHI/SEBAGIAN** sesuai objek kontrol.

## 5. Pekerjaan manual/eksternal untuk review

### P0

- Rotasi seluruh credential dari `backend/.env`; cabut credential dan image lama.
- Audit Git history, fork, CI artifact, registry layer, deployment log, dan cache. Jangan anggap ignore menghapus kebocoran historis.
- Tetapkan kebijakan refund: eligibility, cutoff, biaya, partial refund, SLA, pembatalan konsultan/platform, sengketa. Setelah disetujui, implementasikan cancel/refund Midtrans idempotent dan status `refund_pending`/retry.

### P1

- Isi identitas badan hukum, alamat, kontak privasi/pengaduan.
- Setujui purpose/legal-basis/retention register dan legal hold; setelah itu implementasikan cleanup scheduler.
- Putuskan account deletion/anonymization, export, restriction, withdrawal, portability, SLA dan penolakan sah.
- Terapkan/verifikasi migration RLS, grants, function privilege, bucket policy dan negative authz tests pada environment terisolasi.

### P2

- Verifikasi PSE, DPIA, petugas PDP, izin advokat/konsultan, incident response 3×24 jam, moderasi/UGC, backup/restore, enkripsi provider dan akses internal.
- Review DPA, subprosesor, lokasi, transfer Pasal 56, retensi/deletion/training use/incident terms untuk Supabase, Google, Voyage, Midtrans, Brevo, dan deployment provider.

### P3

- Tambah secret/dependency/container scan, SBOM, audit trail tahan perubahan, PII eval release gate, pentest, restore drill, tabletop insiden dan review akses berkala.

## 6. Penyesuaian ruang lingkup proyek mata kuliah

Informasi pemilik proyek: aplikasi hanya digunakan untuk keperluan mata kuliah dan tidak mencapai produksi dengan pengguna nyata. Penyesuaian ini berlaku dengan asumsi:

1. aplikasi tidak dibuka untuk masyarakat umum;
2. akun dan isi perkara hanya memakai data dummy/sintetis;
3. tidak ada transaksi uang nyata;
4. tidak ada konsultan atau advokat nyata yang memberikan jasa;
5. tidak ada data pribadi pihak ketiga yang dimasukkan ke narasi, chat, atau dokumen;
6. deployment demo, bila ada, dibatasi untuk dosen, penguji, dan anggota tim.

Jika satu asumsi tidak benar, kontrol terkait kembali masuk ruang audit aktif.

| Poin sebelumnya | Perlakuan untuk proyek mata kuliah | Alasan |
|---|---|---|
| Pendaftaran PSE | **TIDAK BERLAKU untuk scope audit demo**, dengan asumsi sistem tidak dioperasikan sebagai layanan publik/komersial | Repository dinilai sebagai prototipe akademik, bukan layanan yang digunakan masyarakat. Status hukum formal tetap perlu dinilai ulang sebelum publikasi nyata. |
| DPIA formal dan petugas PDP | **TIDAK BERLAKU untuk scope audit demo** bila tidak ada data pribadi nyata, pemantauan skala besar, atau data spesifik nyata | Pemrosesan berisiko tinggi faktual tidak terjadi pada demo berbasis data sintetis. Desain aplikasi tetap menunjukkan risiko yang harus dinilai sebelum produksi. |
| Incident notification 3 × 24 jam | **TIDAK BERLAKU secara operasional** selama tidak ada Data Pribadi nyata yang diproses | Tidak ada subjek data nyata yang terdampak. Kebocoran credential/vendor tetap harus ditangani sebagai insiden keamanan proyek. |
| DPA, subprosesor, dan transfer Pasal 56 | **DIPERKECIL** menjadi inventaris vendor dan larangan data nyata | Kontrak enterprise tidak proporsional untuk prototipe. API vendor tetap dapat menerima input; karena itu demo wajib memakai data sintetis dan tidak mengunggah dokumen nyata. |
| Verifikasi izin advokat/konsultan | **TIDAK BERLAKU untuk scope demo** bila seluruh profil dummy dan tidak menawarkan jasa hukum nyata | Tidak ada hubungan profesional atau representasi status profesi nyata. Label UI harus menjelaskan bahwa profil merupakan data demo. |
| Refund, partial refund, dan sengketa pembayaran nyata | **TIDAK BERLAKU secara operasional** bila Midtrans sandbox dipakai dan tidak ada uang nyata | Tidak ada kerugian finansial nyata. Status batal tetap diblokir dari pembayaran sebagai kontrol kualitas aplikasi. |
| Backup produksi, RPO/RTO, restore drill, pentest produksi, audit independen, SBOM, container scan | **DITUNDA** | Biaya dan proses tidak proporsional terhadap demo akademik tanpa pengguna nyata. Build, lint, unit test, secret hygiene, dan pembatasan akses tetap wajib sebagai kualitas minimum. |
| Account deletion, portability, restriction, withdrawal, dan SLA organisasi | **DITUNDA** sebagai workflow organisasi | Tidak ada subjek data nyata. UI/demo tidak boleh menjanjikan bahwa fitur tersebut telah tersedia. |
| Retensi data bisnis lengkap | **DIPERKECIL** | Data demo boleh dihapus setelah penilaian. Retensi transaksi/perkara nyata tidak perlu dirancang sampai scope berubah. |
| RLS produksi dan pengurangan service role | **DITUNDA untuk produksi**, tetapi akses deployment demo tetap harus dibatasi | Tidak ada tenant nyata, tetapi deployment publik dengan service-role dan secret valid tetap menciptakan risiko penyalahgunaan resource. |

### Kontrol yang tetap wajib untuk demo

- Jangan commit atau membagikan credential; rotasi credential yang pernah terekspos tetap perlu karena dapat menyalahgunakan akun/vendor walau tidak ada pengguna nyata.
- Gunakan sandbox/test key dan project vendor terpisah.
- Gunakan hanya nama, email, kasus, chat, dokumen, dan profil konsultan dummy.
- Batasi deployment dengan autentikasi/platform access control atau matikan setelah penilaian.
- Jangan mengaktifkan pembayaran production.
- Pertahankan perbaikan token, redirect, Origin, upload, document deletion, dan status pembayaran karena merupakan kualitas keamanan dasar.
- Tampilkan disclaimer bahwa aplikasi merupakan prototipe akademik, bukan layanan hukum dan bukan untuk data atau transaksi nyata.

### Trigger audit ulang

Audit penuh kembali diperlukan sebelum salah satu kondisi berikut terjadi: akses publik tanpa pembatasan, pendaftaran pengguna nyata, konsultasi dengan profesional nyata, input perkara/dokumen nyata, pembayaran production, promosi komersial, atau penyimpanan data setelah kegiatan mata kuliah selesai.

## 7. Jawaban/interupsi yang masih dibutuhkan

Pemilik proyek cukup mengonfirmasi enam hal berikut dalam README atau catatan deployment:

- [ ] Semua akun dan data demo sintetis; tidak memakai identitas mahasiswa/dosen kecuali email institusi yang disetujui.
- [ ] Tidak ada dokumen perkara, percakapan hukum, atau data pihak ketiga nyata.
- [ ] Midtrans memakai sandbox dan tidak menerima uang nyata.
- [ ] Semua profil konsultan/advokat merupakan dummy dan tidak menawarkan jasa nyata.
- [ ] Deployment dibatasi untuk tim/dosen/penguji atau dimatikan setelah penilaian.
- [ ] Credential dalam `backend/.env` sudah dirotasi atau dinonaktifkan setelah demo.

Keputusan sederhana yang disarankan:

- Retensi demo: hapus database, storage, dan log maksimal 30 hari setelah nilai final atau segera setelah tidak diperlukan.
- Kanal hak/keluhan formal: tidak perlu dibuat untuk demo; cantumkan kontak anggota tim untuk masalah teknis.
- Refund: tandai `sandbox only`; jangan implementasikan refund production.
- Vendor governance: simpan daftar vendor dan pastikan input hanya sintetis; DPA formal ditunda.

## 8. Status akhir scope akademik

Dengan asumsi scope pada bagian 6 dipenuhi, kontrol repository yang proporsional untuk demo berstatus **MEMENUHI**. Pembatasan sandbox kini ditegakkan oleh backend, disclaimer prototipe tampil di footer dan README, secret dikecualikan dari Git/Docker, response auth tidak mengekspos token, redirect dan Origin diperiksa, penghapusan dokumen fail-safe, status batal tidak payable, klaim publik dikoreksi, serta unit test dijalankan CI.

Tidak ada implementasi repository tambahan yang wajib untuk scope mata kuliah. Tindakan tersisa bersifat operasional:

- gunakan data sintetis;
- batasi atau matikan deployment;
- rotasi/nonaktifkan credential setelah demo;
- hapus data demo maksimal 30 hari setelah nilai final.

Status ini berubah kembali menjadi **SEBAGIAN** dan audit production wajib dibuka ulang jika ada pengguna, data, profesional, atau pembayaran nyata.

## 9. Batas kesimpulan

Tidak ada kesimpulan pidana ditarik dari kegagalan kontrol. Fakta organisasi/produksi/kontrak yang tidak tampak tetap **BELUM TERVERIFIKASI**, kecuali secara eksplisit dikeluarkan dari scope demo di atas. Ketiadaan bukti tidak dipakai sebagai bukti pelanggaran. Penetapan `TIDAK BERLAKU` di bagian 6 terbatas pada audit prototipe akademik berdasarkan asumsi yang disebutkan, bukan kesimpulan bahwa kewajiban tidak akan berlaku jika aplikasi dipublikasikan.
