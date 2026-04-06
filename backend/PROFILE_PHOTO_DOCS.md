# DOKUMENTASI: Fitur Upload Foto Profil ke ImgBB

## 📋 Daftar Perubahan Lengkap

### 1. **Database Changes**
```sql
ALTER TABLE users ADD COLUMN foto_profil VARCHAR(255);
```
- **Kolom baru**: `foto_profil` di tabel `users`
- **Tipe**: VARCHAR(255) - untuk menyimpan URL
- **Nullable**: Ya (opsional, user bisa tidak punya foto)

---

### 2. **File-File yang Diubah/Dibuat**

#### A. `requirements.txt` - Dependencies Baru
```
python-multipart==0.0.6      # Untuk handle file upload
imgbb-uploader==1.0.0         # Library ImgBB (opsional, kita pakai httpx langsung)
```

#### B. `config.py` - Tambah ImgBB API Key
```python
@dataclass(frozen=True)
class Settings:
    app_env: str
    app_name: str
    supabase_url: str
    supabase_key: str
    imgbb_api_key: str  # ← BARU: Untuk ImgBB authentication
```

#### C. `services.py` - Baru! Modul Upload Foto
Berisi 2 fungsi utama:

1. **`async upload_to_imgbb(file, api_key) -> str`**
   - Upload file ke ImgBB API
   - Validasi tipe file (jpg, jpeg, png, gif, webp)
   - Validasi ukuran file (max 5MB)
   - Return URL gambar yang tersimpan di cloud ImgBB

2. **`async update_user_profile_photo(user_id, file, db_client) -> dict`**
   - Wrapper yang menggabungkan upload + database update
   - Return response dengan URL dan data user

#### D. `schemas/auth.py` - Tambah Response Models
```python
class ProfilePhotoResponse(BaseModel):
    message: str
    foto_profil_url: str
    id_user: int
    email: str

class UserProfileResponse(BaseModel):
    id_user: int
    nama: str
    email: str
    role: str
    foto_profil: Optional[str] = None
    created_at: str
    updated_at: str
```

#### E. `routers/auth.py` - 2 Endpoint Baru
1. **POST `/api/v1/auth/upload-profile-photo`** - Upload foto
2. **GET `/api/v1/auth/profile`** - Get profile dengan foto

#### F. `dependencies.py` - Perbaiki get_current_user()
- Update untuk handle JWT lokal (bukan Supabase Auth)
- Gunakan SECRET_KEY dari auth.py

#### G. `.env.example` - Template Environment
- Tambahkan `IMGBB_API_KEY=...`

---

## 🚀 Setup Langkah-Langkah

### Tahap 1: Database Update
```bash
# Jalankan SQL di Supabase/PostgreSQL
ALTER TABLE users ADD COLUMN foto_profil VARCHAR(255);
```

### Tahap 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Tahap 3: Setup ImgBB API Key
1. Buka https://api.imgbb.com
2. Daftar atau login dengan akun kamu
3. Copy **API Key** (private key)
4. Paste ke file `.env`:
   ```
   IMGBB_API_KEY=your_private_key_here
   ```

### Tahap 4: Restart Backend
```bash
# Kill server yang sedang jalan
# Kemudian jalankan ulang
python main.py
# atau
uvicorn main:app --reload
```

---

## 📡 Dokumentasi Endpoint

### Endpoint 1: Upload Foto Profil
```
POST /api/v1/auth/upload-profile-photo
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

Body (form-data):
- file: [gambar.jpg]
```

**Response (200 OK):**
```json
{
  "message": "Foto profil berhasil diperbarui",
  "foto_profil_url": "https://i.ibb.co/abc123/gambar.jpg",
  "id_user": 5,
  "email": "user@example.com"
}
```

**Error Response (400):**
```json
{
  "detail": "Format file tidak didukung. Gunakan: jpg, jpeg, png, gif, webp"
}
```

**Error Response (401):**
```json
{
  "detail": "Token sudah kedaluwarsa. Silakan login ulang."
}
```

---

### Endpoint 2: Get Profile dengan Foto
```
GET /api/v1/auth/profile
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "id_user": 5,
  "nama": "John Doe",
  "email": "john@example.com",
  "role": "client",
  "foto_profil": "https://i.ibb.co/abc123/gambar.jpg",
  "created_at": "2026-04-06T10:30:00Z",
  "updated_at": "2026-04-06T15:45:00Z"
}
```

---

## 🔄 Alur Lengkap Upload Foto

```
1. Frontend (React/Next.js)
   ↓
   User pilih foto → kirim POST /upload-profile-photo
   
2. Backend (FastAPI)
   ↓
   a. Terima file dari request
   b. Validasi tipe & ukuran file
   c. Baca file content
   d. Kirim ke ImgBB API dengan authorization key
   
3. ImgBB (Cloud Storage)
   ↓
   a. Terima file
   b. Process/compress gambar otomatis
   c. Simpan di cloud mereka
   d. Return response dengan URL publik
   
4. Backend (FastAPI)
   ↓
   a. Extract URL dari response ImgBB
   b. UPDATE tabel users.foto_profil = URL
   c. Return response ke frontend
   
5. Frontend (React/Next.js)
   ↓
   Display URL foto profil di UI
```

---

## 📝 Testing dengan cURL

```bash
# 1. Login dulu untuk dapat JWT token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response:
# {
#   "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
#   "token_type": "bearer"
# }

# 2. Upload foto dengan JWT token (ganti TOKEN dengan response di atas)
curl -X POST http://localhost:8000/api/v1/auth/upload-profile-photo \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/photo.jpg"

# 3. Get profile
curl -X GET http://localhost:8000/api/v1/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

---

## ⚠️ PENTING - Catatan Penting

### 1. **ImgBB API Key**
- ✅ **Aman** untuk disimpan di backend (file `.env`)
- ❌ **TIDAK** pernah kirim ke frontend
- Private key hanya boleh ada di backend

### 2. **Validasi File**
```python
# Allowed types
allowed_extensions = {"jpg", "jpeg", "png", "gif", "webp"}

# Max size: 5MB
max_size = 5 * 1024 * 1024  # bytes
```

### 3. **URL Permanence**
- ImgBB URL **permanent** selama akun aktif
- Tidak perlu khawatir link rusak
- User bisa share URL foto mereka langsung

### 4. **Bandwidth**
- ImgBB gratis tapi dengan batasan bandwidth
- Untuk production, consider gunakan premium atau CDN lain
- Alternatif lain: AWS S3, Google Cloud Storage, Cloudinary

### 5. **Error Handling**
Backend sudah handle:
- ✅ File type validation
- ✅ File size validation  
- ✅ ImgBB API timeout
- ✅ Database update failure
- ✅ JWT token expired

---

## 🔧 Troubleshooting

### Error: "Missing required environment variable: IMGBB_API_KEY"
**Solusi**: Tambahkan `IMGBB_API_KEY=...` ke file `.env` dan restart backend

### Error: "Format file tidak didukung"
**Solusi**: Gunakan file format: jpg, jpeg, png, gif, atau webp

### Error: "Ukuran file terlalu besar"
**Solusi**: Kompress foto sebelum upload (max 5MB)

### Error: "Token sudah kedaluwarsa"
**Solusi**: Login ulang untuk dapat JWT token baru

### Error: "Koneksi ke ImgBB timeout"
**Solusi**: Check koneksi internet, atau retry upload

---

## 📊 Database Schema Update

Sebelum:
```sql
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role role_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Sesudah:
```sql
ALTER TABLE users ADD COLUMN foto_profil VARCHAR(255);

-- Schema lengkap jadi:
CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role role_enum NOT NULL,
    foto_profil VARCHAR(255),  -- ← BARU
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 Fitur Tambahan (Optional - Untuk Future)

Jika ingin develop lebih lanjut:

1. **Delete foto lama saat update**
   - Track ImgBB ID untuk delete
   - ImgBB punya API delete endpoint

2. **Resize/Crop foto**
   - ImgBB auto resize, tapi bisa trigger di frontend
   - Gunakan library seperti `sharp` untuk pre-processing

3. **Multiple photos**
   - Add galeri foto
   - Buat tabel terpisah: `user_photos`

4. **Photo compression**
   - Backend compress sebelum upload ke ImgBB
   - Gunakan `pillow` library untuk image processing

---

## ✅ Checklist Implementation

- [x] Tambah kolom `foto_profil` ke tabel users
- [x] Update requirements.txt
- [x] Buat services.py dengan upload logic
- [x] Update config.py dengan IMGBB_API_KEY
- [x] Tambah endpoint POST upload-profile-photo
- [x] Tambah endpoint GET profile
- [x] Update schemas untuk response model
- [x] Fix dependencies.py untuk JWT handling
- [x] Buat .env.example
- [ ] Test dengan frontend (React/Next.js)
- [ ] Deploy ke production dengan IMGBB_API_KEY di environment

---

**Status**: ✅ Siap digunakan / Ready to use

**Last Updated**: 2026-04-06
