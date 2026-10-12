from fastapi import Depends, HTTPException, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from core.database import get_supabase_client
from repositories import user_repository


security = HTTPBearer(auto_error=False)


def get_token_from_request(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    ll_token: str | None = Cookie(default=None),
) -> str:
    if credentials and credentials.credentials:
        return credentials.credentials
    if ll_token:
        return ll_token
    raise HTTPException(status_code=401, detail="Token tidak valid atau tidak ditemukan")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    ll_token: str | None = Cookie(default=None),
    db: Client = Depends(get_supabase_client)
):
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif ll_token:
        token = ll_token

    if not token:
        raise HTTPException(status_code=401, detail="Token tidak ditemukan di cookie maupun header.")
    try:
        user_res = db.auth.get_user(token)
        if not user_res.user:
            raise HTTPException(status_code=401, detail="Token tidak valid atau kedaluwarsa")

        auth_user_id = user_res.user.id

        columns = "id_user, role, nama"
        profiles = user_repository.list_by_auth_user_id(db, auth_user_id, columns)

        if not profiles:
            email = user_res.user.email
            if email:
                email_profiles = user_repository.list_by_email(db, email, columns)
                if email_profiles:
                    user_repository.link_auth_user(db, email, auth_user_id)
                    profile = email_profiles[0]
                    return {
                        "id_user": profile["id_user"],
                        "role": profile["role"],
                        "nama": profile["nama"],
                    }

            raise HTTPException(
                status_code=401,
                detail="Profil user belum sinkron dengan database lokal.",
            )

        profile = profiles[0]
        return {
            "id_user": profile["id_user"],
            "role": profile["role"],
            "nama": profile["nama"],
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Otorisasi gagal: {str(e)}")
