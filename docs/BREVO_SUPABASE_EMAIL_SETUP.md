# Setup email OTP Supabase melalui Brevo

Gunakan **Supabase Auth + Brevo Custom SMTP**. OTP tetap dibuat, disimpan, dibatasi, dan diverifikasi oleh Supabase; Brevo hanya menjadi pengirim email. Jangan membuat tabel OTP sendiri.

`BREVO_API_KEY` dan `BREVO_FROM_EMAIL` pada backend hanya cukup untuk email aplikasi melalui Brevo HTTP API. Supabase Auth tidak membaca environment backend tersebut.

## Yang masih diperlukan

1. Akun Brevo dengan sender atau domain terverifikasi.
2. Brevo SMTP login dan SMTP key — berbeda dari REST API key.
3. Akses Supabase Dashboard untuk project Auth.
4. URL frontend yang masuk allowlist redirect Supabase.

## Langkah Brevo

1. Buka **Brevo → Settings → Senders, Domains & Dedicated IPs**.
2. Tambahkan sender atau domain pengirim.
3. Untuk domain sendiri, pasang record DNS SPF dan DKIM yang diberikan Brevo. DMARC disarankan.
4. Buka **Brevo → SMTP & API → SMTP**.
5. Catat SMTP login dan buat SMTP key baru. Jangan commit key.

## Langkah Supabase

1. Buka **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**.
2. Aktifkan custom SMTP.
3. Isi:
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: SMTP login Brevo
   - Password: SMTP key Brevo
   - Sender email: sender yang sudah diverifikasi
   - Sender name: `LangkahLegal Demo`
4. Buka **Authentication → URL Configuration**.
5. Set Site URL ke URL frontend demo.
6. Tambahkan redirect URL lokal dan demo yang benar-benar dipakai, misalnya:
   - `http://localhost:3000/auth/verify`
   - `http://localhost:3000/auth/reset-password`
   - `https://<domain-demo>/auth/verify`
   - `https://<domain-demo>/auth/reset-password`
7. Buka **Authentication → Email Templates** dan sesuaikan template OTP/signup/recovery. Pertahankan token/template variable Supabase; jangan menulis OTP statis.
8. Atur expiry OTP dan rate limit sesuai kebutuhan demo pada pengaturan Auth.

## Environment aplikasi

Backend tetap memakai:

```env
BREVO_API_KEY=<REST API key untuk email aplikasi>
BREVO_FROM_EMAIL=LangkahLegal Demo <sender-terverifikasi@example.com>
```

Nilai SMTP disimpan hanya di Supabase Dashboard, bukan repository. `BREVO_API_KEY` tidak menggantikan SMTP key.

## Verifikasi

1. Daftar memakai email demo yang dapat diakses.
2. Pastikan email diterima dengan sender Brevo terverifikasi.
3. Pastikan OTP salah ditolak dan OTP benar diterima satu kali.
4. Uji resend dan rate limit.
5. Uji lupa password untuk akun yang punya profil `public.users`.
6. Uji email tanpa profil: endpoint memberi respons generik tetapi tidak mengirim recovery.
7. Periksa Brevo transactional logs tanpa memasukkan OTP ke log aplikasi.

Untuk prototipe mata kuliah, gunakan recipient milik tim/penguji dan jangan mengirim data perkara nyata dalam email.
