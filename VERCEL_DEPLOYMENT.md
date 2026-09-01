# Panduan Deploy Backend ke Vercel

Backend di-deploy sebagai **project Vercel terpisah** dari frontend, dari repo yang sama.
Vercel punya dukungan native untuk FastAPI: `backend/main.py` terdeteksi otomatis sebagai
entrypoint (variabel `app`), jadi **tidak perlu** `builds`, `routes`, `wsgi.py`, atau
handler `api/index.py` buatan sendiri.

## Step 1: Setup Project di Vercel Dashboard

1. **Add New → Project** → pilih repository `LangkahLegal`.
2. **Root Directory: `backend`** ← wajib. Ini yang membuat `main.py` dan
   `requirements.txt` berada di root deployment.
3. **Framework Preset: FastAPI** (kalau tidak ada, pilih `Other`).
4. **Build & Output Settings — kosongkan semuanya:**
   - Build Command: kosong (jangan di-override)
   - Output Directory: **kosong** ← mengisi ini membuat Vercel menganggap deployment
     sebagai situs statis sehingga tidak ada serverless function yang dibuat, dan
     semua path balas `404 NOT_FOUND`.
   - Install Command: kosong (Vercel jalankan `pip install -r requirements.txt` sendiri)

> Frontend adalah project Vercel terpisah dengan Root Directory `frontend`.

## Step 2: Environment Variables

Vercel Dashboard → Project Settings → Environment Variables (scope: Production + Preview):

```
# Supabase
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
SUPABASE_KEY=<your-supabase-anon-key>
SUPABASE_PORTOFOLIO_BUCKET=portofolio
SUPABASE_BERKAS_PENDUKUNG_BUCKET=berkas-pendukung
SUPABASE_KNOWLEDGE_BUCKET=knowledge-base

# Frontend & CORS
FRONTEND_URL=https://yourdomain.vercel.app
COOKIE_DOMAIN=.yourdomain.vercel.app

# Payment (Midtrans)
MIDTRANS_SERVER_KEY=<your-midtrans-server-key>
MIDTRANS_CLIENT_KEY=<your-midtrans-client-key>
MIDTRANS_IS_PRODUCTION=true

# Email Service (Brevo)
BREVO_API_KEY=<your-brevo-api-key>
BREVO_FROM_EMAIL=LangkahLegal <langkahlegal@gmail.com>

# AI
GOOGLE_API_KEY=<your-google-api-key>
VOYAGE_API_KEY=<your-voyage-api-key>

# Image Hosting (ImgBB)
IMGBB_API_KEY=<your-imgbb-api-key>

# App Config
APP_ENV=production
APP_NAME=LangkahLegal
```

Hanya `SUPABASE_URL` + (`SUPABASE_SERVICE_ROLE_KEY` atau `SUPABASE_KEY`) yang wajib —
`config.py` melempar `RuntimeError` kalau keduanya kosong. Sisanya punya default atau
hanya dipakai oleh fitur tertentu.

## Step 3: File Konfigurasi di Repo

| File | Fungsi |
|---|---|
| `backend/main.py` | FastAPI app (`app`) — entrypoint yang dideteksi Vercel |
| `backend/requirements.txt` | Dependency runtime (direct deps saja) |
| `backend/requirements-dev.txt` | `requirements.txt` + pytest, dipakai CI |
| `backend/vercel.json` | Hanya `regions: ["sin1"]` |
| `backend/.vercelignore` | Exclude `tests/`, `__pycache__`, `.env` |

## Step 4: Deploy

```bash
git add -A
git commit -m "Deploy backend via Vercel FastAPI preset"
git push origin main
```

## Step 5: Testing

```bash
curl -i https://<backend>.vercel.app/health
curl -i https://<backend>.vercel.app/docs
curl -i https://<backend>.vercel.app/openapi.json
```

`/health` harus balas `{"status":"ok", ...}`.

## Step 6: Connect Frontend

`frontend/.env.production`:
```
NEXT_PUBLIC_API_URL=https://<backend>.vercel.app
```

## Troubleshooting

Baca header `X-Vercel-Error` dari response — itu yang menentukan di mana masalahnya:

| Gejala | Artinya | Penyebab umum |
|---|---|---|
| `404` + `X-Vercel-Error: NOT_FOUND` | Request **tidak pernah sampai** ke Python | Root Directory salah, atau Output Directory di-set (deployment jadi statis) |
| `500` + `FUNCTION_INVOCATION_FAILED` | Function jalan tapi crash saat import | Env var kurang, atau import error — cek Runtime Logs |
| `504` + `FUNCTION_INVOCATION_TIMEOUT` | Endpoint terlalu lama | Endpoint RAG/chatbot; naikkan `maxDuration` (butuh plan Pro) |
| Build error `externally-managed-environment` | Build Command custom `pip install ...` masih aktif | Kosongkan Build Command di dashboard |
| Build error size limit | Bundle > 250 MB uncompressed | PyMuPDF + tokenizers + cryptography + pyiceberg berat — pangkas dependency |

### Catatan lain

- Cold start terasa karena dependency berat (PyMuPDF, tokenizers). Endpoint pertama lambat.
- Timeout default: 60 detik. Untuk endpoint RAG yang lebih lama, tambahkan di
  `backend/vercel.json` (butuh plan Pro):
  ```json
  { "functions": { "main.py": { "maxDuration": 300 } } }
  ```
- Jangan commit `backend/.env`.
