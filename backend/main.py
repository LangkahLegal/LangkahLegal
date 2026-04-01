from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, cases, consultations, consultants
from dependencies import get_current_user

# Mengambil fungsi dari file yang sudah ada
from config import get_settings, Settings
from database import check_db_connection

# TODO: Nanti kita import file-file router di sini
# from routers import auth, consultants, cases, consultations

app = FastAPI(
    title="LangkahLegal API",
    description="API Endpoint untuk Platform Pendampingan Konsultasi Hukum",
    version="1.0.0"
)

# 1. SETUP CORS (Sangat penting agar Next.js bisa akses API ini)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Bisa diganti ["http://localhost:3000"] saat development ketat
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. HEALTH CHECK ENDPOINT
@app.get("/health", tags=["System"])
def health_check(settings: Settings = Depends(get_settings)):
    """
    Endpoint untuk mengecek status server dan koneksi ke Supabase PostgreSQL.
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