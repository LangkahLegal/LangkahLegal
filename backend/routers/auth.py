import base64
import hashlib
import secrets
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from supabase import Client

from config import get_settings
from database import get_supabase_client

router = APIRouter()
security = HTTPBearer()


class SignUpPayload(BaseModel):
    email: str
    password: str
    name: str
    role: str
    emailRedirectTo: Optional[str] = None


class OtpLoginPayload(BaseModel):
    email: str
    emailRedirectTo: Optional[str] = None


class ResendOtpPayload(BaseModel):
    email: str
    emailRedirectTo: Optional[str] = None


class VerifyOtpPayload(BaseModel):
    email: str
    token: str
    type: Optional[str] = "email"


class PasswordLoginPayload(BaseModel):
    email: str
    password: str


class RefreshTokenPayload(BaseModel):
    refresh_token: str


class OAuthPayload(BaseModel):
    redirectTo: str
    provider: Optional[str] = "google"


class RolePayload(BaseModel):
    role: str


def _get_service_headers() -> dict:
    settings = get_settings()
    return {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {settings.supabase_key}",
        "Content-Type": "application/json",
    }


def _get_user_headers(access_token: str) -> dict:
    settings = get_settings()
    return {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


def _raise_auth_error(response: httpx.Response) -> None:
    detail = "Gagal memproses permintaan auth."
    try:
        payload = response.json()
        detail = (
            payload.get("msg")
            or payload.get("message")
            or payload.get("error_description")
            or payload.get("error")
            or detail
        )
    except ValueError:
        pass

    raise HTTPException(status_code=response.status_code, detail=detail)


def _generate_pkce_pair() -> tuple[str, str]:
    code_verifier = (
        base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode("ascii")
    )
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return code_verifier, code_challenge


async def _post_auth(
    path: str, payload: Optional[dict] = None, params: Optional[dict] = None
) -> dict:
    settings = get_settings()
    url = f"{settings.supabase_url}{path}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            url, json=payload, params=params, headers=_get_service_headers()
        )

    if response.status_code >= 400:
        _raise_auth_error(response)

    if response.content:
        return response.json()
    return {}


@router.post(
    "/signup",
    summary="Daftar akun baru",
    description="Mendaftarkan user baru menggunakan email/password. Dapat mengirim metadata role pada proses signup.",
)
async def sign_up(payload: SignUpPayload):
    options = {
        "data": {
            "full_name": payload.name,
            "role": payload.role,
        }
    }
    if payload.emailRedirectTo:
        options["email_redirect_to"] = payload.emailRedirectTo

    data = await _post_auth(
        "/auth/v1/signup",
        {
            "email": payload.email,
            "password": payload.password,
            "options": options,
        },
    )

    return {
        "data": {
            "session": data.get("session"),
            "user": data.get("user"),
        }
    }


@router.post(
    "/login-otp",
    summary="Kirim OTP login ke email",
    description="Mengirim OTP login ke email yang sudah terdaftar. Endpoint ini tidak membuat user baru.",
)
async def send_otp_login(payload: OtpLoginPayload):
    options = {
        "should_create_user": False,
    }
    if payload.emailRedirectTo:
        options["email_redirect_to"] = payload.emailRedirectTo

    await _post_auth(
        "/auth/v1/otp",
        {
            "email": payload.email,
            "options": options,
        },
    )

    return {"data": {"sent": True}}


@router.post(
    "/resend-signup-otp",
    summary="Kirim ulang OTP signup",
    description="Mengirim ulang OTP verifikasi email pada flow signup.",
)
async def resend_signup_otp(payload: ResendOtpPayload):
    options = {}
    if payload.emailRedirectTo:
        options["email_redirect_to"] = payload.emailRedirectTo

    await _post_auth(
        "/auth/v1/resend",
        {
            "type": "signup",
            "email": payload.email,
            "options": options,
        },
    )

    return {"data": {"sent": True}}


@router.post(
    "/verify-otp",
    summary="Verifikasi OTP",
    description="Memverifikasi token OTP dan mengembalikan session/access token bila berhasil.",
)
async def verify_otp(payload: VerifyOtpPayload):
    data = await _post_auth(
        "/auth/v1/verify",
        {
            "email": payload.email,
            "token": payload.token,
            "type": payload.type or "email",
        },
    )

    session_payload = data.get("session") or data

    return {
        "data": {
            "session": session_payload,
            "user": session_payload.get("user") if isinstance(session_payload, dict) else None,
        }
    }


@router.post(
    "/login-password",
    summary="Login dengan email & password",
    description="Login standar berbasis password. Mengembalikan session lengkap (access token + refresh token).",
)
async def login_with_password(payload: PasswordLoginPayload):
    data = await _post_auth(
        "/auth/v1/token",
        {
            "email": payload.email,
            "password": payload.password,
        },
        params={"grant_type": "password"},
    )

    return {
        "data": {
            "session": data,
            "user": data.get("user"),
        }
    }


@router.post(
    "/oauth/google",
    summary="Generate OAuth URL Google",
    description="Menghasilkan URL OAuth Google + PKCE verifier untuk flow login social pada frontend.",
)
async def sign_in_with_google(payload: OAuthPayload):
    code_verifier, code_challenge = _generate_pkce_pair()
    params = {
        "provider": payload.provider or "google",
        "redirect_to": payload.redirectTo,
        "code_challenge": code_challenge,
        "code_challenge_method": "s256",
    }
    settings = get_settings()
    url = f"{settings.supabase_url}/auth/v1/authorize?{urlencode(params)}"

    return {
        "data": {
            "url": url,
            "code_verifier": code_verifier,
        }
    }


@router.get(
    "/session",
    summary="Exchange OAuth code ke session",
    description="Menukar `code` OAuth + `code_verifier` PKCE menjadi session/access token.",
)
async def exchange_oauth_session(code: str, code_verifier: str):
    if not code or not code_verifier:
        raise HTTPException(status_code=400, detail="Kode OAuth tidak lengkap.")

    data = await _post_auth(
        "/auth/v1/token",
        {
            "auth_code": code,
            "code_verifier": code_verifier,
        },
        params={"grant_type": "pkce"},
    )

    return {
        "data": {
            "session": data,
            "user": data.get("user"),
        }
    }


@router.post(
    "/refresh",
    summary="Refresh access token",
    description="Menukar refresh token untuk mendapatkan session/access token baru.",
)
async def refresh_session(payload: RefreshTokenPayload):
    if not payload.refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token tidak tersedia.")

    data = await _post_auth(
        "/auth/v1/token",
        {
            "refresh_token": payload.refresh_token,
        },
        params={"grant_type": "refresh_token"},
    )

    return {
        "data": {
            "session": data,
            "user": data.get("user"),
        }
    }


def _get_auth_user(token: str, db: Client) -> dict:
    try:
        user_res = db.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Token tidak valid: {str(exc)}")

    if not user_res.user:
        raise HTTPException(
            status_code=401, detail="Token tidak valid atau kedaluwarsa"
        )

    return user_res.user


@router.get(
    "/profile",
    summary="Ambil profil user berdasarkan bearer token",
    description="Validasi access token ke Supabase lalu kembalikan profile user lokal (sinkronisasi auth_user_id jika dibutuhkan).",
)
def get_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_supabase_client),
):
    token = credentials.credentials
    user = _get_auth_user(token, db)

    result = (
        db.table("users")
        .select("id_user, nama, email, role, auth_user_id")
        .eq("auth_user_id", user.id)
        .execute()
    )

    if not result.data:
        if user.email:
            email_result = (
                db.table("users")
                .select("id_user, nama, email, role, auth_user_id")
                .eq("email", user.email)
                .execute()
            )
            if email_result.data:
                db.table("users").update({"auth_user_id": user.id}).eq(
                    "email", user.email
                ).execute()
                profile = email_result.data[0]
                profile["auth_user_id"] = user.id
                return {"data": profile}

        return {"data": None}

    profile = result.data[0]
    return {"data": profile}


@router.post(
    "/role",
    summary="Set role user setelah login",
    description="Menyimpan atau memperbarui role user (`client`/`konsultan`) pada tabel users lokal.",
)
def update_role(
    payload: RolePayload,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_supabase_client),
):
    token = credentials.credentials
    user = _get_auth_user(token, db)

    metadata = user.user_metadata or {}
    display_name = (
        metadata.get("full_name")
        or metadata.get("name")
        or (user.email.split("@")[0] if user.email else None)
        or "User"
    )

    payload_data = {
        "auth_user_id": user.id,
        "email": user.email,
        "nama": display_name,
        "role": payload.role,
    }

    db.table("users").upsert(payload_data, on_conflict="email").execute()

    result = db.table("users").select("role").eq("auth_user_id", user.id).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Gagal memperbarui role.")

    return {"data": result.data[0]}


@router.post(
    "/logout",
    summary="Logout session user",
    description="Mencabut session/token aktif user pada Supabase Auth.",
)
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    settings = get_settings()
    url = f"{settings.supabase_url}/auth/v1/logout"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(url, headers=_get_user_headers(token))

    if response.status_code >= 400:
        _raise_auth_error(response)

    return {"data": {"logout": True}}
