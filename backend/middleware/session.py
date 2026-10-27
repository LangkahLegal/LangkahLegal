from fastapi import Cookie, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from core.constants import Role
from core.database import get_supabase_client
from core.user import CurrentUser
from helpers.profile import find_profile

security = HTTPBearer(auto_error=False)

PROFILE_COLUMNS = "id_user, role, nama, konsultan(id_konsultan)"
APP_ROLES = (Role.CLIENT, Role.KONSULTAN, Role.ADMIN)


def _konsultan_id(profile: dict) -> int | None:
    konsultan = profile.get("konsultan")
    if isinstance(konsultan, list):
        konsultan = konsultan[0] if konsultan else None
    return konsultan.get("id_konsultan") if konsultan else None


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

        profile = find_profile(db, user_res.user.id, user_res.user.email, PROFILE_COLUMNS)
        if profile is None:
            raise HTTPException(
                status_code=401,
                detail="Profil user belum sinkron dengan database lokal.",
            )

        if profile.get("role") not in APP_ROLES:
            raise HTTPException(status_code=403, detail="Peran akun belum dipilih.")

        return CurrentUser(
            id_user=profile["id_user"],
            role=profile["role"],
            nama=profile["nama"],
            id_konsultan=_konsultan_id(profile),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Otorisasi gagal: {str(e)}")
