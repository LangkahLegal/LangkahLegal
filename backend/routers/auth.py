from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, Cookie
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
    ResendOtpPayload,
    RolePayload,
    SignUpPayload,
    VerifyOtpPayload,
)
from services import auth_service

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

def _set_role_cookie(response: Response, role: str):
    response.set_cookie("ll_role", role, max_age=30*24*3600, path="/", samesite="lax")


@router.post(
    "/signup",
    summary="Daftar akun baru",
    description="Mendaftarkan user baru menggunakan email/password.",
)
async def sign_up(payload: SignUpPayload, response: Response):
    data = await auth_service.sign_up(payload)
    _set_auth_cookies(response, data["session"])
    return {"data": data}


@router.post(
    "/login-otp",
    summary="Kirim OTP login ke email",
    description="Mengirim OTP login ke email yang sudah terdaftar. Endpoint ini tidak membuat user baru.",
)
@limiter.limit("3/minute")
async def send_otp_login(request: Request, payload: OtpLoginPayload):
    return {"data": await auth_service.send_otp_login(payload)}


@router.post(
    "/resend-signup-otp",
    summary="Kirim ulang OTP signup",
    description="Mengirim ulang OTP verifikasi email pada flow signup.",
)
@limiter.limit("3/minute")
async def resend_signup_otp(request: Request, payload: ResendOtpPayload):
    return {"data": await auth_service.resend_signup_otp(payload)}


@router.post(
    "/verify-otp",
    summary="Verifikasi OTP",
    description="Memverifikasi token OTP dan mengembalikan session/access token bila berhasil.",
)
async def verify_otp(payload: VerifyOtpPayload, response: Response):
    data = await auth_service.verify_otp(payload)
    _set_auth_cookies(response, data["session"])
    return {"data": data}


@router.post(
    "/login-password",
    summary="Login dengan email & password",
    description="Login standar berbasis password. Mengembalikan session lengkap (access token + refresh token).",
)
async def login_with_password(payload: PasswordLoginPayload, response: Response):
    data = await auth_service.login_with_password(payload)
    _set_auth_cookies(response, data["session"])
    return {"data": data}


@router.post(
    "/oauth/google",
    summary="Generate OAuth URL Google",
    description="Menghasilkan URL OAuth Google + PKCE verifier.",
)
async def sign_in_with_google(payload: OAuthPayload, response: Response):
    data = auth_service.build_google_oauth_url(payload)
    cookie_flags = _get_cookie_flags()

    response.set_cookie(
        key="ll_oauth_verifier",
        value=data["code_verifier"],
        max_age=3600,
        httponly=True,
        samesite=cookie_flags["samesite"],
        secure=cookie_flags["secure"],
        domain=cookie_flags["domain"],
        path="/"
    )

    return {"data": data}


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

    data = await auth_service.exchange_code(code, code_verifier)

    _set_auth_cookies(response, data["session"])
    response.delete_cookie("ll_oauth_verifier", path="/", domain=_get_cookie_flags()["domain"])

    return {"data": data}


@router.post(
    "/refresh",
    summary="Refresh access token",
    description="Menukar refresh token untuk mendapatkan session/access token baru.",
)
async def refresh_session(request: Request, response: Response, payload: dict = None):
    refresh_token = request.cookies.get("ll_refresh")
    if payload and payload.get("refresh_token"):
        refresh_token = payload.get("refresh_token")

    data = await auth_service.refresh_session(refresh_token)

    _set_auth_cookies(response, data["session"])

    return {"data": data}


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
    profile = auth_service.get_profile(db, token)
    if profile is not None:
        _set_role_cookie(response, profile["role"])
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
    data = auth_service.update_role(db, token, payload)
    _set_role_cookie(response, payload.role)
    return {"data": data}


@router.post(
    "/logout",
    summary="Logout session user",
    description="Mencabut session/token aktif user pada Supabase Auth dan menghapus cookie.",
)
async def logout(response: Response, token: str = Depends(get_token_from_request)):
    await auth_service.logout(token)
    _clear_auth_cookies(response)
    return {"data": {"logout": True}}


@router.post(
    "/forgot-password",
    summary="Kirim tautan reset password",
    description="Mengirimkan tautan reset password ke email user.",
)
@limiter.limit("3/minute")
async def forgot_password(request: Request, payload: ForgotPasswordPayload, response: Response):
    return {"data": await auth_service.forgot_password(payload)}


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
    await auth_service.reset_password(token, payload.new_password)
    _clear_auth_cookies(response)
    return {"data": {"updated": True}}
