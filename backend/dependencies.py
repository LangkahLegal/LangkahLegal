import os
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from database import get_supabase_client
from config import get_settings

# Skema otorisasi standar (Bearer Token)
security = HTTPBearer()

SECRET_KEY = get_settings().JWT_SECRET_KEY
ALGORITHM = "HS256"


def _get_supabase_config() -> tuple[str, str]:
    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        or os.getenv("SUPABASE_KEY", "").strip()
    )

    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Konfigurasi Supabase belum lengkap.",
        )

    return supabase_url, supabase_key


def _get_supabase_user(token: str) -> dict:
    supabase_url, supabase_key = _get_supabase_config()
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": supabase_key,
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(
                f"{supabase_url}/auth/v1/user",
                headers=headers,
            )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gagal terhubung ke Supabase Auth.",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid.",
        )

    user_payload = response.json()
    auth_user_id = user_payload.get("id")
    if not auth_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak memiliki user id.",
        )

    db = get_supabase_client()
    user_profile = (
        db.table("users")
        .select("id_user, role")
        .eq("auth_user_id", auth_user_id)
        .single()
        .execute()
    )

    if not user_profile.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Profil user belum terdaftar.",
        )

    return {
        "id_user": user_profile.data["id_user"],
        "role": user_profile.data["role"],
    }


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Client = Depends(get_supabase_client)):
    """
    Refactor: Validasi token menggunakan API resmi Supabase.
    Backend tidak lagi membuat/mengecek JWT sendiri.
    """
    token = credentials.credentials
    try:
        # 1. Validasi token langsung ke Supabase Cloud
        user_res = db.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Token tidak valid atau kedaluwarsa")

        auth_user_id = user_res.user.id # Ini adalah UUID dari Supabase Auth

        # 2. Hubungkan UUID Supabase dengan id_user (Integer) di tabel lokal kita
        user_profile = (
            db.table("users")
            .select("id_user, role, nama")
            .eq("auth_user_id", auth_user_id) # Pastikan kolom ini ada di DB!
            .single()
            .execute()
        )

        if not user_profile.data:
            raise HTTPException(status_code=401, detail="Profil user belum sinkron dengan database lokal.")

        return {
            "id_user": user_profile.data["id_user"],
            "role": user_profile.data["role"],
            "nama": user_profile.data["nama"]
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Otorisasi gagal: {str(e)}")