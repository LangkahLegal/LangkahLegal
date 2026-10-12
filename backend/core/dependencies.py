from fastapi import Depends, HTTPException, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from core.database import get_supabase_client


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

        user_profile = (
            db.table("users")
            .select("id_user, role, nama")
            .eq("auth_user_id", auth_user_id)
            .execute()
        )

        if not user_profile.data:
            email = user_res.user.email
            if email:
                email_profile = (
                    db.table("users")
                    .select("id_user, role, nama")
                    .eq("email", email)
                    .execute()
                )
                if email_profile.data:
                    db.table("users").update({"auth_user_id": auth_user_id}).eq(
                        "email", email
                    ).execute()
                    profile = email_profile.data[0]
                    return {
                        "id_user": profile["id_user"],
                        "role": profile["role"],
                        "nama": profile["nama"],
                    }

            raise HTTPException(
                status_code=401,
                detail="Profil user belum sinkron dengan database lokal.",
            )

        profile = user_profile.data[0]
        return {
            "id_user": profile["id_user"],
            "role": profile["role"],
            "nama": profile["nama"],
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Otorisasi gagal: {str(e)}")
