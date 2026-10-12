from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from routers import auth, cases, consultations, consultants, users, payments, chatbot, admin, admin_docs, knowledge
from dependencies import get_current_user

from config import get_settings, Settings
from database import check_db_connection
from limiter import limiter
from docs import main as docs

app = FastAPI(
    title="LangkahLegal API",
    description=docs.API_DESCRIPTION,
    version="1.0.0"
)

app.state.limiter = limiter

@app.middleware("http")
async def force_https_scheme(request: Request, call_next):
    if request.headers.get("x-forwarded-proto") == "https":
        request.scope["scheme"] = "https"
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.langkahlegal\.com|http://localhost:3000|http://127.0.0.1:3000",
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

@app.get("/health", tags=["System"], **docs.HEALTH_CHECK)
def health_check(settings: Settings = Depends(get_settings)):
    db_status = "connected" if check_db_connection() else "disconnected"
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "environment": settings.app_env,
        "database": db_status
    }

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(consultants.router, prefix="/api/v1/consultants", tags=["Direktori Konsultan"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["Bursa Kasus"])
app.include_router(consultations.router, prefix="/api/v1/consultations", tags=["Konsultasi"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users / Profile"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Pembayaran"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin Dashboard"])
app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["Chatbot AI"])
app.include_router(admin_docs.router, prefix="/api/v1/admin/documents", tags=["Admin - Dokumen Hukum"])
app.include_router(knowledge.router, prefix="/api/v1/knowledge", tags=["Knowledge Base"])
