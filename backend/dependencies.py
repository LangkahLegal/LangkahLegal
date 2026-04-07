import os

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from database import get_supabase_client

# Skema otorisasi standar (Bearer Token)
security = HTTPBearer()

# Secret key untuk JWT (HARUS SAMA dengan yang ada di routers/auth.py)
SECRET_KEY = "supersecretkey_langkahlegal"
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


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Fungsi ini akan mengekstrak token dari header 'Authorization',
    memvalidasinya, dan mengembalikan data user (id_user & role).

    Token dibuat oleh endpoint /api/v1/auth/login dan /api/v1/auth/register
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id_user")
        role = payload.get("role")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token tidak memiliki id_user.",
            )

        return {
            "id_user": user_id,
            "role": role,
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sudah kedaluwarsa. Silakan login ulang.",
        )
    except jwt.InvalidTokenError:
        return _get_supabase_user(token)
