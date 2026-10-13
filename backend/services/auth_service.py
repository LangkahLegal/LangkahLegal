import base64
import hashlib
import json
import secrets
from typing import Optional
from urllib.parse import quote, urlencode

import httpx
from supabase import Client

from core.config import get_settings
from core.exceptions import AppError, BadRequestError, InternalError, UnauthorizedError
from helpers.profile import find_profile
from repositories import user_repository
from schemas.auth import (
    ForgotPasswordPayload,
    OAuthPayload,
    OtpLoginPayload,
    PasswordLoginPayload,
    ResendOtpPayload,
    RolePayload,
    SignUpPayload,
    VerifyOtpPayload,
)

PASSWORD_LOGIN = "password"


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

    raise AppError(detail, status_code=response.status_code)


def _generate_pkce_pair() -> tuple[str, str]:
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode("ascii")
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return code_verifier, code_challenge


async def _post_auth(path: str, payload: Optional[dict] = None, params: Optional[dict] = None) -> dict:
    settings = get_settings()
    url = f"{settings.supabase_url}{path}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(url, json=payload, params=params, headers=_get_service_headers())

    if response.status_code >= 400:
        _raise_auth_error(response)

    if response.content:
        return response.json()
    return {}


def _get_auth_user(token: str, db: Client):
    try:
        user_res = db.auth.get_user(token)
    except Exception as exc:
        raise UnauthorizedError(f"Token tidak valid: {str(exc)}")

    if not user_res.user:
        raise UnauthorizedError("Token tidak valid atau kedaluwarsa")

    return user_res.user


async def sign_up(payload: SignUpPayload) -> dict:
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
        "session": data.get("session"),
        "user": data.get("user"),
    }


async def send_otp_login(payload: OtpLoginPayload) -> dict:
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

    return {"sent": True}


async def resend_signup_otp(payload: ResendOtpPayload) -> dict:
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

    return {"sent": True}


async def verify_otp(payload: VerifyOtpPayload) -> dict:
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
        "session": session_payload,
        "user": session_payload.get("user") if isinstance(session_payload, dict) else None,
    }


async def login_with_password(payload: PasswordLoginPayload) -> dict:
    data = await _post_auth(
        "/auth/v1/token",
        {
            "email": payload.email,
            "password": payload.password,
        },
        params={"grant_type": "password"},
    )

    return {
        "session": data,
        "user": data.get("user"),
    }


def build_google_oauth_url(payload: OAuthPayload) -> dict:
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
        "url": url,
        "code_verifier": code_verifier,
    }


async def exchange_code(code: Optional[str], code_verifier: Optional[str]) -> dict:
    if not code:
        raise BadRequestError("Code tidak ditemukan.")
    if not code_verifier:
        raise BadRequestError(
            "Session login (PKCE verifier) tidak ditemukan atau sudah kadaluarsa. Silakan ulangi login."
        )

    data = await _post_auth(
        "/auth/v1/token",
        {
            "auth_code": code,
            "code_verifier": code_verifier,
        },
        params={"grant_type": "pkce"},
    )

    return {
        "session": data,
        "user": data.get("user"),
    }


async def refresh_session(refresh_token: Optional[str]) -> dict:
    if not refresh_token:
        raise BadRequestError("Refresh token tidak tersedia.")

    data = await _post_auth(
        "/auth/v1/token",
        {
            "refresh_token": refresh_token,
        },
        params={"grant_type": "refresh_token"},
    )

    return {
        "session": data,
        "user": data.get("user"),
    }


def get_profile(db: Client, token: str) -> Optional[dict]:
    user = _get_auth_user(token, db)

    return find_profile(db, user.id, user.email, "id_user, nama, email, role, auth_user_id")


def update_role(db: Client, token: str, payload: RolePayload) -> dict:
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

    existing = user_repository.list_by_auth_user_id(db, user.id, "id_user")

    if existing:
        profile = existing[0]
        user_repository.update(db, profile["id_user"], payload_data)
        return {**payload_data, "id_user": profile["id_user"]}

    created = user_repository.insert(db, payload_data)

    if created:
        return created[0]

    raise InternalError("Gagal memperbarui role.")


async def logout(token: str) -> None:
    settings = get_settings()
    url = f"{settings.supabase_url}/auth/v1/logout"

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(url, headers=_get_user_headers(token))

    if res.status_code >= 400:
        _raise_auth_error(res)


async def forgot_password(payload: ForgotPasswordPayload) -> dict:
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

    return {"sent": True}


def _token_claims(token: str) -> dict:
    try:
        payload = token.split(".")[1]
        return json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    except (IndexError, ValueError):
        return {}


async def _ensure_current_password(token: str, current_password: Optional[str]) -> None:
    claims = _token_claims(token)
    login_methods = {entry.get("method") for entry in claims.get("amr") or [] if isinstance(entry, dict)}
    if PASSWORD_LOGIN not in login_methods:
        return

    if not current_password:
        raise BadRequestError("Kata sandi saat ini wajib diisi.")

    try:
        await _post_auth(
            "/auth/v1/token",
            {"email": claims.get("email"), "password": current_password},
            params={"grant_type": "password"},
        )
    except AppError:
        raise BadRequestError("Kata sandi saat ini salah.")


async def reset_password(token: str, new_password: str, current_password: Optional[str] = None) -> None:
    await _ensure_current_password(token, current_password)

    settings = get_settings()
    url = f"{settings.supabase_url}/auth/v1/user"

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.put(
            url,
            headers=_get_user_headers(token),
            json={"password": new_password},
        )

    if res.status_code >= 400:
        _raise_auth_error(res)
