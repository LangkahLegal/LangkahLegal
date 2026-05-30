from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from routers import auth, cases, consultations, consultants, users, payments, chatbot, admin, admin_docs
from dependencies import get_current_user

# Mengambil fungsi dari file yang sudah ada
from config import get_settings, Settings
from database import check_db_connection
from limiter import limiter

app = FastAPI(
    title="LangkahLegal API",
    description="""
API backend untuk platform konsultasi hukum LangkahLegal.

Panduan singkat untuk frontend:
- Semua endpoint bisnis berada di prefix `/api/v1`.
- Endpoint yang membutuhkan login menggunakan header: `Authorization: Bearer <access_token>`.
- Gunakan endpoint auth untuk mendapatkan access token.
- Endpoint upload file (portofolio dan dokumen pendukung) wajib dikirim sebagai `multipart/form-data`.

Ringkasan modul:
- `Auth`: Signup/login/OTP/OAuth/session.
- `Direktori Konsultan`: Katalog konsultan, detail konsultan, dan manajemen jadwal.
- `Konsultasi`: Pengajuan konsultasi, response konsultan, status, dan rating.
- `Users / Profile`: Profile user dan profile profesional konsultan.
- `Bursa Kasus`: Posting kasus anonim dan sistem klaim langsung oleh konsultan.

Catatan integrasi frontend:
- Jika endpoint menerima file, jangan set header `Content-Type` manual; biarkan browser/client mengisi boundary multipart otomatis.
- Field timestamp pada pengajuan konsultasi menggunakan format ISO 8601.
""",
    version="1.0.0"
)

app.state.limiter = limiter

# 1. SETUP CORS (Sangat penting agar Next.js bisa akses API ini)
# Credentials + cookie tidak boleh dipakai bersama allow_origins=["*"] di browser.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:3000|http://127.0.0.1:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"type": "error", "jawaban": "Mohon tunggu sebentar, Anda mengirim pesan terlalu cepat."}
    )

# 2. HEALTH CHECK ENDPOINT
@app.get("/health", tags=["System"])
def health_check(settings: Settings = Depends(get_settings)):
    """
    Mengecek status server dan koneksi database.

Frontend dapat memanggil endpoint ini saat startup aplikasi untuk memastikan API siap dipakai.
    """
    db_status = "connected" if check_db_connection() else "disconnected"
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "environment": settings.app_env,
        "database": db_status
    }

# 3. REGISTRASI ROUTERS (Endpoint API)
# Bagian ini di-comment dulu sampai kita buat file routernya di folder terpisah
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(consultants.router, prefix="/api/v1/consultants", tags=["Direktori Konsultan"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["Bursa Kasus"])
app.include_router(consultations.router, prefix="/api/v1/consultations", tags=["Konsultasi"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users / Profile"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Pembayaran"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin Dashboard"])
app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["Chatbot AI"])
app.include_router(admin_docs.router, prefix="/api/v1/admin/documents", tags=["Admin - Dokumen Hukum"])
