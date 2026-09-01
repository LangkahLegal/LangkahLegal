# Panduan Deploy Backend ke Vercel

## Step 1: Setup di Vercel Dashboard

1. **Buat Project Baru di Vercel**:
   - Pergi ke https://vercel.com/dashboard
   - Klik "Add New" → "Project"
   - Pilih repository GitHub Anda (LangkahLegal)
   - Root directory: `.` (leave as default)

2. **Configure Build Settings**:
   - Framework Preset: **Other** (bukan Next.js)
   - Build Command: `pip install -r backend/requirements.txt`
   - Output Directory: `backend`
   - Development Command: (kosongkan)

3. **Add Environment Variables**:
   Di Vercel Dashboard → Project Settings → Environment Variables, tambahkan:

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

# Google (untuk AI/NLP features)
GOOGLE_API_KEY=<your-google-api-key>

# Image Hosting (ImgBB)
IMGBB_API_KEY=<your-imgbb-api-key>

# VoyageAI (untuk embeddings)
VOYAGE_API_KEY=<your-voyage-api-key>

# App Config
APP_ENV=production
APP_NAME=LangkahLegal
```

## Step 2: Update Frontend CORS

Di `frontend/.env.production`:
```
NEXT_PUBLIC_API_URL=https://your-backend-api.vercel.app
```

Di `backend/main.py`, pastikan CORS sudah mencakup domain Vercel:
```python
allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.langkahlegal\.com|http://localhost:3000|http://127.0.0.1:3000"
```

## Step 3: Files yang Sudah Dibuat

✅ `vercel.json` - Configuration untuk Vercel  
✅ `backend/api/index.py` - Entry point  
✅ `.vercelignore` - File yang di-ignore saat deploy  

## Step 4: Deploy

```bash
# Push ke GitHub (Vercel akan auto-deploy)
git add .
git commit -m "Setup Vercel deployment for backend"
git push origin main
```

Vercel akan otomatis build dan deploy ketika push ke GitHub.

## Step 5: Testing

Setelah deploy:

```bash
# Test API documentation
curl https://your-backend-api.vercel.app/docs

# Test endpoint
curl https://your-backend-api.vercel.app/api/v1/users/profile \
  -H "Authorization: Bearer <token>"
```

## Step 6: Connect Frontend to Backend

Update `frontend/src/lib/axios.js`:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

Pastikan environment variable sudah set di Vercel dashboard.

## Catatan Penting

⚠️ **Vercel Serverless Limitations**:
- Request timeout: 60 detik (Pro) atau 10 detik (Hobby)
- Cold start dapat memperlambat response pertama
- WebSocket mungkin tidak support penuh di beberapa plan

⚠️ **Database Connection**:
- Pastikan Supabase dapat diakses dari Vercel IPs
- Gunakan connection pooling jika perlu

⚠️ **Environment Variables**:
- Jangan commit `.env` ke GitHub
- Set semua secrets di Vercel dashboard, jangan di file lokal

## Troubleshooting

### Build Gagal
```bash
# Check logs di Vercel dashboard
# Pastikan pip install berhasil
# Cek requirements.txt - semua dependencies harus listed
```

### API Return 502 Bad Gateway
- Check Vercel logs
- Pastikan main.py bisa di-import tanpa error
- Check environment variables di Vercel

### CORS Error
- Update `allow_origin_regex` di main.py
- Re-deploy setelah perubahan

### Request Timeout
- Optimize slow endpoints
- Reduce cold start time
- Gunakan serverless functions yang lebih kecil

---

Sudah siap! Ada pertanyaan tentang setup? 🚀
