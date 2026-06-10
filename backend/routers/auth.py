import base64
import hashlib
import secrets
from typing import Optional
from urllib.parse import quote, urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status, Cookie
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from config import get_settings
from database import get_supabase_client
from limiter import limiter

from schemas.auth import (
    ForgotPasswordPayload,
    ResetPasswordPayload,
    OAuthPayload,
    OtpLoginPayload,
    PasswordLoginPayload,
    RefreshTokenPayload,
    ResendOtpPayload,
    RolePayload,
    SignUpPayload,
    VerifyOtpPayload,
)

router = APIRouter()
security = HTTPBearer(auto_error=False)


def _get_cookie_flags() -> dict:
    settings = get_settings()
    is_production = settings.app_env.lower() == "production"
    cookie_domain = settings.cookie_domain.strip() or None

    return {
        "samesite": "none" if is_production else "lax",
        "secure": is_production,
        "domain": cookie_domain,
    }

def get_token_from_request(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    ll_token: Optional[str] = Cookie(None)
) -> str:
    if credentials and credentials.credentials:
        return credentials.credentials
    if ll_token:
        return ll_token
    raise HTTPException(status_code=401, detail="Token tidak valid atau tidak ditemukan")

def _set_auth_cookies(response: Response, session_data: dict):
    if not isinstance(session_data, dict):
        return

    cookie_flags = _get_cookie_flags()
        
    access_token = session_data.get("access_token")
    refresh_token = session_data.get("refresh_token")
    expires_in = session_data.get("expires_in", 3600)
    
    if access_token:
        response.set_cookie(
            key="ll_token",
            value=access_token,
            max_age=expires_in,
            httponly=True,
            samesite=cookie_flags["samesite"],
            secure=cookie_flags["secure"],
            domain=cookie_flags["domain"],
            path="/"
        )
    
    if refresh_token:
        response.set_cookie(
            key="ll_refresh",
            value=refresh_token,
            max_age=30 * 24 * 60 * 60,
            httponly=True,
            samesite=cookie_flags["samesite"],
            secure=cookie_flags["secure"],
            domain=cookie_flags["domain"],
            path="/"
        )

def _clear_auth_cookies(response: Response):
    cookie_flags = _get_cookie_flags()
    response.delete_cookie("ll_token", path="/", domain=cookie_flags["domain"])
    response.delete_cookie("ll_refresh", path="/", domain=cookie_flags["domain"])
    response.delete_cookie("ll_oauth_verifier", path="/", domain=cookie_flags["domain"])
    response.delete_cookie("ll_role", path="/", domain=cookie_flags["domain"])

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
    description="Mendaftarkan user baru menggunakan email/password.",
)
async def sign_up(payload: SignUpPayload, response: Response):
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
    
    session = data.get("session")
    if session:
        _set_auth_cookies(response, session)

    return {
        "data": {
            "session": session,
            "user": data.get("user"),
        }
    }


@router.post(
    "/login-otp",
    summary="Kirim OTP login ke email",
    description="Mengirim OTP login ke email yang sudah terdaftar. Endpoint ini tidak membuat user baru.",
)
@limiter.limit("3/minute")
async def send_otp_login(request: Request, payload: OtpLoginPayload):
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
@limiter.limit("3/minute")
async def resend_signup_otp(request: Request, payload: ResendOtpPayload):
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
async def verify_otp(payload: VerifyOtpPayload, response: Response):
    data = await _post_auth(
        "/auth/v1/verify",
        {
            "email": payload.email,
            "token": payload.token,
            "type": payload.type or "email",
        },
    )

    session_payload = data.get("session") or data
    _set_auth_cookies(response, session_payload)

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
async def login_with_password(payload: PasswordLoginPayload, response: Response):
    data = await _post_auth(
        "/auth/v1/token",
        {
            "email": payload.email,
            "password": payload.password,
        },
        params={"grant_type": "password"},
    )

    _set_auth_cookies(response, data)

    return {
        "data": {
            "session": data,
            "user": data.get("user"),
        }
    }


@router.post(
    "/oauth/google",
    summary="Generate OAuth URL Google",
    description="Menghasilkan URL OAuth Google + PKCE verifier.",
)
async def sign_in_with_google(payload: OAuthPayload, response: Response):
    code_verifier, code_challenge = _generate_pkce_pair()
    params = {
        "provider": payload.provider or "google",
        "redirect_to": payload.redirectTo,
        "code_challenge": code_challenge,
        "code_challenge_method": "s256",
    }
    settings = get_settings()
    url = f"{settings.supabase_url}/auth/v1/authorize?{urlencode(params)}"
    cookie_flags = _get_cookie_flags()

    response.set_cookie(
        key="ll_oauth_verifier",
        value=code_verifier,
        max_age=3600,
        httponly=True,
        samesite=cookie_flags["samesite"],
        secure=cookie_flags["secure"],
        domain=cookie_flags["domain"],
        path="/"
    )

    return {
        "data": {
            "url": url,
            "code_verifier": code_verifier,
        }
    }


@router.post(
    "/exchange-code",
    summary="Tukar OAuth Code dengan Session",
    description="Menukar code dari URL callback dengan session/access token.",
)
async def exchange_code(
    request: Request,
    response: Response,
    payload: dict,
):
    code = payload.get("code")
    code_verifier = payload.get("code_verifier") or request.cookies.get("ll_oauth_verifier")
    
    if not code:
        raise HTTPException(status_code=400, detail="Code tidak ditemukan.")
    if not code_verifier:
        raise HTTPException(status_code=400, detail="Session login (PKCE verifier) tidak ditemukan atau sudah kadaluarsa. Silakan ulangi login.")
        
    data = await _post_auth(
        "/auth/v1/token",
        {
            "auth_code": code,
            "code_verifier": code_verifier,
        },
        params={"grant_type": "pkce"},
    )
    
    _set_auth_cookies(response, data)
    response.delete_cookie("ll_oauth_verifier", path="/", domain=_get_cookie_flags()["domain"])
    
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
async def refresh_session(request: Request, response: Response, payload: dict = None):
    refresh_token = request.cookies.get("ll_refresh")
    if payload and payload.get("refresh_token"):
        refresh_token = payload.get("refresh_token")
        
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token tidak tersedia.")

    data = await _post_auth(
        "/auth/v1/token",
        {
            "refresh_token": refresh_token,
        },
        params={"grant_type": "refresh_token"},
    )

    _set_auth_cookies(response, data)

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
    description="Validasi access token ke Supabase lalu kembalikan profile user lokal.",
)
def get_profile(
    response: Response,
    token: str = Depends(get_token_from_request),
    db: Client = Depends(get_supabase_client),
):
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
                response.set_cookie("ll_role", profile["role"], max_age=30*24*3600, path="/", samesite="lax")
                return {"data": profile}

        return {"data": None}

    profile = result.data[0]
    response.set_cookie("ll_role", profile["role"], max_age=30*24*3600, path="/", samesite="lax")
    return {"data": profile}


@router.post(
    "/role",
    summary="Set role user setelah login",
    description="Menyimpan atau memperbarui role user.",
)
def update_role(
    payload: RolePayload,
    response: Response,
    token: str = Depends(get_token_from_request),
    db: Client = Depends(get_supabase_client),
):
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

    result_existing = db.table("users").select("id_user").eq("auth_user_id", user.id).execute()
    
    if result_existing.data:
        profile = result_existing.data[0]
        db.table("users").update(payload_data).eq("id_user", profile["id_user"]).execute()
        response.set_cookie("ll_role", payload.role, max_age=30*24*3600, path="/", samesite="lax")
        return {"data": {**payload_data, "id_user": profile["id_user"]}}

    result = db.table("users").insert(payload_data).execute()
    
    if result.data:
        response.set_cookie("ll_role", payload.role, max_age=30*24*3600, path="/", samesite="lax")
        return {"data": result.data[0]}

    raise HTTPException(status_code=500, detail="Gagal memperbarui role.")


@router.post(
    "/logout",
    summary="Logout session user",
    description="Mencabut session/token aktif user pada Supabase Auth dan menghapus cookie.",
)
async def logout(response: Response, token: str = Depends(get_token_from_request)):
    settings = get_settings()
    url = f"{settings.supabase_url}/auth/v1/logout"

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(url, headers=_get_user_headers(token))

    _clear_auth_cookies(response)

    if res.status_code >= 400:
        _raise_auth_error(res)

    return {"data": {"logout": True}}


@router.post(
    "/forgot-password",
    summary="Kirim tautan reset password",
    description="Mengirimkan tautan reset password ke email user.",
)
@limiter.limit("3/minute")
async def forgot_password(request: Request, payload: ForgotPasswordPayload, response: Response):
    body = {"email": payload.email}

    params = {}
    if payload.emailRedirectTo:
        separator = "&" if "?" in payload.emailRedirectTo else "?"
        params["redirect_to"] = f"{payload.emailRedirectTo}{separator}email={quote(payload.email)}"

    await _post_auth(
        "/auth/v1/recover",
        payload=body,
        params=params,
    )

    return {"data": {"sent": True}}


@router.post(
    "/reset-password",
    summary="Reset password user",
    description="Mengubah password user setelah berhasil memverifikasi tautan reset.",
)
async def reset_password(
    payload: ResetPasswordPayload,
    response: Response,
    token: str = Depends(get_token_from_request),
):
    settings = get_settings()
    url = f"{settings.supabase_url}/auth/v1/user"

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.put(
            url,
            headers=_get_user_headers(token),
            json={"password": payload.new_password},
        )

    if res.status_code >= 400:
        _raise_auth_error(res)

    _clear_auth_cookies(response)

    return {"data": {"updated": True}}

