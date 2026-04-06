import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from database import get_supabase_client

# Skema otorisasi standar (Bearer Token)
security = HTTPBearer()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "").strip()
ALGORITHM = "HS256"


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Fungsi ini akan mengekstrak token dari header 'Authorization',
    memvalidasinya, dan mengembalikan data user (id_user & role).
    """
    token = credentials.credentials
    try:
        if not SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Missing SUPABASE_JWT_SECRET configuration.",
            )
        # Bongkar tokennya
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM])
        auth_user_id = payload.get("sub")

        if not auth_user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token tidak memiliki sub (auth_user_id).",
            )

        client = get_supabase_client()
        user_response = (
            client.table("users")
            .select("id_user, role")
            .eq("auth_user_id", auth_user_id)
            .execute()
        )

        if not user_response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Profil user tidak ditemukan.",
            )

        user = user_response.data[0]

        return {
            "id_user": user.get("id_user"),
            "role": user.get("role"),
            "auth_user_id": auth_user_id,
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sudah kedaluwarsa. Silakan login ulang.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid."
        )
