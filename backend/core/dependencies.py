from fastapi import Cookie, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from core.database import get_supabase_client
from core.user import CurrentUser
from helpers.profile import find_profile

security = HTTPBearer(auto_error=False)


def _extract_token(credentials: HTTPAuthorizationCredentials | None, ll_token: str | None) -> str | None:
    if credentials and credentials.credentials:
        return credentials.credentials
    return ll_token or None


def get_token_from_request(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    ll_token: str | None = Cookie(default=None),
) -> str:
    token = _extract_token(credentials, ll_token)
    if not token:
        raise HTTPException(status_code=401, detail="Token tidak valid atau tidak ditemukan")
    return token


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    ll_token: str | None = Cookie(default=None),
    db: Client = Depends(get_supabase_client),
) -> CurrentUser:
    token = _extract_token(credentials, ll_token)
    if not token:
        raise HTTPException(status_code=401, detail="Token tidak ditemukan di cookie maupun header.")

    try:
        user_res = db.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Token tidak valid atau kedaluwarsa")

        profile = find_profile(db, user_res.user.id, user_res.user.email, "id_user, role, nama")
        if profile is None:
            raise HTTPException(
                status_code=401,
                detail="Profil user belum sinkron dengan database lokal.",
            )

        return CurrentUser(
            id_user=profile["id_user"],
            role=profile["role"],
            nama=profile["nama"],
        )

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Otorisasi gagal: {str(e)}")
