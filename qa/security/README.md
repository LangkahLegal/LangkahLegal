# Audit Keamanan

Folder ini berisi alat dan dokumentasi audit keamanan LangkahLegal.

| Berkas | Isi |
|---|---|
| `audit.mjs` | Menjalankan lima pemindai sekaligus dan menulis laporan ke `reports/` |
| `VULNERABILITIES.md` | Daftar temuan: severity, prioritas, penjelasan bisnis, status perbaikan |
| `gitleaks.toml` | Daftar false positive gitleaks yang sudah ditinjau |
| `reports/` | Keluaran tiap pemindaian (tidak masuk git) |

## Menjalankan

```bash
cd qa
npm run audit:security            # keluar dengan kode 1 bila ada temuan critical/high
npm run audit:security -- --no-fail
```

Hasilnya ada di `qa/security/reports/<tanggal>/summary.md` beserta berkas mentah tiap alat.

## Alat yang dipakai

| Alat | Memeriksa | Pasang |
|---|---|---|
| `npm audit` | CVE pada paket Node di `frontend/` dan `qa/` | bawaan Node.js |
| `pip-audit` | CVE pada paket Python di `backend/requirements.txt` | `pip install pip-audit` |
| `bandit` | Pola berbahaya di kode Python (hash lemah, `eval`, kredensial hard-coded) | `pip install bandit` |
| `semgrep` | Pola OWASP Top 10, Python, JavaScript/React, dan rahasia di kode | `pip install semgrep` |
| `gitleaks` | Kunci API, token, dan kata sandi di seluruh riwayat git | `winget install Gitleaks.Gitleaks` |

Alat yang tidak terpasang dilewati dan ditandai di laporan. Pemindaian ini **statis**: tidak ada request yang dikirim ke aplikasi dan tidak ada data yang ditulis ke database, jadi aman dijalankan kapan saja. Pemindaian dinamis (OWASP ZAP, Burp) dan pengujian otorisasi manual tidak termasuk di sini.

## Membaca hasil

**Severity** adalah tingkat teknis dari alat atau basis data CVE (critical, high, medium, low). `pip-audit` dan `gitleaks` tidak memberi skor, jadi keduanya dicatat sebagai `high` sampai ditinjau.

**Prioritas** ditentukan tim setelah melihat konteks aplikasi, dan dicatat di `VULNERABILITIES.md`:

| Prioritas | Arti | Target |
|---|---|---|
| P1 | Bisa dieksploitasi dari luar pada fitur yang dipakai pengguna, atau kredensial bocor | Perbaiki sebelum rilis berikutnya |
| P2 | Dampak nyata tapi butuh kondisi tertentu (akun login, konfigurasi produksi) | Sprint ini |
| P3 | Pertahanan berlapis; tidak ada jalur eksploitasi langsung saat ini | Sprint berikutnya |
| P4 | False positive atau risiko yang diterima dengan alasan tercatat | Tidak dikerjakan |

Severity tinggi tidak otomatis berarti prioritas tinggi. Contoh: CVE `high` pada paket yang hanya dipakai saat build tidak bisa dijangkau penyerang, sehingga prioritasnya P3.

## Menangani false positive

- **gitleaks**: tambahkan pola atau path ke `gitleaks.toml` dengan `description` yang menjelaskan alasannya.
- **bandit**: beri `# nosec B###` di baris terkait dengan alasan singkat.
- **semgrep**: beri `# nosemgrep: <rule-id>` di baris terkait.

Setiap pengecualian wajib dicatat di `VULNERABILITIES.md` sebagai P4.

## Audit manual

Pemindai tidak mengenal aturan bisnis aplikasi, jadi kategori berikut diperiksa dengan membaca kode. Ulangi tiap sprint dan catat hasilnya di `VULNERABILITIES.md` bagian 5 dan 6.

| Kategori | Yang dicari | Cara cepat memeriksa |
|---|---|---|
| Otorisasi | Endpoint yang tidak memeriksa peran atau pemilik data; tombol yang tampil tapi ditolak backend | Setiap router memakai `require_*` dari `middleware/`; service memeriksa pemilik; uji dengan akun `sit.klien`, `sit.konsultan`, `sit.admin` terhadap data akun lain |
| Data di browser | Token, data pribadi, atau isi kasus di `localStorage`/`sessionStorage` | `grep -rn "Storage.setItem" frontend/src` |
| Transport & URL | HTTP tanpa TLS, data sensitif di query string | `grep -rn "http://" frontend/src backend --include=*.js --include=*.py`; cek parameter URL yang berisi email/token |
| Injeksi | Filter PostgREST dari input tanpa `clean_search`, SQL mentah, input ke prompt LLM | `grep -rn "\.or_(\|\.rpc(" backend/repositories`; bandingkan dengan pemakaian `clean_search` di `backend/services` |
| Validasi input | Field `str` tanpa `max_length`, URL tanpa cek skema, tanggal/jam tanpa format | `grep -rn ": str\b" backend/schemas \| grep -v max_length` |
| Kebocoran informasi | `str(e)` di pesan error, log berisi payload, `/docs` di produksi, kolom `*` di respons publik | `grep -rn "str(e)\|str(exc)" backend/services backend/routers`; `grep -rn "logger\." backend/services` |
| Pembatas laju | Endpoint auth atau yang mahal tanpa `throttle(...)` | `grep -n "@router.post\|throttle" backend/routers/auth.py` |
| Rahasia di frontend | `NEXT_PUBLIC_*` yang bukan kunci publik | `grep -rhoE "NEXT_PUBLIC_[A-Z_]+" frontend/src \| sort -u` dan `frontend/.env.example` |

## Menambahkan ke CI

Jalankan `npm run audit:security` di workflow GitHub Actions setelah `npm ci` di `qa/` dan `pip install pip-audit bandit semgrep`; gitleaks tersedia sebagai action `gitleaks/gitleaks-action`. Kode keluar 1 akan menggagalkan job bila ada temuan critical/high yang belum ditangani.
