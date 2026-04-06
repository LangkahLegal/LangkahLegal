import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from database import get_supabase_client

# Skema otorisasi standar (Bearer Token)
security = HTTPBearer()

# Secret key untuk JWT (HARUS SAMA dengan yang ada di routers/auth.py)
SECRET_KEY = "supersecretkey_langkahlegal"
ALGORITHM = "HS256"


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid."
        )
